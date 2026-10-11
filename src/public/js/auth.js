// Sesión JWT en el cliente. La verificación criptográfica siempre ocurre en el servidor.
const Auth = {
    KEY: 'token',

    getToken() { return sessionStorage.getItem(this.KEY); },
    setToken(token) { sessionStorage.setItem(this.KEY, token); },

    payload() {
        const token = this.getToken();
        if (!token) return null;
        try {
            const part = token.split('.')[1];
            if (!part) return null;
            const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        } catch {
            return null;
        }
    },

    isExpired(payload) { return !payload || !payload.exp || Date.now() >= payload.exp * 1000; },
    roles() { return this.payload()?.roles || []; },
    homeFor(roles = []) { return roles.includes('admin') ? '/admin' : '/dashboard'; },

    logout(reason) {
        sessionStorage.removeItem(this.KEY);
        location.href = reason === 'expired' ? '/signIn?expired=1' : '/signIn';
    },

    guard(requiredRoles) {
        const payload = this.payload();
        if (!payload) return this.logout();
        if (this.isExpired(payload)) return this.logout('expired');
        if (requiredRoles.length && !payload.roles.some(role => requiredRoles.includes(role))) {
            location.href = '/403';
            return null;
        }

        const remaining = payload.exp * 1000 - Date.now();
        if (remaining <= 2147483647) setTimeout(() => this.logout('expired'), remaining);
        return payload;
    },

    async api(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {}),
                ...options.headers
            }
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 && this.getToken()) this.logout('expired');
        if (response.status === 403) location.href = '/403';
        if (!response.ok) throw new Error(data.message || 'No fue posible completar la solicitud');
        return data;
    }
};

const UI = {
    esc(value) {
        const element = document.createElement('div');
        element.textContent = value ?? '';
        return element.innerHTML;
    },

    attr(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    safeImageUrl(value) {
        if (!value) return null;
        try {
            const url = new URL(value);
            return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
        } catch {
            return null;
        }
    },

    date(value, withTime = false) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return withTime ? date.toLocaleString('es-PE') : date.toLocaleDateString('es-PE', { timeZone: 'UTC' });
    },

    toast(message, ok = true) {
        let region = document.getElementById('toast-region');
        if (!region) {
            region = document.createElement('div');
            region.id = 'toast-region';
            region.className = 'toast-region';
            region.setAttribute('aria-live', 'polite');
            region.setAttribute('aria-atomic', 'true');
            document.body.appendChild(region);
        }
        const toast = document.createElement('div');
        toast.className = `toast${ok ? '' : ' error'}`;
        toast.setAttribute('role', ok ? 'status' : 'alert');
        const dot = document.createElement('span');
        dot.className = 'toast-dot';
        dot.setAttribute('aria-hidden', 'true');
        const copy = document.createElement('span');
        copy.textContent = message;
        toast.append(dot, copy);
        region.appendChild(toast);
        setTimeout(() => toast.remove(), 4200);
    },

    avatar(user, size = 'avatar') {
        const safeUrl = this.safeImageUrl(user?.url_profile);
        const fullName = `${user?.name ?? ''} ${user?.lastName ?? ''}`.trim() || 'Usuario';
        if (safeUrl) return `<img src="${this.attr(safeUrl)}" alt="Avatar de ${this.attr(fullName)}" class="${size}">`;
        const initials = `${user?.name?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
        return `<span class="${size}" aria-label="Avatar de ${this.attr(fullName)}">${this.esc(initials)}</span>`;
    },

    rolesChips(roles = []) {
        return roles.map(role => `<span class="badge ${role === 'admin' ? 'badge-admin' : ''}">${this.esc(role)}</span>`).join('');
    },

    setButtonLoading(button, loading, label = 'Procesando…') {
        if (!button) return;
        const labelElement = button.querySelector('.button-label');
        if (loading) {
            button.dataset.label = labelElement?.textContent || button.textContent.trim();
            button.disabled = true;
            button.classList.add('is-loading');
            if (labelElement) labelElement.textContent = label;
        } else {
            button.disabled = false;
            button.classList.remove('is-loading');
            if (labelElement && button.dataset.label) labelElement.textContent = button.dataset.label;
        }
    },

    setupPasswordToggles() {
        document.querySelectorAll('[data-password-toggle]').forEach(button => {
            button.addEventListener('click', () => {
                const input = document.getElementById(button.dataset.passwordToggle);
                if (!input) return;
                const showing = input.type === 'text';
                input.type = showing ? 'password' : 'text';
                button.textContent = showing ? 'Mostrar' : 'Ocultar';
                button.setAttribute('aria-pressed', String(!showing));
            });
        });
    },

    setupNavigation() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('nav-overlay');
        const toggle = document.getElementById('menu-toggle');
        if (!sidebar || !overlay || !toggle) return;
        const close = () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        };
        toggle.addEventListener('click', () => {
            const open = !sidebar.classList.contains('open');
            sidebar.classList.toggle('open', open);
            overlay.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', String(open));
        });
        overlay.addEventListener('click', close);
        document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
        document.querySelectorAll('.nav-link[data-path]').forEach(link => {
            if (link.dataset.path === location.pathname) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });
    }
};

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[#$%&*@]).{8,}$/;

document.addEventListener('DOMContentLoaded', () => {
    UI.setupPasswordToggles();
    UI.setupNavigation();
});
