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
        // Verwende intern ein Präfix "jekits-", da auf dem öffentlichen PeerJS Server
        // kurze 5-stellige IDs oft zu Kollisionen und Verbindungsfehlern führen.
        this.myId = 'jekits-' + gameId;
        
        return new Promise((resolve, reject) => {
            this.peer = new Peer(this.myId, {
                // Optional: Config defaults, aber gut zum sicherstellen
                debug: 2
            });
            
            this.peer.on('open', (id) => {
                console.log('Host created with internal ID:', id);
                // Gib nach außen (für die UI) nur den 5-stelligen Code zurück
                resolve(gameId);
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                reject(err);
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
            console.log('Client connected:', playerId);
        });

        conn.on('data', (data) => {
            console.log('Host received:', data);
            if (data.type === 'join') {
                if (this.onPlayerJoined) this.onPlayerJoined(playerId, data.name);
            } else if (data.type === 'answer') {
                if (this.onAnswerReceived) this.onAnswerReceived(playerId, data.answerIndex);
            }
        });

        conn.on('close', () => {
            console.log('Client disconnected:', playerId);
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
            this.peer = new Peer({ debug: 2 });
            
            this.peer.on('open', (id) => {
                this.myId = id;
                // Client muss sich mit der präfixierten Host-ID verbinden
                const conn = this.peer.connect('jekits-' + hostId.toUpperCase(), {
                    reliable: true // Force reliable data transfer
                });
                
                conn.on('open', () => {
                    this.hostConnection = conn;
                    // Send name to host
                    conn.send({ type: 'join', name: playerName });
                    resolve();
                });

                conn.on('data', (data) => {
                    console.log('Client received:', data);
                    if (this.onHostCommand) this.onHostCommand(data);
                });

                conn.on('close', () => {
                    console.warn('Verbindung zum Host verloren');
                });
                
                conn.on('error', (err) => {
                    reject(err);
                });
            });

            this.peer.on('error', (err) => {
                console.error('Client Peer error:', err);
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
