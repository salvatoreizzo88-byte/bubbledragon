export default class UserManager {
    constructor() {
        this.storageKey = 'bubbleBobbleUser';
        this.username = null;
        this.loadUser();
    }

    loadUser() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.username = stored;
        } else {
            this.createGuestUser();
        }
    }

    createGuestUser() {
        const randomId = Math.floor(1000 + Math.random() * 9000); // 1000-9999
        this.username = `utente_${randomId}`;
        this.saveUser();
    }

    saveUser() {
        localStorage.setItem(this.storageKey, this.username);
    }

    getUsername() {
        return this.username;
    }

    setUsername(newUsername) {
        if (!newUsername) return false;
        this.username = newUsername;
        this.saveUser();
        return true;
    }
}
