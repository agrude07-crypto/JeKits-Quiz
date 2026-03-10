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

    // PeerJS Konfiguration mit expliziten ICE Servern
    getPeerConfig() {
        return {
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        };
    }

    // --- HOST METHODS ---
    initHost() {
        this.role = 'host';
        const gameId = this.generateGameId();
        this.myId = 'jekitsquiz' + gameId;
        
        return new Promise((resolve, reject) => {
            this.peer = new Peer(this.myId, this.getPeerConfig());
            
            this.peer.on('open', (id) => {
                console.log('[JeKits] Host verbunden mit Server! ID:', id, '| PIN:', gameId);
                resolve(gameId);
            });

            this.peer.on('error', (err) => {
                console.error('[JeKits] Host Fehler:', err.type, err.message || err);
                if (err.type === 'unavailable-id') {
                    console.warn('[JeKits] ID belegt, versuche neue...');
                    this.peer.destroy();
                    const newId = this.generateGameId();
                    this.myId = 'jekitsquiz' + newId;
                    this.peer = new Peer(this.myId, this.getPeerConfig());
                    this.peer.on('open', () => resolve(newId));
                    this.peer.on('error', (e) => reject(e));
                    this.peer.on('connection', (c) => this.setupHostConnection(c));
                } else {
                    reject(err);
                }
            });

            this.peer.on('connection', (conn) => {
                this.setupHostConnection(conn);
            });

            this.peer.on('disconnected', () => {
                console.warn('[JeKits] Host vom Server getrennt, versuche Reconnect...');
                if (this.peer && !this.peer.destroyed) {
                    this.peer.reconnect();
                }
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
            let settled = false;
            
            const timeout = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    console.error('[JeKits] Timeout nach 12s');
                    if (this.peer) this.peer.destroy();
                    reject(new Error('Timeout'));
                }
            }, 12000);

            this.peer = new Peer(this.getPeerConfig());
            
            this.peer.on('open', (id) => {
                this.myId = id;
                const targetId = 'jekitsquiz' + hostId.toUpperCase();
                console.log('[JeKits] Client bereit, verbinde zu:', targetId);
                
                const conn = this.peer.connect(targetId, { reliable: true });
                
                conn.on('open', () => {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timeout);
                        this.hostConnection = conn;
                        console.log('[JeKits] Verbunden!');
                        conn.send({ type: 'join', name: playerName });
                        resolve();
                    }
                });

                conn.on('data', (data) => {
                    if (this.onHostCommand) this.onHostCommand(data);
                });

                conn.on('close', () => {
                    console.warn('[JeKits] Verbindung zum Host verloren');
                });
                
                conn.on('error', (err) => {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timeout);
                        console.error('[JeKits] Verbindungsfehler:', err);
                        reject(err);
                    }
                });
            });

            this.peer.on('error', (err) => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timeout);
                    console.error('[JeKits] Peer Fehler:', err.type, err.message || err);
                    reject(err);
                }
            });
        });
    }

    sendAnswer(index) {
        if (this.hostConnection && this.hostConnection.open) {
            this.hostConnection.send({ type: 'answer', answerIndex: index });
        }
    }

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
