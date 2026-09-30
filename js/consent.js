/**
 * Ultimate Draft - Sistema de Gestión de Consentimiento (CMP) y Andamiaje Legal
 * Conforme a regulaciones GDPR, ePrivacy y CCPA.
 * Gestiona el almacenamiento local técnico, preferencias del usuario y aviso legal.
 */

const ConsentManager = {
    STORAGE_KEY: 'ud_consent_settings',
    VERSION: '1.0',
    consent: null,

    init() {
        this.consent = this.loadConsent();

        // Si no existe decisión previa de consentimiento, mostrar banner con retardo suave
        if (!this.consent) {
            setTimeout(() => {
                const banner = document.getElementById('consent-banner');
                if (banner) {
                    banner.classList.remove('hidden');
                    banner.style.display = 'block';
                }
            }, 400);
        } else {
            const banner = document.getElementById('consent-banner');
            if (banner) {
                banner.classList.add('hidden');
                banner.style.display = 'none';
            }
            this.applyConsentEffects();
        }

        this.bindEvents();
    },

    loadConsent() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.version === this.VERSION) {
                return parsed;
            }
            return null;
        } catch (e) {
            console.warn('[CMP] No se pudo leer localStorage:', e);
            return null;
        }
    },

    saveConsent(settings) {
        this.consent = {
            necessary: true,
            preferences: !!settings.preferences,
            analytics: !!settings.analytics,
            timestamp: new Date().toISOString(),
            version: this.VERSION
        };

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.consent));
        } catch (e) {
            console.warn('[CMP] Error al persistir consentimiento:', e);
        }

        this.applyConsentEffects();
        this.closeAllModals();
    },

    acceptAll() {
        this.saveConsent({ preferences: true, analytics: true });
        this.notifyStatus('Se han aceptado todas las preferencias de almacenamiento.');
    },

    rejectNonEssential() {
        this.saveConsent({ preferences: false, analytics: false });
        this.notifyStatus('Solo se mantendrá el almacenamiento técnico indispensable.');
    },

    saveCustomPreferences() {
        const prefCheckbox = document.getElementById('cmp-pref-checkbox');
        const analCheckbox = document.getElementById('cmp-anal-checkbox');
        
        this.saveConsent({
            preferences: prefCheckbox ? prefCheckbox.checked : false,
            analytics: analCheckbox ? analCheckbox.checked : false
        });
        this.notifyStatus('Preferencias de almacenamiento guardadas correctamente.');
    },

    openPreferencesModal() {
        const current = this.consent || { preferences: true, analytics: false };
        const prefCheckbox = document.getElementById('cmp-pref-checkbox');
        const analCheckbox = document.getElementById('cmp-anal-checkbox');

        if (prefCheckbox) prefCheckbox.checked = !!current.preferences;
        if (analCheckbox) analCheckbox.checked = !!current.analytics;

        const modal = document.getElementById('consent-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    },

    closePreferencesModal() {
        const modal = document.getElementById('consent-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },

    closeAllModals() {
        const banner = document.getElementById('consent-banner');
        if (banner) {
            banner.classList.add('hidden');
            banner.style.display = 'none';
        }
        this.closePreferencesModal();
    },

    applyConsentEffects() {
        if (!this.consent?.preferences) {
            // Usuario eligió no persistir configuraciones opcionales
        }
    },

    hasConsent(type) {
        if (!this.consent) return false;
        if (type === 'necessary') return true;
        return !!this.consent[type];
    },

    notifyStatus(msg) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 z-[10000] bg-[#0d2654] border border-[var(--nba-gold)] text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce';
        toast.innerHTML = `<span class="text-[var(--nba-gold)] font-bold">✓</span><span>${msg}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2600);
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePreferencesModal();
                this.closeLegalModal();
            }
        });
    },

    // Navegación dentro del Modal Legal In-Game
    openLegalModal(tabName = 'privacy') {
        const modal = document.getElementById('legal-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        this.switchLegalTab(tabName);
    },

    closeLegalModal() {
        const modal = document.getElementById('legal-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },

    switchLegalTab(tabName) {
        const tabs = ['privacy', 'terms', 'cookies', 'disclaimer'];
        tabs.forEach(tab => {
            const btn = document.getElementById(`tab-btn-${tab}`);
            const content = document.getElementById(`legal-content-${tab}`);
            if (btn) {
                if (tab === tabName) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
            if (content) {
                if (tab === tabName) {
                    content.classList.remove('hidden');
                    content.style.display = 'block';
                } else {
                    content.classList.add('hidden');
                    content.style.display = 'none';
                }
            }
        });
    }
};

// Exponer como objeto global para acceso tanto por identificador como por window.
window.ConsentManager = ConsentManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ConsentManager.init());
} else {
    ConsentManager.init();
}
