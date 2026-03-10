/**
 * Network Logic (PeerJS WebRTC)
 * Verwaltet P2P Verbindungen zwischen Host und Clients
 */

class QuizNetwork {
    constructor() {
        this.peer = null;
        this.connections = {}; // { connId: connection, ... }
        this.role = null; // 'host' oder 'client'
        this.myId = null;
        
        // Callbacks from App
        this.onPlayerJoined = null;       // (id, name)
        this.onPlayerLeft = null;         // (id)
        this.onAnswerReceived = null;     // (id, answerIndex)
        this.onHostCommand = null;        // (commandData)
    }

    // --- HOST METHODS ---
    initHost() {
        this.role = 'host';
        // Erzeuge eine kurze ID für das Spiel (z.B. ABCDE)
        const gameId = this.generateGameId();
        // Verwende intern ein Präfix, damit es auf dem öffentlichen PeerJS Server
        // keine Kollisionen mit anderen Apps gibt.
        this.myId = 'jekits-quiz-' + gameId;
        
        return new Promise((resolve, reject) => {
            this.peer = new Peer(this.myId);
            
            this.peer.on('open', (id) => {
                console.log('[JeKits] Host erstellt. Interne ID:', id, '| Game PIN:', gameId);
                // Gib nach außen nur den 5-stelligen Code zurück (für die UI)
                resolve(gameId);
            });

            this.peer.on('error', (err) => {
                console.error('[JeKits] Host Peer Fehler:', err.type, err);
                // Bei ID-Kollision: neuen Code generieren und nochmal versuchen
                if (err.type === 'unavailable-id') {
                    console.warn('[JeKits] ID-Kollision, versuche neue ID...');
                    this.peer.destroy();
                    const newId = this.generateGameId();
                    this.myId = 'jekits-quiz-' + newId;
                    this.peer = new Peer(this.myId);
                    this.peer.on('open', () => resolve(newId));
                    this.peer.on('error', (err2) => reject(err2));
                    this.peer.on('connection', (conn) => this.setupHostConnection(conn));
                } else {
                    reject(err);
                }
            });

            this.peer.on('connection', (conn) => {
                this.setupHostConnection(conn);
            });
        });
    }

    setupHostConnection(conn) {
        let playerId = conn.peer;
        this.connections[playerId] = conn;

        conn.on('open', () => {
            console.log('[JeKits] Client verbunden:', playerId);
        });

        conn.on('data', (data) => {
            console.log('[JeKits] Host empfangen:', data);
            if (data.type === 'join') {
                if (this.onPlayerJoined) this.onPlayerJoined(playerId, data.name);
            } else if (data.type === 'answer') {
                if (this.onAnswerReceived) this.onAnswerReceived(playerId, data.answerIndex);
            }
        });

        conn.on('close', () => {
            console.log('[JeKits] Client getrennt:', playerId);
            delete this.connections[playerId];
            if (this.onPlayerLeft) this.onPlayerLeft(playerId);
        });
    }

    // Rundruf an alle Clients
    broadcast(data) {
        if (this.role !== 'host') return;
        Object.values(this.connections).forEach(conn => {
            if (conn.open) {
                conn.send(data);
            }
        });
    }

    // --- CLIENT METHODS ---
    initClient(hostId, playerName) {
        this.role = 'client';

        return new Promise((resolve, reject) => {
            // Timeout: wenn nach 10 Sekunden keine Verbindung steht, abbrechen
            const timeout = setTimeout(() => {
                console.error('[JeKits] Verbindungs-Timeout nach 10s');
                if (this.peer) this.peer.destroy();
                reject(new Error('Verbindungs-Timeout. Bitte prüfe die PIN und versuche es nochmal.'));
            }, 10000);

            this.peer = new Peer();
            
            this.peer.on('open', (id) => {
                this.myId = id;
                console.log('[JeKits] Client Peer erstellt:', id);
                console.log('[JeKits] Versuche Verbindung zu:', 'jekits-quiz-' + hostId.toUpperCase());
                
                const conn = this.peer.connect('jekits-quiz-' + hostId.toUpperCase());
                
                conn.on('open', () => {
                    clearTimeout(timeout);
                    this.hostConnection = conn;
                    console.log('[JeKits] Verbindung zum Host hergestellt!');
                    // Send name to host
                    conn.send({ type: 'join', name: playerName });
                    resolve();
                });

                conn.on('data', (data) => {
                    console.log('[JeKits] Client empfangen:', data);
                    if (this.onHostCommand) this.onHostCommand(data);
                });

                conn.on('close', () => {
                    console.warn('[JeKits] Verbindung zum Host verloren');
                });
                
                conn.on('error', (err) => {
                    clearTimeout(timeout);
                    console.error('[JeKits] Verbindungsfehler:', err);
                    reject(err);
                });
            });

            this.peer.on('error', (err) => {
                clearTimeout(timeout);
                console.error('[JeKits] Client Peer Fehler:', err.type, err);
                reject(err);
            });
        });
    }

    sendAnswer(index) {
        if (this.hostConnection && this.hostConnection.open) {
            this.hostConnection.send({ type: 'answer', answerIndex: index });
        }
    }

    // --- UTILS ---
    generateGameId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Keine 0,O,1,I
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

window.network = new QuizNetwork();
