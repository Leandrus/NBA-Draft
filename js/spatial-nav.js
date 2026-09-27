/**
 * Ultimate Draft - Motor de Navegación Espacial
 * Proporciona navegación direccional con D-Pad / Teclas de flecha para Smart TVs,
 * Gamepads y accesibilidad por teclado.
 */

class SpatialNavigation {
    constructor() {
        this.focusableElements = [];
        this.currentIndex = -1;
        this.isTVMode = false;
        this.gamepadLoopActive = false;
        this.axisNeutralRequired = true;
        this.lastGamepadAction = 0;
        
        this.initDetection();
        this.initListeners();
    }

    initDetection() {
        const urlParams = new URLSearchParams(window.location.search);
        const forceTV = urlParams.get('forceTV') === 'true';
        const ua = navigator.userAgent.toLowerCase();
        
        // Only genuine Smart TV platforms or explicit flag
        const isSmartTV = ua.includes('tizen') || ua.includes('webos') || ua.includes('smart-tv') || ua.includes('crkey') || ua.includes('googletv');
        
        this.isTVMode = forceTV || isSmartTV;
        if (this.isTVMode) {
            document.body.classList.add('is-tv');
        }

        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isTouch) {
            document.body.classList.add('is-touch');
        } else {
            document.body.classList.add('is-desktop');
        }
    }

    initListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Gamepad support - only activate if user interacts
        window.addEventListener('gamepadconnected', () => {
            if (!this.gamepadLoopActive) {
                this.gamepadLoopActive = true;
                this.pollGamepad();
            }
        });
    }

    updateFocusables() {
        // Collect visible, non-disabled interactive elements within current active screen
        this.focusableElements = Array.from(document.querySelectorAll(
            'button:not(.hidden):not(:disabled), input:not(.hidden):not(:disabled), select:not(.hidden):not(:disabled), [tabindex="0"]:not(.hidden)'
        )).filter(el => {
            const style = window.getComputedStyle(el);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0;
            const parentHidden = el.closest('.hidden');
            return isVisible && !parentHidden;
        });

        // Keep currentIndex within bounds without auto-focusing
        if (this.currentIndex >= this.focusableElements.length) {
            this.currentIndex = Math.max(0, this.focusableElements.length - 1);
        }
    }

    focusCurrent() {
        if (this.focusableElements[this.currentIndex]) {
            const el = this.focusableElements[this.currentIndex];
            el.focus({ preventScroll: false });
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            if (window.audio) window.audio.playClick();
        }
    }

    navigate(direction) {
        this.updateFocusables();
        if (this.focusableElements.length === 0) return;

        // If no element currently focused, select the first logical element
        if (this.currentIndex === -1 || !this.focusableElements[this.currentIndex]) {
            this.currentIndex = 0;
            this.focusCurrent();
            return;
        }

        const currentEl = this.focusableElements[this.currentIndex];
        const currentRect = currentEl.getBoundingClientRect();
        let bestIndex = -1;
        let minDistance = Infinity;

        this.focusableElements.forEach((el, index) => {
            if (index === this.currentIndex) return;
            const rect = el.getBoundingClientRect();
            let dx = 0;
            let dy = 0;
            let isValid = false;

            if (direction === 'left' && rect.right <= currentRect.left + 8) {
                dx = currentRect.left - rect.right;
                dy = Math.abs(currentRect.top - rect.top);
                isValid = true;
            } else if (direction === 'right' && rect.left >= currentRect.right - 8) {
                dx = rect.left - currentRect.right;
                dy = Math.abs(currentRect.top - rect.top);
                isValid = true;
            } else if (direction === 'up' && rect.bottom <= currentRect.top + 8) {
                dy = currentRect.top - rect.bottom;
                dx = Math.abs(currentRect.left - rect.left);
                isValid = true;
            } else if (direction === 'down' && rect.top >= currentRect.bottom - 8) {
                dy = rect.top - currentRect.bottom;
                dx = Math.abs(currentRect.left - rect.left);
                isValid = true;
            }

            if (isValid) {
                const distance = Math.sqrt((dx * dx) + (dy * dy));
                if (distance < minDistance) {
                    minDistance = distance;
                    bestIndex = index;
                }
            }
        });

        // Fallback linear wrap
        if (bestIndex === -1) {
            if (direction === 'right' || direction === 'down') {
                bestIndex = (this.currentIndex + 1) % this.focusableElements.length;
            } else if (direction === 'left' || direction === 'up') {
                bestIndex = (this.currentIndex - 1 + this.focusableElements.length) % this.focusableElements.length;
            }
        }

        if (bestIndex !== -1 && bestIndex !== this.currentIndex) {
            this.currentIndex = bestIndex;
            this.focusCurrent();
        }
    }

    handleKeyDown(e) {
        const { key } = e;
        
        // Arrow keys enable TV focus mode only when explicitly pressed
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            document.body.classList.add('is-tv');
            e.preventDefault();
            const dirMap = {
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
                'ArrowRight': 'right'
            };
            this.navigate(dirMap[key]);
        } else if (key === 'Enter') {
            if (this.currentIndex !== -1 && this.focusableElements[this.currentIndex]) {
                const el = this.focusableElements[this.currentIndex];
                if (document.activeElement !== el) {
                    el.click();
                    e.preventDefault();
                }
            }
        } else if (key === 'Escape' || key === 'Backspace') {
            // Check open modals
            const playerModal = document.getElementById('player-modal');
            if (playerModal && !playerModal.classList.contains('hidden')) {
                if (window.App && window.App.closePlayerModal) window.App.closePlayerModal();
                e.preventDefault();
            }
            const abortModal = document.getElementById('abort-modal');
            if (abortModal && !abortModal.classList.contains('hidden')) {
                if (window.App && window.App.cancelAbortGame) window.App.cancelAbortGame();
                e.preventDefault();
            }
        }
    }

    pollGamepad() {
        if (!this.gamepadLoopActive) return;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const now = Date.now();

        let hasActiveInput = false;

        for (let gp of gamepads) {
            if (!gp) continue;

            const axisX = gp.axes[0] || 0;
            const axisY = gp.axes[1] || 0;
            
            // High deadzone to avoid any stick drift (0.75)
            const dpadUp = gp.buttons[12]?.pressed || axisY < -0.75;
            const dpadDown = gp.buttons[13]?.pressed || axisY > 0.75;
            const dpadLeft = gp.buttons[14]?.pressed || axisX < -0.75;
            const dpadRight = gp.buttons[15]?.pressed || axisX > 0.75;

            const anyDirection = dpadUp || dpadDown || dpadLeft || dpadRight;

            if (anyDirection) {
                hasActiveInput = true;
                if (this.axisNeutralRequired && (now - this.lastGamepadAction > 220)) {
                    document.body.classList.add('is-tv');
                    this.axisNeutralRequired = false;
                    this.lastGamepadAction = now;

                    if (dpadUp) this.navigate('up');
                    else if (dpadDown) this.navigate('down');
                    else if (dpadLeft) this.navigate('left');
                    else if (dpadRight) this.navigate('right');
                }
            }

            // Button A (0)
            if (gp.buttons[0]?.pressed) {
                hasActiveInput = true;
                if (now - this.lastGamepadAction > 250) {
                    this.lastGamepadAction = now;
                    if (this.focusableElements[this.currentIndex]) {
                        this.focusableElements[this.currentIndex].click();
                    }
                }
            }

            // Button B (1)
            if (gp.buttons[1]?.pressed) {
                hasActiveInput = true;
                if (now - this.lastGamepadAction > 250) {
                    this.lastGamepadAction = now;
                    const playerModal = document.getElementById('player-modal');
                    if (playerModal && !playerModal.classList.contains('hidden')) {
                        if (window.App && window.App.closePlayerModal) window.App.closePlayerModal();
                    }
                }
            }
        }

        // Stick must return to neutral before registering another direction move
        if (!hasActiveInput) {
            this.axisNeutralRequired = true;
        }

        requestAnimationFrame(() => this.pollGamepad());
    }
}

// Global instance
window.spatialNav = new SpatialNavigation();
