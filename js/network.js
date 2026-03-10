/**
 * Network Logic (Firebase Realtime Database)
 * Ersetzt PeerJS WebRTC mit Firebase für zuverlässige Verbindungen
 * durch jedes Netzwerk (Gast-WLAN, Mobilfunk, Firewalls etc.)
 */

// Firebase Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyA2gon_Colg305sumvjj54qiHECSpV2j_A",
    authDomain: "jekits-quiz.firebaseapp.com",
    databaseURL: "https://jekits-quiz-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "jekits-quiz",
    storageBucket: "jekits-quiz.firebasestorage.app",
    messagingSenderId: "765538515312",
    appId: "1:765538515312:web:0cfea712ca5ee45bf0f7b5"
};

firebase.initializeApp(firebaseConfig);

class QuizNetwork {
    constructor() {
        this.db = firebase.database();
        this.connections = {}; // Backward-kompatibel mit app.js
        this.role = null;
        this.myId = null;
        this.gamePin = null;
        this.gameRef = null;

        // Callbacks (gleiche wie vorher)
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onAnswerReceived = null;
        this.onHostCommand = null;
    }

    // ===================== HOST =====================

    initHost() {
        this.role = 'host';
        this.gamePin = this.generateGameId();
        this.gameRef = this.db.ref('games/' + this.gamePin);

        return new Promise((resolve, reject) => {
            // Prüfe ob PIN schon existiert
            this.gameRef.once('value').then(snap => {
                if (snap.exists()) {
                    // Kollision → neuen Code
                    this.gamePin = this.generateGameId();
                    this.gameRef = this.db.ref('games/' + this.gamePin);
                }

                // Spielraum erstellen
                return this.gameRef.set({
                    host: true,
                    created: firebase.database.ServerValue.TIMESTAMP
                });
            }).then(() => {
                console.log('[JeKits] Raum erstellt mit PIN:', this.gamePin);

                // Aufräumen wenn Host Seite schließt
                this.gameRef.onDisconnect().remove();

                // --- Listener: Neue Spieler ---
                this.gameRef.child('players').on('child_added', (snap) => {
                    const playerId = snap.key;
                    const data = snap.val();

                    // Erstelle ein Verbindungs-Objekt (Backward-Kompatibilität mit app.js)
                    this.connections[playerId] = {
                        send: (msgData) => {
                            this.gameRef.child('playerMsgs/' + playerId).push(msgData);
                        },
                        open: true
                    };

                    if (this.onPlayerJoined) {
                        this.onPlayerJoined(playerId, data.name);
                    }
                });

                // --- Listener: Spieler verlassen ---
                this.gameRef.child('players').on('child_removed', (snap) => {
                    const playerId = snap.key;
                    delete this.connections[playerId];
                    if (this.onPlayerLeft) this.onPlayerLeft(playerId);
                });

                // --- Listener: Antworten ---
                this.gameRef.child('answers').on('child_added', (snap) => {
                    const data = snap.val();
                    if (this.onAnswerReceived) {
                        this.onAnswerReceived(data.playerId, data.answerIndex);
                    }
                    // Antwort nach Verarbeitung löschen
                    snap.ref.remove();
                });

                resolve(this.gamePin);
            }).catch(reject);
        });
    }

    broadcast(data) {
        if (this.role !== 'host' || !this.gameRef) return;
        this.gameRef.child('broadcast').push(data);
    }

    // ===================== CLIENT =====================

    initClient(hostId, playerName) {
        this.role = 'client';
        this.gamePin = hostId.toUpperCase();
        this.myId = 'p_' + Math.random().toString(36).substr(2, 9);
        this.gameRef = this.db.ref('games/' + this.gamePin);

        return new Promise((resolve, reject) => {
            // Timeout nach 10 Sekunden
            const timeout = setTimeout(() => {
                reject(new Error('Timeout'));
            }, 10000);

            // Prüfe ob Spiel existiert
            this.gameRef.child('host').once('value').then(snap => {
                if (!snap.exists()) {
                    clearTimeout(timeout);
                    reject({ type: 'peer-unavailable' });
                    return;
                }

                // Dem Spiel beitreten
                const playerRef = this.gameRef.child('players/' + this.myId);
                return playerRef.set({ name: playerName }).then(() => {
                    clearTimeout(timeout);

                    // Aufräumen wenn Client Seite schließt
                    playerRef.onDisconnect().remove();

                    // --- Listener: Broadcast-Nachrichten ---
                    // Nur NEUE Nachrichten empfangen (nicht alte)
                    const broadcastRef = this.gameRef.child('broadcast');
                    let ready = false;

                    broadcastRef.on('child_added', (snap) => {
                        if (!ready) return; // Alte Nachrichten ignorieren
                        const data = snap.val();
                        if (this.onHostCommand) this.onHostCommand(data);
                    });

                    // Firebase feuert child_added synchron für alle bestehenden Kinder,
                    // danach erst 'value'. Ab dann sind neue child_added wirklich neu.
                    broadcastRef.once('value', () => {
                        ready = true;
                    });

                    // --- Listener: Individuelle Nachrichten ---
                    this.gameRef.child('playerMsgs/' + this.myId).on('child_added', (snap) => {
                        const data = snap.val();
                        if (this.onHostCommand) this.onHostCommand(data);
                        snap.ref.remove();
                    });

                    resolve();
                });
            }).catch(err => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    sendAnswer(index) {
        if (this.role !== 'client' || !this.gameRef) return;
        this.gameRef.child('answers').push({
            playerId: this.myId,
            answerIndex: index
        });
    }

    // ===================== UTILS =====================

    generateGameId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

window.network = new QuizNetwork();
