
let _userManagerInstance = null;
async function getUserManager() {
    if (!_userManagerInstance) {
        _userManagerInstance = new ApiUserManager();
        await _userManagerInstance.init();
    }
    return _userManagerInstance;
}

class ApiUserManager {
    constructor() {
        this._user = null;
    }

    async init() {
        try {
            const res = await fetch('/api/me');
            const data = await res.json();
            if (data.user) {
                this._user = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            } else {
                this._user = null;
                localStorage.removeItem('currentUser');
            }
        } catch (e) {
            const cached = localStorage.getItem('currentUser');
            this._user = cached ? JSON.parse(cached) : null;
        }
    }

    async register(surname, name, email, password) {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ surname, name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
        this._user = data.user;
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data.user;
    }

    async login(email, password) {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Неверный email или пароль');
        this._user = data.user;
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data.user;
    }

    async logout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (e) {}
        this._user = null;
        localStorage.removeItem('currentUser');
    }

    readCurrentUser() {
        if (this._user) return this._user;
        const cached = localStorage.getItem('currentUser');
        return cached ? JSON.parse(cached) : null;
    }

    async updateProfile(data) {
        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Ошибка обновления');
        this._user = result.user;
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        return result.user;
    }
    async getFavorites() {
        try {
            const res = await fetch('/api/favorites');
            if (!res.ok) return [];
            return await res.json();
        } catch (e) { return []; }
    }

    async addFavorite(cardId) {
        await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId })
        });
    }

    async removeFavorite(cardId) {
        await fetch('/api/favorites/' + cardId, { method: 'DELETE' });
    }
    async getCart() {
        const res = await fetch('/api/cart');
        if (!res.ok) return [];
        return await res.json();
    }

    async addToCart(item) {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        return await res.json();
    }

    async removeFromCart(id) {
        await fetch('/api/cart/' + id, { method: 'DELETE' });
    }

    async clearCart() {
        await fetch('/api/cart', { method: 'DELETE' });
    }
}
