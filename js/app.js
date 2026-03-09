const TIME_PER_QUESTION = 20;

class QuizApp {
    constructor() {
        this.players = {}; // id -> { name, score, active, answeredIndex, answerTime }
        this.currentQuestionIndex = 0;
        this.timerInterval = null;
        this.playerTimerInterval = null;
        this.timeLeft = 0;
        this.isLocal = false; // True wenn kein PeerJS verwendet wird (Singleplayer)
        this.questionStartTime = 0;
        this.previousScreen = ''; // Für den "Zurück" Button im Overview

        // Eigene Spieler-Daten
        this.myScore = 0;
        this.myRank = 1;
        this.hasAnswered = false;

        // Netzwerk callbacks binden
        window.network.onPlayerJoined = this.onPlayerJoined.bind(this);
        window.network.onPlayerLeft = this.onPlayerLeft.bind(this);
        window.network.onAnswerReceived = this.onAnswerReceived.bind(this);
        window.network.onHostCommand = this.onHostCommand.bind(this);
    }

    // --- NAVIGATION ---
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    // --- INITIALISIERUNG ---
    async initHost() {
        try {
            const gameId = await window.network.initHost();
            document.getElementById('host-game-id').innerText = gameId;
            
            // Generate QR Code
            const currentUrl = window.location.href.split('?')[0];
            const joinUrl = `${currentUrl}?join=${gameId}`;
            
            new QRCode(document.getElementById("qrcode"), {
                text: joinUrl,
                width: 150,
                height: 150,
                colorDark : "#193264",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.L
            });

            this.showScreen('screen-host-lobby');
        } catch (err) {
            alert("Fehler beim Starten des Hosts: " + err);
        }
    }

    initPlayer() {
        this.showScreen('screen-player-login');
        
        // Check URL params for auto-fill Game PIN
        const urlParams = new URLSearchParams(window.location.search);
        const joinPin = urlParams.get('join');
        if (joinPin) {
            document.getElementById('input-game-id').value = joinPin;
        }
    }

    initLocal() {
        this.isLocal = true;
        this.currentQuestionIndex = 0;
        // Lokaler Spieler anlegen
        this.players['local'] = { name: 'Du', score: 0, active: true };
        this.renderHostQuestion();
        this.showScreen('screen-host-question'); // Local spielt direkt im Host-Screen
    }

    // --- HOST LOGIK ---
    onPlayerJoined(id, name) {
        this.players[id] = { name: name, score: 0, scoreHistory: [], active: true, answeredIndex: -1, answerTime: 0 };
        this.updatePlayerList();
        
        if (Object.keys(this.players).length > 0) {
            document.getElementById('btn-start-quiz').disabled = false;
        }
    }

    onPlayerLeft(id) {
        if (this.players[id]) {
            this.players[id].active = false;
        }
        this.updatePlayerList();
    }

    updatePlayerList() {
        const list = document.getElementById('player-list');
        list.innerHTML = '';
        let activeCount = 0;
        
        for (const [id, p] of Object.entries(this.players)) {
            if (p.active) {
                activeCount++;
                const li = document.createElement('li');
                li.innerText = p.name;
                list.appendChild(li);
            }
        }
        document.getElementById('player-count').innerText = activeCount;
    }

    startQuiz() {
        this.currentQuestionIndex = 0;
        window.network.broadcast({ cmd: 'wait' }); // Clients in Wait-Screen
        this.renderHostQuestion();
    }

    renderHostQuestion() {
        const q = questions[this.currentQuestionIndex];
        
        // Reset answers
        for (let pid in this.players) {
            this.players[pid].answeredIndex = -1;
            this.players[pid].answerTime = 0;
        }

        document.getElementById('host-q-num').innerText = (this.currentQuestionIndex + 1);
        document.getElementById('host-q-text').innerText = q.text;
        
        const ansCards = document.querySelectorAll('#host-answers .answer-card');
        ansCards.forEach((card, idx) => {
            card.className = 'answer-card'; // Reset CSS
            card.querySelector('.text').innerText = q.options[idx];
        });

        document.getElementById('answers-received').innerText = `0 Antworten erhalten`;
        
        this.showScreen('screen-host-question');
        this.startTimer();

        if (!this.isLocal) {
            window.network.broadcast({ 
                cmd: 'question', 
                text: q.text,
                answers: q.options,
                current: this.currentQuestionIndex + 1,
                total: questions.length
            });
            window.network.broadcast({
                cmd: 'start_timer',
                timePerQuestion: TIME_PER_QUESTION,
                hostStartTime: this.questionStartTime
            });
        }
    }

    startTimer() {
        this.timeLeft = TIME_PER_QUESTION;
        this.questionStartTime = Date.now();
        const tEl = document.getElementById('host-timer');
        const pEl = document.getElementById('host-progress');
        
        tEl.innerText = this.timeLeft;
        pEl.style.width = '100%';

        clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            tEl.innerText = this.timeLeft;
            pEl.style.width = `${(this.timeLeft / TIME_PER_QUESTION) * 100}%`;

            if (this.timeLeft <= 0) {
                this.endQuestion();
            }
        }, 1000);
    }

    skipTimer() {
        this.timeLeft = 0;
        this.endQuestion();
    }

    onAnswerReceived(playerId, answerIndex) {
        if (this.players[playerId] && this.players[playerId].answeredIndex === -1 && this.timeLeft > 0) {
            this.players[playerId].answeredIndex = answerIndex;
            const timeTaken = Date.now() - this.questionStartTime;
            this.players[playerId].answerTime = timeTaken;
            
            this.updateAnswersCount();

            // Automatisch auflösen wenn alle geantwortet haben
            const activeCount = Object.values(this.players).filter(p => p.active).length;
            const answeredCount = Object.values(this.players).filter(p => p.active && p.answeredIndex !== -1).length;
            
            if (answeredCount >= activeCount) {
                this.endQuestion();
            }
        }
    }

    updateAnswersCount() {
        const answeredCount = Object.values(this.players).filter(p => p.active && p.answeredIndex !== -1).length;
        document.getElementById('answers-received').innerText = `${answeredCount} Antworten erhalten`;
    }

    endQuestion() {
        clearInterval(this.timerInterval);
        const q = questions[this.currentQuestionIndex];
        
        // Punkte berechnen
        // Max 1000 pkt. (100% == 0s), 50% decay over TIME_PER_QUESTION
        for (let pid in this.players) {
            const p = this.players[pid];
            
            // Ensure scoreHistory array is big enough
            while(p.scoreHistory.length <= this.currentQuestionIndex) {
                p.scoreHistory.push(0);
            }

            if (p.active && p.answeredIndex === q.correctIndex) {
                const ratio = Math.max(0, 1 - (p.answerTime / (TIME_PER_QUESTION * 1000)));
                const points = Math.round(500 + (500 * ratio));
                
                // Track points for this specific question
                p.scoreHistory[this.currentQuestionIndex] = points;
                p.score = p.scoreHistory.reduce((sum, val) => sum + val, 0);
                
                if (!this.isLocal) {
                    window.network.connections[pid]?.send({ cmd: 'result', correct: true, points: points, totalScore: p.score });
                }
            } else if (p.active && p.answeredIndex !== -1) {
                p.scoreHistory[this.currentQuestionIndex] = 0;
                p.score = p.scoreHistory.reduce((sum, val) => sum + val, 0);
                if (!this.isLocal) {
                    window.network.connections[pid]?.send({ cmd: 'result', correct: false, points: 0, totalScore: p.score });
                }
            } else if (p.active) {
                // Timeout
                p.scoreHistory[this.currentQuestionIndex] = 0;
                p.score = p.scoreHistory.reduce((sum, val) => sum + val, 0);
                if (!this.isLocal) {
                    window.network.connections[pid]?.send({ cmd: 'result', correct: false, points: 0, totalScore: p.score });
                }
            }
        }

        // Host UI aktualisieren
        this.renderHostResult();
    }

    renderHostResult() {
        const q = questions[this.currentQuestionIndex];
        
        const ansCards = document.querySelectorAll('#host-answers .answer-card');
        ansCards.forEach((card, idx) => {
            if (idx === q.correctIndex) card.classList.add('correct');
            else card.classList.add('wrong');
        });

        document.getElementById('host-correct-text').innerText = `${String.fromCharCode(65 + q.correctIndex)}: ${q.options[q.correctIndex]}`;

        // 1. Calculate Answer Distribution
        const distribution = [0, 0, 0];
        const correctPlayers = [];

        const activePlayers = Object.values(this.players).filter(p => p.active || p.score > 0);

        activePlayers.forEach(p => {
            if (p.answeredIndex >= 0 && p.answeredIndex <= 2) {
                distribution[p.answeredIndex]++;
                
                // 2. Collect Correct Players
                if (p.answeredIndex === q.correctIndex) {
                    correctPlayers.push(p);
                }
            }
        });

        // Update Distribution UI
        const distContainer = document.getElementById('host-answers-distribution');
        distContainer.innerHTML = '';
        ['A', 'B', 'C'].forEach((letter, i) => {
            const count = distribution[i];
            const div = document.createElement('div');
            div.className = 'dist-item';
            div.innerHTML = `<strong>${letter}:</strong> ${count} Antwort${count !== 1 ? 'en' : ''}`;
            if (i === q.correctIndex) div.style.color = 'var(--color-correct)';
            distContainer.appendChild(div);
        });

        // Update Winner UI (Top 5 Fastest Correct)
        const winnerContainer = document.getElementById('host-round-winner');
        winnerContainer.innerHTML = ''; // Clear old content
        
        if (correctPlayers.length > 0) {
            // Sort by lowest answer time first
            correctPlayers.sort((a,b) => a.answerTime - b.answerTime);
            
            const listEl = document.createElement('ul');
            listEl.style.listStyle = 'none';
            listEl.style.padding = '0';
            listEl.style.margin = '10px 0 0 0';
            listEl.style.textAlign = 'left';

            const limit = Math.min(5, correctPlayers.length);
            for(let i=0; i<limit; i++) {
                const p = correctPlayers[i];
                const timeInSeconds = (p.answerTime / 1000).toFixed(1);
                const li = document.createElement('li');
                li.style.padding = '5px 0';
                li.style.borderBottom = '1px solid #eee';
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.innerHTML = `<span><strong style="color:var(--color-primary)">${i+1}.</strong> ${p.name}</span> <span style="color:#666">${timeInSeconds} s</span>`;
                listEl.appendChild(li);
            }
            winnerContainer.appendChild(listEl);
        } else {
            winnerContainer.innerHTML = `<em>Niemand</em>`;
        }

        this.showScreen('screen-host-result');
        
        if (this.currentQuestionIndex >= questions.length - 1) {
            document.getElementById('btn-next-question').innerText = "Ergebnisse anzeigen";
            this.confetti();
        }
    }

    showIntermediateRanking(isGameOver = false) {
        // Ranking sortieren
        const sortedPlayers = Object.values(this.players).filter(p => p.active || p.score > 0).sort((a,b) => b.score - a.score);
        
        const list = document.getElementById('host-ranking-list');
        list.innerHTML = '';
        
        for (let i = 0; i < sortedPlayers.length; i++) {
            const p = sortedPlayers[i];
            const li = document.createElement('li');
            li.innerHTML = `<span>${i+1}. ${p.name}</span> <span class="points">${p.score} pt</span>`;
            list.appendChild(li);
            
            // Send ranking to players
            const pId = Object.keys(this.players).find(key => this.players[key] === p);
            if (pId && !this.isLocal && window.network.connections[pId] && !isGameOver) {
                window.network.connections[pId].send({ cmd: 'rank_update', rank: i+1 });
            }
        }

        const nextBtn = document.getElementById('btn-ranking-next');
        const backBtn = document.getElementById('btn-back-to-podium');

        if (!isGameOver) {
            backBtn.style.display = 'none';
            nextBtn.style.display = 'inline-block';
            if (this.currentQuestionIndex >= questions.length - 1) {
                nextBtn.innerText = "Ergebnisse anzeigen";
            } else {
                nextBtn.innerText = "Nächste Frage";
            }
        }

        this.showScreen('screen-host-ranking');
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= questions.length) {
            this.showFinalRanking();
        } else {
            this.renderHostQuestion();
        }
    }

    showFinalRanking() {
        const sortedPlayers = Object.values(this.players).filter(p => p.active || p.score > 0).sort((a,b) => b.score - a.score);
        const podium = document.getElementById('podium-container');
        podium.innerHTML = '';

        const getPodiumEl = (player, place) => {
            return `
                <div class="podium-place place-${place}">
                    <div class="podium-name">${player.name}<br><small>${player.score}</small></div>
                    ${place}
                </div>
            `;
        };

        if (sortedPlayers[1]) podium.innerHTML += getPodiumEl(sortedPlayers[1], 2);
        if (sortedPlayers[0]) podium.innerHTML += getPodiumEl(sortedPlayers[0], 1);
        if (sortedPlayers[2]) podium.innerHTML += getPodiumEl(sortedPlayers[2], 3);

        this.showScreen('screen-host-final');
        if (!this.isLocal) window.network.broadcast({ cmd: 'final' });
        this.confetti();
    }

    toggleFinalViews(view) {
        if (view === 'ranking') {
            // Zeige die Liste, verstecke "Nächste Frage", zeige "Zurück"
            document.getElementById('btn-ranking-next').style.display = 'none';
            document.getElementById('btn-back-to-podium').style.display = 'inline-block';
            this.showIntermediateRanking(true); // true = game over mode
        } else {
            // Zurück zum Podest
            this.showScreen('screen-host-final');
        }
    }

    // --- OVERVIEW & JUMP NAVIGATION ---
    showOverview() {
        // Track where we came from so "Zurück" knows where to go
        this.previousScreen = document.querySelector('.screen.active').id;
        
        const list = document.getElementById('overview-list');
        list.innerHTML = '';

        questions.forEach((q, idx) => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline overview-btn';
            if (idx === this.currentQuestionIndex) {
                btn.classList.add('active-question');
            }
            btn.innerHTML = `<strong>Frage ${idx + 1}:</strong><br/><span style="font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;">${q.text}</span>`;
            
            btn.onclick = () => {
                if(confirm(`Möchtest du wirklich zu Frage ${idx + 1} springen? Alle Punkte ab dieser Frage werden gelöscht.`)) {
                    this.jumpToQuestion(idx);
                }
            };
            
            list.appendChild(btn);
        });

        this.showScreen('screen-host-overview');
    }

    closeOverview() {
        if (this.previousScreen) {
            this.showScreen(this.previousScreen);
        }
    }

    jumpToQuestion(index) {
        this.currentQuestionIndex = index;
        
        // Rollback score history for all players up to the new current question
        for (let pid in this.players) {
            const p = this.players[pid];
            // keep history strictly before `index`, then recalculate score
            p.scoreHistory = p.scoreHistory.slice(0, index);
            p.score = p.scoreHistory.reduce((sum, val) => sum + val, 0);
        }
        
        // Render the new question (this also broadcasts 'start_timer' and 'question' commands to clients)
        this.renderHostQuestion();
    }


    // --- CLIENT LOGIK ---
    async joinGame() {
        const gameId = document.getElementById('input-game-id').value.trim();
        const playerName = document.getElementById('input-player-name').value.trim();
        const errEl = document.getElementById('join-error');

        if (!gameId || !playerName) {
            errEl.innerText = "Bitte PIN und Namen eingeben.";
            return;
        }

        try {
            errEl.innerText = "Verbinde...";
            await window.network.initClient(gameId, playerName);
            errEl.innerText = "";
            
            document.getElementById('wait-message').innerText = "Du bist drin! Warte auf Start...";
            this.showScreen('screen-wait');
        } catch (err) {
            errEl.innerText = "Verbindung fehlgeschlagen. PIN richtig?";
        }
    }

    onHostCommand(data) {
        if (data.cmd === 'wait') {
            document.getElementById('wait-message').innerText = "Mach dich bereit!";
            this.showScreen('screen-wait');
        } else if (data.cmd === 'question') {
            this.hasAnswered = false;
            document.getElementById('player-answered-msg').classList.add('hidden');
            
            // Fragentext und Optionen auf dem Smartphone anzeigen
            document.getElementById('player-q-text').innerText = data.text;
            document.getElementById('player-ans-a').innerText = data.answers[0];
            document.getElementById('player-ans-b').innerText = data.answers[1];
            document.getElementById('player-ans-c').innerText = data.answers[2];
            if (data.current && data.total) {
                document.getElementById('player-q-number').innerText = `Frage ${data.current} von ${data.total}`;
            }
            
            this.showScreen('screen-player-question');
        } else if (data.cmd === 'start_timer') {
            const tEl = document.getElementById('player-timer');
            const pEl = document.getElementById('player-progress');
            
            // Initial render
            tEl.innerText = data.timePerQuestion;
            pEl.style.width = '100%';
            
            clearInterval(this.playerTimerInterval);
            
            this.playerTimerInterval = setInterval(() => {
                // Calculate time passed since host started the question to avoid drift
                // (using local Date.now() assuming the clocks are relatively close, or just count down 1s at a time)
                // For a simple robust approach, just count down locally like the host does.
                let currentVal = parseInt(tEl.innerText);
                currentVal--;
                
                if (currentVal >= 0) {
                    tEl.innerText = currentVal;
                    pEl.style.width = `${(currentVal / data.timePerQuestion) * 100}%`;
                }

                if (currentVal <= 0) {
                    clearInterval(this.playerTimerInterval);
                }
            }, 1000);

        } else if (data.cmd === 'result') {
            clearInterval(this.playerTimerInterval);
            const titleEl = document.getElementById('player-result-title');
            const iconEl = document.getElementById('player-result-icon');
            const ptsEl = document.getElementById('player-result-points');
            
            if (data.correct) {
                titleEl.innerText = "Richtig!";
                iconEl.innerText = "✓";
                iconEl.style.color = "var(--color-correct)";
                ptsEl.innerText = data.points;
            } else {
                titleEl.innerText = "Leider Falsch!";
                iconEl.innerText = "✗";
                iconEl.style.color = "var(--color-wrong)";
                ptsEl.innerText = "0";
            }
            
            this.myScore = data.totalScore;
            document.getElementById('player-total-score').innerText = this.myScore;
            
            this.showScreen('screen-player-result');
        } else if (data.cmd === 'rank_update') {
            this.myRank = data.rank;
            document.getElementById('player-rank').innerText = this.myRank;
        } else if (data.cmd === 'final') {
            document.getElementById('player-final-rank').innerText = `#${this.myRank}`;
            document.getElementById('player-final-score').innerText = this.myScore;
            this.showScreen('screen-player-final');
        }
    }

    submitAnswer(index) {
        if (this.hasAnswered) return;
        
        if (this.isLocal) {
            // Im lokalen Modus beantwortet man direkt
            this.players['local'].answeredIndex = index;
            this.players['local'].answerTime = Date.now() - this.questionStartTime;
            this.endQuestion(); // Sofort auflösen
        } else {
            this.hasAnswered = true;
            clearInterval(this.playerTimerInterval);
            window.network.sendAnswer(index);
            document.getElementById('player-answered-msg').classList.remove('hidden');
        }
    }

    // --- EFFECTS ---
    confetti() {
        if (typeof confetti === 'function') {
            const duration = 3 * 1000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#03256a', '#E83300', '#00A6EB', '#b1ca00']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#03256a', '#E83300', '#00A6EB', '#b1ca00']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    }
}

// Global App Instance
window.app = new QuizApp();
