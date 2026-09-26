/**
 * NBA Ultimate Draft - Spatial Navigation Engine
 * Provides D-Pad / Arrow key directional navigation for Smart TVs,
 * Gamepads, and keyboard accessibility.
 */

class SpatialNavigation {
    constructor() {
        this.focusableElements = [];
        this.currentIndex = -1;
        this.isTVMode = false;
        this.gamepadLoopActive = false;
        this.lastGamepadAction = 0;
        
        this.initDetection();
        this.initListeners();
    }

    initDetection() {
        const urlParams = new URLSearchParams(window.location.search);
        const forceTV = urlParams.get('forceTV') === 'true';
        const ua = navigator.userAgent.toLowerCase();
        const isSmartTV = ua.includes('tv') || ua.includes('smart-tv') || ua.includes('crkey') || ua.includes('tizen') || ua.includes('webos');
        const isBigScreen = window.innerWidth >= 1920 && !('ontouchstart' in window);
        
        this.isTVMode = forceTV || isSmartTV || isBigScreen;
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

        // Gamepad support
        window.addEventListener('gamepadconnected', () => {
            if (!this.gamepadLoopActive) {
                this.gamepadLoopActive = true;
                this.pollGamepad();
            }
        });

        // Watch for DOM changes to update focusable elements list
        const observer = new MutationObserver(() => {
            setTimeout(() => this.updateFocusables(), 100);
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    }

    updateFocusables() {
        // Collect visible, non-disabled interactive elements
        this.focusableElements = Array.from(document.querySelectorAll(
            'button:not(.hidden):not(:disabled), input:not(.hidden):not(:disabled), select:not(.hidden):not(:disabled), [tabindex="0"]:not(.hidden)'
        )).filter(el => {
            const style = window.getComputedStyle(el);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0;
            // Exclude inside hidden sections or modals
            const parentHidden = el.closest('.hidden');
            return isVisible && !parentHidden;
        });

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
                // Directional weighting
                const distance = Math.sqrt((dx * dx) + (dy * dy));
                if (distance < minDistance) {
                    minDistance = distance;
                    bestIndex = index;
                }
            }
        });

        // Fallback for linear navigation if spatial match wasn't found
        if (bestIndex === -1) {
            if (direction === 'right' || direction === 'down') {
                bestIndex = (this.currentIndex + 1) % this.focusableElements.length;
            } else if (direction === 'left' || direction === 'up') {
                bestIndex = (this.currentIndex - 1 + this.focusableElements.length) % this.focusableElements.length;
            }
        }

        if (bestIndex !== -1) {
            this.currentIndex = bestIndex;
            this.focusCurrent();
        }
    }

    handleKeyDown(e) {
        const { key } = e;
        
        // Activate TV navigation style when user presses arrow keys
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
            // Modal dismiss or back button
            const playerModal = document.getElementById('player-modal');
            if (playerModal && !playerModal.classList.contains('hidden')) {
                if (window.closePlayerModal) window.closePlayerModal();
                e.preventDefault();
            }
        }
    }

    pollGamepad() {
        if (!this.gamepadLoopActive) return;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const now = Date.now();

        for (let gp of gamepads) {
            if (!gp) continue;

            if (now - this.lastGamepadAction > 180) {
                // D-pad or left stick
                const up = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
                const down = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
                const left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
                const right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;

                if (up) { this.navigate('up'); this.lastGamepadAction = now; }
                else if (down) { this.navigate('down'); this.lastGamepadAction = now; }
                else if (left) { this.navigate('left'); this.lastGamepadAction = now; }
                else if (right) { this.navigate('right'); this.lastGamepadAction = now; }

                // A button (button 0) for click
                if (gp.buttons[0]?.pressed) {
                    if (this.focusableElements[this.currentIndex]) {
                        this.focusableElements[this.currentIndex].click();
                        this.lastGamepadAction = now + 100;
                    }
                }

                // B button (button 1) for back
                if (gp.buttons[1]?.pressed) {
                    const playerModal = document.getElementById('player-modal');
                    if (playerModal && !playerModal.classList.contains('hidden')) {
                        if (window.closePlayerModal) window.closePlayerModal();
                        this.lastGamepadAction = now + 100;
                    }
                }
            }
        }

        requestAnimationFrame(() => this.pollGamepad());
    }
}

// Global instance
window.spatialNav = new SpatialNavigation();
