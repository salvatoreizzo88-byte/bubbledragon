import firebaseConfig from './FirebaseConfig.js';
// We assume Firebase SDK is loaded via CDN in index.html, exposing 'firebase' global
// Typically: firebase.initializeApp(firebaseConfig);
// But with modules, it's better to use imports if we had a bundler. 
// Since we are using native ES modules without a bundler for dependencies, we'll rely on global 'firebase' object from CDN.

let db = null;

export default class Database {
    static init() {
        if (!window.firebase) {
            console.error("Firebase SDK not loaded!");
            return;
        }
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        this.auth = firebase.auth();
    }

    // --- AUTHENTICATION METHODS ---

    static async registerWithEmail(email, password, username, initialData = {}) {
        if (!this.auth) return { success: false, error: "Auth not initialized" };

        try {
            // 1. Create Auth User
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 2. Update Profile with Username
            await user.updateProfile({
                displayName: username
            });

            // 3. Save Data to Firestore using USERNAME as document ID
            // Document ID = username.toLowerCase() for consistency
            const docId = username.toLowerCase();
            await db.collection("users").doc(docId).set({
                nomeUtente: username, // Original case
                authUid: user.uid, // Link to Firebase Auth
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...initialData
            });

            return { success: true, user: user };
        } catch (error) {
            console.error("Registration Error:", error);
            return { success: false, error: error.message };
        }
    }

    static async loginWithEmail(email, password) {
        if (!this.auth) return { success: false, error: "Auth not initialized" };

        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Fetch User Data using displayName (username) as document ID
            const username = user.displayName;
            let userData = null;

            if (username) {
                const doc = await db.collection("users").doc(username.toLowerCase()).get();
                if (doc.exists) {
                    userData = doc.data();
                }
            }

            return { success: true, user: user, data: userData };
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, error: error.message };
        }
    }

    static async logout() {
        if (!this.auth) return;
        await this.auth.signOut();
    }

    // Listen for auth state changes (for session persistence)
    static onAuthStateChanged(callback) {
        if (!this.auth) {
            console.error("Auth not initialized for onAuthStateChanged");
            return;
        }
        return this.auth.onAuthStateChanged(callback);
    }

    // Get user data from Firestore by UID
    static async getUserData(uid) {
        if (!db || !uid) return null;
        try {
            const doc = await db.collection("users").doc(uid).get();
            if (doc.exists) {
                return doc.data();
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
        return null;
    }

    // --- FIRESTORE METHODS ---

    static checkAvailability(username) {
        return new Promise(async (resolve) => {
            // Basic validation
            if (!username) {
                resolve({ available: false, error: "Username cannot be empty." });
                return;
            }
            const lower = username.toLowerCase();
            if (lower.length < 3) {
                resolve({ available: false, error: "Too short (min 3 chars)." });
                return;
            }
            const forbidden = ['admin', 'root', 'system', 'null', 'undefined'];
            if (forbidden.includes(lower)) {
                resolve({ available: false, error: "Username not allowed." });
                return;
            }

            if (!db) {
                console.warn("Database not initialized, falling back to mock");
                resolve({ available: true }); // Fallback if DB fails
                return;
            }

            try {
                // Check if username exists in 'users' collection
                // NOTE: With Auth, we might have users keyed by UID. 
                // To check availability globally, we'd need a separate 'usernames' collection or query.
                // For now, we unfortunately stick to the old check which only checks the 'users/{username}' docs.
                // This is imperfect for Auth users stored under UID unless we also reserve the username doc.
                // Mitigation: We will ALSO try to reserve the username document ID even for Auth users
                // OR we query for the field 'username'.

                // Query by field 'username'
                const snapshot = await db.collection("users").where("username", "==", username).get();
                if (!snapshot.empty) {
                    resolve({ available: false, error: "Username already taken." });
                    return;
                }

                // Legacy check (if using username as doc ID)
                const docRef = db.collection("users").doc(lower);
                const doc = await docRef.get();

                if (doc.exists) {
                    resolve({ available: false, error: "Username already taken." });
                } else {
                    resolve({ available: true });
                }
            } catch (error) {
                console.error("Error checking username:", error);
                resolve({ available: false, error: "Network error." });
            }
        });
    }

    static async registerUser(username, data = {}) {
        // LEGACY / GUEST / UN-AUTHED NAMED USERS
        if (!db) return;
        const lower = username.toLowerCase();
        try {
            await db.collection("users").doc(lower).set({
                originalName: username,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...data
            });
            return true;
        } catch (error) {
            console.error("Error registering user:", error);
            return false;
        }
    }

    // Update username in existing document (for authenticated users)
    static async updateUsername(uid, newUsername) {
        if (!db || !uid) {
            console.error("updateUsername: DB o UID mancante");
            return false;
        }
        try {
            await db.collection("users").doc(uid).update({
                username: newUsername,
                nomeUtente: newUsername,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Username aggiornato a '${newUsername}' per UID: ${uid}`);
            return true;
        } catch (error) {
            console.error("❌ Errore aggiornamento username:", error);
            return false;
        }
    }

    // === ANTI-CHEAT VALIDATION ===
    static validateGameState(gameState, existingData = null) {
        const errors = [];

        // 1. No negative values
        if (gameState.coins < 0) errors.push("coins_negative");
        if (gameState.dragocoin < 0) errors.push("dragocoin_negative");
        if (gameState.playerXP < 0) errors.push("xp_negative");
        if (gameState.playerLevel < 1) errors.push("level_invalid");
        if (gameState.maxLevel < 1) errors.push("maxLevel_invalid");

        // 2. Level must be consistent with XP (500 XP per level)
        const expectedLevel = Math.floor(gameState.playerXP / 500) + 1;
        if (gameState.playerLevel > expectedLevel + 1) {
            errors.push("level_xp_mismatch");
            gameState.playerLevel = expectedLevel; // Auto-correct
        }

        // 3. If we have existing data, check for suspicious jumps
        if (existingData) {
            // maxLevel can only increase by 1 at a time
            if (gameState.maxLevel > (existingData.maxLevel || 1) + 1) {
                errors.push("maxLevel_jump");
                gameState.maxLevel = (existingData.maxLevel || 1) + 1; // Auto-correct
            }

            // Daily reward can only be claimed once per day
            if (gameState.lastLoginDate === existingData.lastLoginDate &&
                gameState.loginStreak > existingData.loginStreak) {
                errors.push("streak_manipulation");
                gameState.loginStreak = existingData.loginStreak; // Restore
            }
        }

        // 4. Inventory must be valid item IDs
        const validItems = [
            'long_range', 'speed_boost', 'double_jump', 'rapid_fire', 'shield',
            'mega_speed', 'super_jump', 'bubble_master', 'coin_magnet', 'xp_boost',
            'triple_jump', 'immortal_start'
        ];
        gameState.inventory = (gameState.inventory || []).filter(item => validItems.includes(item));

        if (errors.length > 0) {
            console.warn("⚠️ Anti-cheat validazione fallita:", errors);
        }

        return { valid: errors.length === 0, errors, correctedData: gameState };
    }

    static async saveProgress(identifier, gameState) {
        if (!db || !identifier) return;

        // ALWAYS use username as document ID (lowercase for consistency)
        const docId = identifier.toLowerCase();
        const targetDoc = db.collection("users").doc(docId);

        // Get auth UID if logged in (to link document to authenticated user)
        const authUid = (this.auth && this.auth.currentUser) ? this.auth.currentUser.uid : null;

        // === ANTI-CHEAT: Load existing data and validate ===
        let existingData = null;
        try {
            const existingDoc = await targetDoc.get();
            if (existingDoc.exists) {
                const data = existingDoc.data();
                existingData = {
                    maxLevel: data.livelloMax || data.maxLevel || 1,
                    loginStreak: data.serieAccessi || data.loginStreak || 0,
                    lastLoginDate: data.ultimoLogin || data.lastLoginDate || null
                };
            }
        } catch (e) {
            console.log("Could not load existing data for validation");
        }

        // Validate and auto-correct cheating attempts
        const validation = this.validateGameState(gameState, existingData);
        if (!validation.valid) {
            console.warn("🛑 Tentativo di cheat rilevato e corretto:", validation.errors);
        }

        try {
            // Converti stats in italiano
            const statistiche = {
                nemiciCatturati: gameState.stats.enemiesTrapped || 0,
                partiteGiocate: gameState.stats.gamesPlayed || 0,
                livelliCompletati: gameState.stats.levelsCompleted || 0,
                powerupRaccolti: gameState.stats.powerupsCollected || 0,
                moneteGuadagnate: gameState.stats.totalCoinsEarned || 0,
                mortiTotali: gameState.stats.totalDeaths || 0,
                frutteRaccolte: gameState.stats.totalFruitCollected || 0,
                livelloVelocita: gameState.stats.speedLevel || 0
            };

            // Build document data
            const docData = {
                nomeUtente: identifier, // Original case username
                monete: gameState.coins,
                dragocoin: gameState.dragocoin || 0,
                inventario: gameState.inventory,
                statistiche: statistiche,
                livelloMax: gameState.maxLevel || 1,
                livelloGiocatore: gameState.playerLevel || 1,
                puntiXP: gameState.playerXP || 0,
                ultimoLogin: gameState.lastLoginDate || null,
                serieAccessi: gameState.loginStreak || 0,
                obiettiviSbloccati: gameState.unlockedAchievements || [],
                tutorialCompletato: gameState.tutorialCompleted || false,
                ultimoAccesso: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Add auth UID if user is authenticated (links document to Firebase Auth)
            if (authUid) {
                docData.authUid = authUid;
            }

            // Use set with merge to create document if it doesn't exist
            await targetDoc.set(docData, { merge: true });
        } catch (error) {
            console.error("Errore salvataggio progressi:", error);
        }
    }

    static async loadProgress(identifier) {
        if (!db || !identifier) return null;


        // ALWAYS use username as document ID (lowercase for consistency)
        const targetDoc = db.collection("users").doc(identifier.toLowerCase());

        try {
            const doc = await targetDoc.get();
            if (doc.exists) {
                const data = doc.data();

                // Converti campi italiani -> inglesi per compatibilità interna
                // Supporta sia vecchi che nuovi nomi campi
                const statsIt = data.statistiche || {};

                return {
                    username: data.nomeUtente || data.username,
                    coins: data.monete !== undefined ? data.monete : data.coins || 0,
                    dragocoin: data.dragocoin || 0,
                    inventory: data.inventario || data.inventory || [],
                    maxLevel: data.livelloMax || data.maxLevel || 1,
                    playerLevel: data.livelloGiocatore || data.playerLevel || 1,
                    playerXP: data.puntiXP || data.playerXP || 0,
                    lastLoginDate: data.ultimoLogin || null,
                    loginStreak: data.serieAccessi || 0,
                    unlockedAchievements: data.obiettiviSbloccati || [],
                    tutorialCompleted: data.tutorialCompletato || false,
                    stats: {
                        enemiesTrapped: statsIt.nemiciCatturati || (data.stats?.enemiesTrapped) || 0,
                        gamesPlayed: statsIt.partiteGiocate || (data.stats?.gamesPlayed) || 0,
                        levelsCompleted: statsIt.livelliCompletati || (data.stats?.levelsCompleted) || 0,
                        powerupsCollected: statsIt.powerupRaccolti || (data.stats?.powerupsCollected) || 0,
                        totalCoinsEarned: statsIt.moneteGuadagnate || (data.stats?.totalCoinsEarned) || 0,
                        totalDeaths: statsIt.mortiTotali || (data.stats?.totalDeaths) || 0,
                        totalFruitCollected: statsIt.frutteRaccolte || (data.stats?.totalFruitCollected) || 0,
                        speedLevel: statsIt.livelloVelocita || (data.stats?.speedLevel) || 0
                    }
                };
            }
        } catch (error) {
            console.error("Errore caricamento progressi:", error);
        }
        return null;
    }

    static async deleteUser(username) {
        if (!db || !username) {
            console.warn("deleteUser: DB o username mancante");
            return false;
        }
        const lower = username.toLowerCase();
        try {
            // Check if document exists first
            const docRef = db.collection("users").doc(lower);
            const doc = await docRef.get();

            if (doc.exists) {
                await docRef.delete();
                console.log(`✅ Utente '${username}' (doc: ${lower}) eliminato dal DB.`);
                return true;
            } else {
                console.log(`⚠️ Utente '${username}' (doc: ${lower}) non trovato nel DB.`);
                return false;
            }
        } catch (error) {
            console.error("❌ Errore eliminazione utente:", error);
            return false;
        }
    }

    // === LEADERBOARD METHODS ===

    static async submitScore(username, score, maxLevel) {
        if (!db) {
            console.error('Database non inizializzato per classifica');
            return;
        }
        if (!username) {
            console.error('Nessun username fornito per classifica');
            return;
        }

        try {
            console.log('Invio punteggio a Firebase...', { username, score, maxLevel });
            const docRef = db.collection("leaderboard").doc(username.toLowerCase());
            const existing = await docRef.get();

            // Only update if new level is higher
            if (existing.exists) {
                const data = existing.data();
                const existingLevel = data.livelloDraghetto || data.livello || 1;
                if (existingLevel >= score) {
                    console.log("Livello esistente più alto, non aggiorno");
                    return;
                }
            }

            await docRef.set({
                nomeUtente: username,
                livelloDraghetto: score, // Now stores dragon level, not XP
                livelloMax: maxLevel,
                aggiornatoIl: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Classifica aggiornata: ${username} - Livello ${score}`);
        } catch (error) {
            console.error("Errore invio punteggio:", error.message, error);
        }
    }

    static async getTopScores(limit = 10) {
        if (!db) return [];

        try {
            const snapshot = await db.collection("leaderboard")
                .orderBy("livelloDraghetto", "desc")
                .limit(limit)
                .get();

            const scores = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                scores.push({
                    id: doc.id,
                    username: data.nomeUtente || data.username,
                    dragonLevel: data.livelloDraghetto || data.livello || 1,
                    maxLevel: data.livelloMax || data.maxLevel || 1
                });
            });

            return scores;
        } catch (error) {
            console.error("Errore caricamento classifica:", error);
            return [];
        }
    }

    static async getUserRank(username) {
        if (!db || !username) return null;

        try {
            // Get user's dragon level first
            const userDoc = await db.collection("leaderboard").doc(username.toLowerCase()).get();
            if (!userDoc.exists) return null;

            const data = userDoc.data();
            const userLevel = data.livelloDraghetto || data.livello || 1;

            // Count how many have higher level
            const higherSnapshot = await db.collection("leaderboard")
                .where("livelloDraghetto", ">", userLevel)
                .get();

            return higherSnapshot.size + 1; // Rank is 1-indexed
        } catch (error) {
            console.error("Error getting user rank:", error);
            return null;
        }
    }

    // Migrate existing users to leaderboard
    static async migrateUsersToLeaderboard() {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        try {
            console.log('Starting migration of users to leaderboard...');
            const usersSnapshot = await db.collection("users").get();

            let migrated = 0;
            for (const doc of usersSnapshot.docs) {
                const userData = doc.data();
                const username = userData.username || doc.id;
                const score = userData.coins || 0;
                const maxLevel = userData.maxLevel || 1;

                // Only add if has some score
                if (score > 0 || maxLevel > 1) {
                    await db.collection("leaderboard").doc(username.toLowerCase()).set({
                        username: username,
                        score: score,
                        maxLevel: maxLevel,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`Migrated: ${username} - Score: ${score}, Level: ${maxLevel}`);
                    migrated++;
                }
            }

            console.log(`Migration complete! ${migrated} users added to leaderboard.`);
            return migrated;
        } catch (error) {
            console.error("Error migrating users:", error);
            return 0;
        }
    }

    // Clear all leaderboard entries
    static async clearLeaderboard() {
        if (!db) {
            console.error('Database non inizializzato');
            return;
        }

        try {
            console.log('Pulizia classifica...');
            const snapshot = await db.collection("leaderboard").get();

            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`Rimosse ${snapshot.size} voci dalla classifica.`);
            return snapshot.size;
        } catch (error) {
            console.error("Errore pulizia classifica:", error);
            return 0;
        }
    }

    // Rebuild leaderboard from users collection with playerLevel
    static async rebuildLeaderboard() {
        if (!db) {
            console.error('Database non inizializzato');
            return;
        }

        try {
            // First clear the old leaderboard
            await this.clearLeaderboard();

            console.log('Ricostruzione classifica dagli utenti...');
            const usersSnapshot = await db.collection("users").get();

            let added = 0;
            for (const doc of usersSnapshot.docs) {
                const userData = doc.data();
                // Supporta sia vecchi che nuovi nomi campi
                const username = userData.nomeUtente || userData.username || doc.id;
                const playerLevel = userData.livelloGiocatore || userData.playerLevel || 1;
                const playerXP = userData.puntiXP || userData.playerXP || 0;

                // Only add users with some progress
                if (playerLevel > 1 || playerXP > 0) {
                    await db.collection("leaderboard").doc(username.toLowerCase()).set({
                        nomeUtente: username,
                        livelloDraghetto: playerLevel,
                        livelloMax: userData.livelloMax || userData.maxLevel || 1,
                        aggiornatoIl: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`Aggiunto: ${username} - Livello Draghetto: ${playerLevel}`);
                    added++;
                }
            }

            console.log(`Classifica ricostruita! ${added} utenti aggiunti.`);
            return added;
        } catch (error) {
            console.error("Errore ricostruzione classifica:", error);
            return 0;
        }
    }
}
