/**
 * Ultimate Draft - Controlador Principal de la Aplicación (v2.2 Demo)
 * Gestiona pantallas, personalización de equipos, flujo de draft, mecánicas de scout,
 * simulation integration, box score rendering, fullscreen, and database browser.
 */

const App = {
    version: "2.2 Demo",
    state: {
        screen: 'menu',
        mode: 'normal', // normal, libre, 3x3, finales
        teams: {
            p1: { name: 'Equipo 1', roster: [], seriesWins: 0, currentScore: 0 },
            p2: { name: 'Equipo 2', roster: [], seriesWins: 0, currentScore: 0 }
        },
        draft: {
            currentPlayer: 1, // 1 or 2
            currentRound: 0,
            positions: ['c', 'pf', 'sf', 'sg', 'pg'],
            pool: [],
            scoutedIndices: [],
            scoutUsedInRound: { p1: {}, p2: {} },
            scoutPenalties: { p1: false, p2: false }
        },
        finals: {
            gamesPlayed: 0,
            seriesHistory: []
        },
        dbFilter: {
            pos: 'all',
            search: '',
            sort: 'rat-desc'
        }
    },

    CDN_URL: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/",
    CDN_ALT_URL: "https://cdn.nba.com/headshots/nba/latest/260x190/",

    NBA_FRANCHISES: [
        "Los Angeles Lakers", "Boston Celtics", "Chicago Bulls", "Golden State Warriors",
        "Miami Heat", "San Antonio Spurs", "New York Knicks", "Philadelphia 76ers",
        "Houston Rockets", "Milwaukee Bucks", "Phoenix Suns", "Denver Nuggets",
        "Dallas Mavericks", "Seattle SuperSonics", "Toronto Raptors", "Cleveland Cavaliers",
        "Indiana Pacers", "Portland Trail Blazers", "Oklahoma City Thunder", "Detroit Pistons",
        "Atlanta Hawks", "Utah Jazz", "Minnesota Timberwolves", "Memphis Grizzlies",
        "Orlando Magic", "Sacramento Kings", "Brooklyn Nets", "New Orleans Pelicans"
    ],

    TEAM_PALETTES: {
        "lakers": ["#552583", "#FDB927"],
        "celtics": ["#007A33", "#BA9653"],
        "bulls": ["#CE1141", "#000000"],
        "warriors": ["#1D428A", "#FFC72C"],
        "heat": ["#98002E", "#F9A01B"],
        "spurs": ["#C4CED4", "#000000"],
        "knicks": ["#006BB6", "#F58426"],
        "76ers": ["#006BB6", "#ED174C"],
        "rockets": ["#CE1141", "#000000"],
        "bucks": ["#00471B", "#EEE1C6"],
        "suns": ["#1D1160", "#E56020"],
        "nuggets": ["#0E2240", "#FEC524"],
        "mavericks": ["#00538C", "#002B5E"],
        "blazers": ["#E03A3E", "#000000"],
        "cavs": ["#860038", "#041E42"],
        "pacers": ["#002D62", "#FDBB30"]
    },

    init() {
        this.bindEvents();
        this.updateAudioButtonState();
        this.updateFullscreenButtonState();
        this.updateDbButtonVisibility();
        console.log(`[Ultimate Draft] v${this.version} Inicializado!`);
    },

    bindEvents() {
        // Fullscreen state listener
        document.addEventListener('fullscreenchange', () => this.updateFullscreenButtonState());
        document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenButtonState());

        // Search & Filter in database screen
        const searchInput = document.getElementById('db-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.dbFilter.search = e.target.value.toLowerCase().trim();
                this.renderDatabaseTable();
            });
        }

        const sortSelect = document.getElementById('db-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.state.dbFilter.sort = e.target.value;
                this.renderDatabaseTable();
            });
        }
    },

    // Dynamic Team Colors and Fallback Vector Profile
    getFallbackAvatar(playerName, teamName, pos) {
        const parts = playerName.trim().split(' ');
        const initials = parts.length > 1
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : parts[0].substring(0, 2).toUpperCase();

        const lowerTeam = (teamName || '').toLowerCase();
        let c1 = '#17408B';
        let c2 = '#0d2654';

        for (let key in this.TEAM_PALETTES) {
            if (lowerTeam.includes(key)) {
                c1 = this.TEAM_PALETTES[key][0];
                c2 = this.TEAM_PALETTES[key][1];
                break;
            }
        }

        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 190" width="260" height="190">
            <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${c1}" />
                    <stop offset="100%" stop-color="${c2}" />
                </linearGradient>
            </defs>
            <rect width="260" height="190" fill="url(#bgGrad)" />
            <circle cx="130" cy="85" r="50" fill="rgba(0,0,0,0.3)" />
            <text x="130" y="102" font-family="Bebas Neue, sans-serif" font-size="52" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">${initials}</text>
            <rect x="0" y="152" width="260" height="38" fill="rgba(0,0,0,0.5)" />
            <text x="130" y="177" font-family="Inter, sans-serif" font-size="13" font-weight="bold" fill="#f1c40f" text-anchor="middle" letter-spacing="1.5">${(pos || 'NBA').toUpperCase()}</text>
        </svg>`;

        return `data:image/svg+xml;base64,${btoa(svg)}`;
    },

    handleImageError(imgEl, playerName, teamName, pos) {
        // Try alternate NBA CDN domain once, then fallback to vector jersey
        if (!imgEl.dataset.triedAlt) {
            imgEl.dataset.triedAlt = 'true';
            const pid = imgEl.dataset.playerId;
            imgEl.src = `${this.CDN_ALT_URL}${pid}.png`;
        } else {
            imgEl.src = this.getFallbackAvatar(playerName, teamName, pos);
        }
    },

    changeScreen(screenId) {
        document.querySelectorAll('section[id^="screen-"]').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(`screen-${screenId}`);
        if (target) {
            target.classList.remove('hidden');
        }
        this.state.screen = screenId;
        this.updateDbButtonVisibility();

        if (window.spatialNav) {
            setTimeout(() => window.spatialNav.updateFocusables(), 100);
        }
    },

    updateDbButtonVisibility() {
        const dbBtn = document.getElementById('header-db-btn');
        if (dbBtn) {
            if (this.state.screen === 'menu') {
                dbBtn.classList.remove('hidden');
            } else {
                dbBtn.classList.add('hidden');
            }
        }

        const abortBtn = document.getElementById('abort-btn');
        if (abortBtn) {
            if (this.state.screen === 'sim') {
                abortBtn.classList.remove('hidden');
            } else {
                abortBtn.classList.add('hidden');
            }
        }
    },

    setMode(mode) {
        this.state.mode = mode;
        if (window.audio) window.audio.playClick();

        if (mode === '3x3') {
            // PRD Section 3: 3x3 uses 3 selections per team from mixed PF, SF, SG, PG
            this.state.draft.positions = ['mix', 'mix', 'mix'];
        } else {
            this.state.draft.positions = ['c', 'pf', 'sf', 'sg', 'pg'];
        }

        const modeBadge = document.getElementById('config-mode-badge');
        if (modeBadge) {
            const labels = {
                'normal': 'Modo Normal (Cartas Ocultas + Scout)',
                'libre': 'Modo Libre (Cartas Reveladas)',
                '3x3': 'Duelo 3x3 (Aleros y Bases Mezclados)',
                'finales': 'Las Finales NBA (Serie al Mejor de 7)'
            };
            modeBadge.innerText = labels[mode] || mode;
        }

        // Randomize team names with non-overlapping franchises
        this.randomizeTeamNames();
        this.changeScreen('config');
    },

    randomizeTeamNames() {
        const pool = [...this.NBA_FRANCHISES].sort(() => 0.5 - Math.random());
        const t1 = pool[0];
        const t2 = pool[1];

        const p1Input = document.getElementById('p1-name');
        const p2Input = document.getElementById('p2-name');

        if (p1Input) p1Input.value = t1;
        if (p2Input) p2Input.value = t2;
    },

    startDraft() {
        if (window.audio) window.audio.playClick();

        const p1Input = document.getElementById('p1-name');
        const p2Input = document.getElementById('p2-name');

        let name1 = p1Input?.value.trim() || 'Equipo 1';
        let name2 = p2Input?.value.trim() || 'Equipo 2';
        if (name1 === name2) {
            name2 = name2 + ' B';
        }

        this.state.teams.p1.name = name1;
        this.state.teams.p2.name = name2;
        this.state.teams.p1.roster = [];
        this.state.teams.p2.roster = [];
        this.state.teams.p1.seriesWins = 0;
        this.state.teams.p2.seriesWins = 0;
        this.state.finals.gamesPlayed = 0;
        this.state.finals.seriesHistory = [];

        this.state.draft.currentPlayer = 1;
        this.state.draft.currentRound = 0;
        this.state.draft.scoutPenalties = { p1: false, p2: false };
        this.state.draft.scoutUsedInRound = { p1: {}, p2: {} };
        this.state.draft.scoutedIndices = [];

        this.changeScreen('draft');
        this.showTurnAnnouncement(1, () => {
            this.renderDraftRound();
        });
    },

    showTurnAnnouncement(playerNum, callback) {
        const teamName = playerNum === 1 ? this.state.teams.p1.name : this.state.teams.p2.name;
        const modal = document.getElementById('turn-announcement-modal');
        const titleEl = document.getElementById('turn-announcement-title');
        const teamEl = document.getElementById('turn-announcement-team');
        const badgeEl = document.getElementById('turn-announcement-badge');

        if (badgeEl) {
            badgeEl.innerText = `EQUIPO ${playerNum}`;
            badgeEl.className = playerNum === 1
                ? 'px-4 py-1.5 rounded-full text-xl font-bebas nba-gradient-red border border-white/20'
                : 'px-4 py-1.5 rounded-full text-xl font-bebas nba-gradient-blue border border-white/20';
        }
        if (titleEl) {
            titleEl.innerText = playerNum === 1 ? "¡COMIENZA EL DRAFT!" : "¡CAMBIO DE TURNO!";
        }
        if (teamEl) {
            teamEl.innerText = teamName;
            teamEl.className = playerNum === 1
                ? 'text-4xl md:text-6xl font-bebas text-[var(--nba-red)]'
                : 'text-4xl md:text-6xl font-bebas text-[var(--nba-blue)]';
        }

        if (window.audio) window.audio.playWhistle();
        modal.classList.remove('hidden');

        // Dismiss after 1.8s or click
        let dismissed = false;
        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            modal.classList.add('hidden');
            if (callback) callback();
        };

        modal.onclick = dismiss;
        setTimeout(dismiss, 1800);
    },

    renderDraftRound() {
        const d = this.state.draft;
        const currentPosKey = d.positions[d.currentRound];
        const isPlayer1 = d.currentPlayer === 1;
        const playerKey = isPlayer1 ? 'p1' : 'p2';
        const currentTeam = this.state.teams[playerKey];

        const posNames = {
            'c': 'PÍVOT (C)',
            'pf': 'ALA-PÍVOT (PF)',
            'sf': 'ALERO (SF)',
            'sg': 'ESCOLTA (SG)',
            'pg': 'BASE (PG)',
            'mix': 'JUGADOR 3x3 (PF / SF / SG / PG)'
        };

        const turnTitle = document.getElementById('draft-turn-title');
        const posSubtitle = document.getElementById('draft-pos-subtitle');
        const pBadge = document.getElementById('draft-player-badge');

        if (turnTitle) turnTitle.innerText = `Turno: ${currentTeam.name}`;
        if (posSubtitle) posSubtitle.innerText = `Selecciona tu ${posNames[currentPosKey] || currentPosKey.toUpperCase()} (Ronda ${d.currentRound + 1} de ${d.positions.length})`;

        if (pBadge) {
            pBadge.innerText = isPlayer1 ? 'EQUIPO 1' : 'EQUIPO 2';
            pBadge.className = isPlayer1
                ? 'px-3 py-1 rounded-full text-base font-bebas nba-gradient-red border border-white/20'
                : 'px-3 py-1 rounded-full text-base font-bebas nba-gradient-blue border border-white/20';
        }

        // Scout Button: Works per position round
        const scoutBtn = document.getElementById('scout-btn');
        d.scoutedIndices = [];

        if (this.state.mode === 'normal') {
            scoutBtn.classList.remove('hidden');
            const roundScouted = d.scoutUsedInRound[playerKey][d.currentRound];
            if (roundScouted) {
                scoutBtn.innerHTML = "<span>Scout Usado en Posición</span>";
                scoutBtn.disabled = true;
            } else {
                scoutBtn.innerHTML = '<img src="icons/search.svg" class="icon-svg w-5 h-5 inline-block" alt="Scout"> <span>Scout (-5% Rendimiento)</span>';
                scoutBtn.disabled = false;
            }
        } else {
            scoutBtn.classList.add('hidden');
        }

        // Pool of 20 unique cards from NBA_DATABASE
        let sourcePool = [];
        if (currentPosKey === 'mix') {
            sourcePool = [
                ...window.NBA_DATABASE.pg,
                ...window.NBA_DATABASE.sg,
                ...window.NBA_DATABASE.sf,
                ...window.NBA_DATABASE.pf
            ];
        } else {
            sourcePool = [...(window.NBA_DATABASE[currentPosKey] || [])];
        }

        const alreadyDraftedIds = new Set([
            ...this.state.teams.p1.roster.map(p => p.id),
            ...this.state.teams.p2.roster.map(p => p.id)
        ]);

        const available = sourcePool.filter(p => !alreadyDraftedIds.has(p.id));
        d.pool = available.sort(() => 0.5 - Math.random()).slice(0, 20);

        this.renderDraftGrid();
    },

    renderDraftGrid() {
        const grid = document.getElementById('draft-cards-grid');
        grid.innerHTML = '';

        const d = this.state.draft;
        const isNormalMode = this.state.mode === 'normal';
        const currentPos = d.positions[d.currentRound];

        d.pool.forEach((player, index) => {
            const isScouted = d.scoutedIndices.includes(index);
            const isHidden = isNormalMode && !isScouted;

            const card = document.createElement('div');
            card.setAttribute('tabindex', '0');
            card.className = `card-draft ${isHidden ? 'card-hidden' : 'card-revealed'} ${isScouted ? 'card-scouted-glow' : ''}`;

            if (isHidden) {
                card.innerHTML = `<div class="card-badge-num">${index + 1}</div>`;
            } else {
                const initialSrc = `${this.CDN_URL}${player.id}.png`;
                card.innerHTML = `
                    <div class="card-badge-num">${index + 1}</div>
                    <div class="card-photo-wrapper">
                        <img src="${initialSrc}" 
                             alt="${player.n}" 
                             data-player-id="${player.id}"
                             loading="lazy"
                             onerror="App.handleImageError(this, '${player.n.replace(/'/g, "\\'")}', '${player.t}', '${currentPos}')">
                    </div>
                    <div class="card-meta">
                        <span class="card-player-name">${player.n}</span>
                        <span class="card-player-team">${player.t}</span>
                    </div>
                `;
            }

            card.onclick = () => {
                if (window.audio) window.audio.playCardFlip();
                this.openPlayerModal(player);
            };

            card.onkeydown = (e) => {
                if (e.key === 'Enter') card.click();
            };

            grid.appendChild(card);
        });
    },

    applyScout() {
        const d = this.state.draft;
        const playerKey = d.currentPlayer === 1 ? 'p1' : 'p2';

        // Mark scout used for this specific position round
        d.scoutUsedInRound[playerKey][d.currentRound] = true;
        d.scoutPenalties[playerKey] = true;

        if (window.audio) window.audio.playClick();

        // Reveal 5 random unrevealed cards
        const availableIndices = [];
        for (let i = 0; i < d.pool.length; i++) {
            if (!d.scoutedIndices.includes(i)) {
                availableIndices.push(i);
            }
        }

        const shuffled = availableIndices.sort(() => 0.5 - Math.random());
        d.scoutedIndices = shuffled.slice(0, 5);

        const scoutBtn = document.getElementById('scout-btn');
        if (scoutBtn) {
            scoutBtn.innerText = "Scout Usado en Posición";
            scoutBtn.disabled = true;
        }

        this.renderDraftGrid();
    },

    openPlayerModal(player) {
        this.selectedPlayer = player;
        const pos = this.state.draft.positions[this.state.draft.currentRound];

        document.getElementById('modal-name').innerText = player.n;
        document.getElementById('modal-team').innerText = player.t;
        document.getElementById('m-t2').innerText = player.t2;
        document.getElementById('m-t3').innerText = player.t3;
        document.getElementById('m-reb').innerText = player.reb;
        document.getElementById('m-blk').innerText = player.blk;
        document.getElementById('m-ast').innerText = player.ast;
        document.getElementById('m-stl').innerText = player.stl;
        document.getElementById('m-rat').innerText = `${player.rat} OVR`;

        const imgBox = document.getElementById('modal-img');
        const initialSrc = `${this.CDN_URL}${player.id}.png`;
        imgBox.innerHTML = `
            <img src="${initialSrc}" 
                 class="w-full h-full object-cover filter drop-shadow-lg" 
                 alt="${player.n}"
                 data-player-id="${player.id}"
                 onerror="App.handleImageError(this, '${player.n.replace(/'/g, "\\'")}', '${player.t}', '${pos}')">
        `;

        document.getElementById('player-modal').classList.remove('hidden');

        const confirmBtn = document.getElementById('modal-select-btn');
        if (confirmBtn) confirmBtn.focus();
    },

    closePlayerModal() {
        if (!this.selectedPlayer) return;

        if (window.audio) window.audio.playClick();

        const pKey = this.state.draft.currentPlayer === 1 ? 'p1' : 'p2';
        this.state.teams[pKey].roster.push({
            ...this.selectedPlayer,
            stats: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fga: 0, fgm: 0, t3a: 0, t3m: 0 }
        });

        this.selectedPlayer = null;
        document.getElementById('player-modal').classList.add('hidden');

        // Advance round
        this.state.draft.currentRound++;

        if (this.state.draft.currentRound >= this.state.draft.positions.length) {
            if (this.state.draft.currentPlayer === 1) {
                // Switch to Player 2 with Turn Announcement
                this.state.draft.currentPlayer = 2;
                this.state.draft.currentRound = 0;
                this.showTurnAnnouncement(2, () => {
                    this.renderDraftRound();
                });
            } else {
                // Draft complete -> Matchup Arena
                this.prepareMatchup();
            }
        } else {
            this.renderDraftRound();
        }
    },

    prepareMatchup() {
        this.changeScreen('matchup');

        const calcTeamRating = (roster) => Math.round(roster.reduce((a, b) => a + b.rat, 0) / roster.length);
        const r1 = calcTeamRating(this.state.teams.p1.roster);
        const r2 = calcTeamRating(this.state.teams.p2.roster);

        document.getElementById('m-team1-name').innerText = this.state.teams.p1.name;
        document.getElementById('m-team1-rating').innerText = r1;
        document.getElementById('m-team2-name').innerText = this.state.teams.p2.name;
        document.getElementById('m-team2-rating').innerText = r2;

        const renderRosterThumbs = (teamKey, containerId) => {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            this.state.teams[teamKey].roster.forEach(p => {
                const item = document.createElement('div');
                item.className = "flex flex-col items-center";
                item.innerHTML = `
                    <div class="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-white/20 bg-gray-900 overflow-hidden shadow-lg">
                        <img src="${this.CDN_URL}${p.id}.png" 
                             class="w-full h-full object-cover" 
                             data-player-id="${p.id}"
                             onerror="App.handleImageError(this, '${p.n.replace(/'/g, "\\'")}', '${p.t}', '')">
                    </div>
                    <span class="text-[11px] font-bold truncate max-w-[70px] mt-0.5 text-gray-300">${p.n.split(' ').pop()}</span>
                    <span class="text-[9px] text-[var(--nba-gold)] font-bebas">${p.rat} OVR</span>
                `;
                container.appendChild(item);
            });
        };

        renderRosterThumbs('p1', 'm-team1-roster');
        renderRosterThumbs('p2', 'm-team2-roster');

        const tipOffBtn = document.getElementById('tipoff-btn');
        if (tipOffBtn) tipOffBtn.focus();
    },

    startSimulation() {
        if (window.audio) window.audio.playWhistle();

        this.changeScreen('sim');

        document.getElementById('s-t1-name').innerText = this.state.teams.p1.name;
        document.getElementById('s-t2-name').innerText = this.state.teams.p2.name;
        document.getElementById('sim-log').innerHTML = '';

        // Initialize persistent stats table rows
        this.initSimStatsTable();

        window.simulation.startMatch(
            this.state.teams,
            this.state.draft.scoutPenalties,
            {
                onTick: (data) => this.onSimTick(data),
                onPlay: (playItem) => this.onSimPlay(playItem),
                onQuarterEnd: (data) => this.onSimQuarterEnd(data),
                onFinish: (data) => this.onSimFinish(data)
            }
        );
    },

    initSimStatsTable() {
        const tbody1 = document.getElementById('stats-table-body-t1');
        const tbody2 = document.getElementById('stats-table-body-t2');

        if (tbody1 && tbody2) {
            tbody1.innerHTML = '';
            tbody2.innerHTML = '';

            const t1Label = document.getElementById('sim-t1-stat-title');
            const t2Label = document.getElementById('sim-t2-stat-title');
            if (t1Label) t1Label.innerText = this.state.teams.p1.name;
            if (t2Label) t2Label.innerText = this.state.teams.p2.name;

            const renderTeamRows = (team, tbody, isP1) => {
                team.roster.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.id = `stat-row-${p.id}`;
                    tr.className = "border-b border-gray-800/70 transition duration-150";
                    tr.innerHTML = `
                        <td class="py-0.5 sm:py-1 px-0.5 sm:px-1 font-bold ${isP1 ? 'text-red-400' : 'text-blue-400'} flex items-center gap-1 sm:gap-1.5">
                            <img src="${this.CDN_URL}${p.id}.png" 
                                 class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-800 object-cover flex-shrink-0" 
                                 data-player-id="${p.id}"
                                 onerror="App.handleImageError(this, '${p.n.replace(/'/g, "\\'")}', '${p.t}', '')">
                            <span class="truncate max-w-[68px] sm:max-w-[110px] text-[10px] sm:text-xs leading-none">${p.n}</span>
                        </td>
                        <td id="p-pts-${p.id}" class="py-0.5 sm:py-1 px-0.5 sm:px-1 font-bold text-white text-[10px] sm:text-xs">0</td>
                        <td id="p-reb-${p.id}" class="py-0.5 sm:py-1 px-0.5 sm:px-1 text-gray-300 text-[10px] sm:text-xs">0</td>
                        <td id="p-ast-${p.id}" class="py-0.5 sm:py-1 px-0.5 sm:px-1 text-gray-300 text-[10px] sm:text-xs">0</td>
                        <td id="p-stl-${p.id}" class="py-0.5 sm:py-1 px-0.5 sm:px-1 text-gray-300 text-[10px] sm:text-xs">0</td>
                        <td id="p-blk-${p.id}" class="py-0.5 sm:py-1 px-0.5 sm:px-1 text-gray-300 text-[10px] sm:text-xs">0</td>
                    `;
                    tbody.appendChild(tr);
                });
            };

            renderTeamRows(this.state.teams.p1, tbody1, true);
            renderTeamRows(this.state.teams.p2, tbody2, false);
        }
    },

    onSimTick(data) {
        // Update Clock
        const minutes = Math.floor(data.timeRemaining / 60);
        const seconds = Math.floor(data.timeRemaining % 60);
        document.getElementById('s-clock').innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Update Scores with flash animation
        const s1El = document.getElementById('s-t1-score');
        const s2El = document.getElementById('s-t2-score');

        const prevS1 = parseInt(s1El.innerText || '0', 10);
        const prevS2 = parseInt(s2El.innerText || '0', 10);

        s1El.innerText = data.scores.p1;
        s2El.innerText = data.scores.p2;

        if (data.scores.p1 > prevS1) {
            s1El.classList.remove('score-flash-red');
            void s1El.offsetWidth;
            s1El.classList.add('score-flash-red');
        }
        if (data.scores.p2 > prevS2) {
            s2El.classList.remove('score-flash-blue');
            void s2El.offsetWidth;
            s2El.classList.add('score-flash-blue');
        }

        const qNames = ["1ER CUARTO", "2DO CUARTO", "3ER CUARTO", "4TO CUARTO", "OVERTIME"];
        document.getElementById('s-quarter').innerText = data.isOT ? "OVERTIME (OT)" : qNames[data.quarter - 1];

        // Update cell values directly without destroying DOM
        [this.state.teams.p1, this.state.teams.p2].forEach(team => {
            team.roster.forEach(p => {
                const ptsEl = document.getElementById(`p-pts-${p.id}`);
                const rebEl = document.getElementById(`p-reb-${p.id}`);
                const astEl = document.getElementById(`p-ast-${p.id}`);
                const stlEl = document.getElementById(`p-stl-${p.id}`);
                const blkEl = document.getElementById(`p-blk-${p.id}`);

                if (ptsEl && ptsEl.innerText !== p.stats.pts.toString()) ptsEl.innerText = p.stats.pts;
                if (rebEl && rebEl.innerText !== p.stats.reb.toString()) rebEl.innerText = p.stats.reb;
                if (astEl && astEl.innerText !== p.stats.ast.toString()) astEl.innerText = p.stats.ast;
                if (stlEl && stlEl.innerText !== p.stats.stl.toString()) stlEl.innerText = p.stats.stl;
                if (blkEl && blkEl.innerText !== p.stats.blk.toString()) blkEl.innerText = p.stats.blk;
            });
        });
    },

    // Smooth prepend of new play item without flicker
    onSimPlay(playItem) {
        const logContainer = document.getElementById('sim-log');
        const div = document.createElement('div');
        div.className = `log-entry ${playItem.team === 'p1' ? 'team-p1' : 'team-p2'}`;
        const iconName = playItem.icon || 'basketball';
        div.innerHTML = `<img src="icons/${iconName}.svg" class="icon-svg w-4 h-4 object-contain inline-block flex-shrink-0" alt=""> <span>${playItem.msg}</span>`;

        logContainer.prepend(div);
        if (logContainer.childNodes.length > 10) {
            logContainer.removeChild(logContainer.lastChild);
        }

        // Quick, non-sticky flash on row (300ms)
        if (playItem.pid) {
            const row = document.getElementById(`stat-row-${playItem.pid}`);
            if (row) {
                row.classList.remove('stat-row-flash');
                void row.offsetWidth;
                row.classList.add('stat-row-flash');
                setTimeout(() => row.classList.remove('stat-row-flash'), 350);
            }
        }
    },

    // Abort Match flow
    promptAbortGame() {
        window.simulation.pause();
        const modal = document.getElementById('abort-modal');
        modal.classList.remove('hidden');
    },

    cancelAbortGame() {
        document.getElementById('abort-modal').classList.add('hidden');
        window.simulation.resume();
    },

    confirmAbortGame() {
        document.getElementById('abort-modal').classList.add('hidden');
        window.simulation.stop();
        this.changeScreen('menu');
    },

    onSimQuarterEnd(data) {
        document.getElementById('period-title').innerText = data.title;
        document.getElementById('next-period-msg').innerText = data.subtitle;
        document.getElementById('p-m-s1').innerText = data.scores.p1;
        document.getElementById('p-m-s2').innerText = data.scores.p2;
        document.getElementById('period-modal').classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('period-modal').classList.add('hidden');
        }, 3000);
    },

    onSimFinish(data) {
        this.changeScreen('results');
        if (window.audio) {
            window.audio.playVictory();
        }

        const winnerKey = data.winner;
        this.state.teams[winnerKey].seriesWins++;
        this.state.finals.gamesPlayed++;

        // Final Score Box
        const scoreBox = document.getElementById('final-score-box');
        scoreBox.innerHTML = `
            <div class="text-center flex-1 min-w-0">
                <p class="font-bebas text-sm sm:text-lg text-gray-300 truncate">${this.state.teams.p1.name}</p>
                <p class="text-3xl sm:text-5xl font-black ${winnerKey === 'p1' ? 'text-[var(--nba-red)] font-bebas' : 'text-gray-400 font-bebas'} leading-none">${this.state.teams.p1.currentScore}</p>
            </div>
            <div class="text-2xl sm:text-3xl font-bebas text-[var(--nba-gold)] italic px-2">VS</div>
            <div class="text-center flex-1 min-w-0">
                <p class="font-bebas text-sm sm:text-lg text-gray-300 truncate">${this.state.teams.p2.name}</p>
                <p class="text-3xl sm:text-5xl font-black ${winnerKey === 'p2' ? 'text-[var(--nba-blue)] font-bebas' : 'text-gray-400 font-bebas'} leading-none">${this.state.teams.p2.currentScore}</p>
            </div>
        `;

        // MVP Card
        const mvp = data.mvp;
        document.getElementById('mvp-name').innerText = mvp.n;
        document.getElementById('mvp-team').innerText = mvp.t;
        document.getElementById('mvp-stats-line').innerText = `${mvp.stats.pts} PTS | ${mvp.stats.reb} REB | ${mvp.stats.ast} AST | ${mvp.stats.stl} ROB | ${mvp.stats.blk} TAP`;
        document.getElementById('mvp-img-box').innerHTML = `
            <img src="${this.CDN_URL}${mvp.id}.png" 
                 class="w-full h-full object-cover filter drop-shadow" 
                 data-player-id="${mvp.id}"
                 onerror="App.handleImageError(this, '${mvp.n.replace(/'/g, "\\'")}', '${mvp.t}', '')">
        `;

        const isP1Mvp = this.state.teams.p1.roster.some(p => p.id === mvp.id);
        const mvpCard = document.getElementById('mvp-card');
        mvpCard.style.borderColor = isP1Mvp ? 'var(--nba-red)' : 'var(--nba-blue)';

        // Box Scores
        this.renderBoxScoreTable('res-table-t1', this.state.teams.p1.roster, mvp.id);
        this.renderBoxScoreTable('res-table-t2', this.state.teams.p2.roster, mvp.id);
        document.getElementById('res-t1-name').innerText = this.state.teams.p1.name;
        document.getElementById('res-t2-name').innerText = this.state.teams.p2.name;

        // Finales series tracker (Bo7)
        const controls = document.getElementById('finales-controls');
        controls.innerHTML = '';

        if (this.state.mode === 'finales') {
            const limit = 4;
            const p1Wins = this.state.teams.p1.seriesWins;
            const p2Wins = this.state.teams.p2.seriesWins;

            if (p1Wins >= limit || p2Wins >= limit) {
                const champName = p1Wins >= limit ? this.state.teams.p1.name : this.state.teams.p2.name;
                controls.innerHTML = `
                    <div class="text-center space-y-1">
                        <div class="text-2xl sm:text-3xl font-bebas text-[var(--nba-gold)] flex items-center justify-center gap-2 animate-pulse">
                            <img src="icons/trophy.svg" class="icon-svg w-7 h-7 sm:w-9 sm:h-9 object-contain" alt="Trofeo">
                            <span>¡${champName} ES EL CAMPEÓN DE LAS FINALES!</span>
                            <img src="icons/trophy.svg" class="icon-svg w-7 h-7 sm:w-9 sm:h-9 object-contain" alt="Trofeo">
                        </div>
                        <p class="text-xs sm:text-sm text-gray-300 font-bebas">Serie Final: ${p1Wins} - ${p2Wins}</p>
                        <div class="flex gap-3 justify-center pt-0.5">
                            <button onclick="App.changeScreen('menu')" class="btn-nba btn-nba-gold px-8 py-2 text-lg sm:text-xl rounded-xl">Menú Principal</button>
                        </div>
                    </div>
                `;
            } else {
                controls.innerHTML = `
                    <div class="text-center space-y-1">
                        <div class="text-xs sm:text-sm font-bebas text-gray-300">
                            Serie al mejor de 7: <span class="text-[var(--nba-red)] font-bold">${this.state.teams.p1.name} (${p1Wins})</span> - <span class="text-[var(--nba-blue)] font-bold">(${p2Wins}) ${this.state.teams.p2.name}</span>
                        </div>
                        <div class="flex gap-3 justify-center pt-0.5">
                            <button onclick="App.startSimulation()" class="btn-nba btn-nba-gold px-6 sm:px-8 py-2 text-base sm:text-lg rounded-xl">Siguiente Partido (Juego ${this.state.finals.gamesPlayed + 1})</button>
                            <button onclick="App.changeScreen('menu')" class="btn-nba px-5 py-2 text-sm sm:text-base rounded-xl">Salir al Menú</button>
                        </div>
                    </div>
                `;
            }
        } else {
            controls.innerHTML = `
                <button onclick="App.changeScreen('menu')" class="btn-nba btn-nba-gold px-8 py-2 text-lg sm:text-xl rounded-xl">Menú Principal</button>
            `;
        }
    },

    renderBoxScoreTable(tableId, roster, mvpId) {
        const table = document.getElementById(tableId);
        table.innerHTML = `
            <thead>
                <tr class="text-gray-400 font-bebas text-[11px] sm:text-xs border-b border-gray-700">
                    <th class="py-1 px-1">JUGADOR</th>
                    <th class="py-1 px-1">PTS</th>
                    <th class="py-1 px-1">REB</th>
                    <th class="py-1 px-1">AST</th>
                    <th class="py-1 px-1">ROB</th>
                    <th class="py-1 px-1">TAP</th>
                    <th class="py-1 px-1">TC</th>
                    <th class="py-1 px-1">FG%</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        roster.forEach(p => {
            const fgPct = p.stats.fga > 0 ? Math.round((p.stats.fgm / p.stats.fga) * 100) : 0;
            const isMvp = p.id === mvpId;
            const tr = document.createElement('tr');
            tr.className = isMvp
                ? 'bg-[var(--nba-gold)]/20 font-bold border-l-4 border-[var(--nba-gold)]'
                : 'border-b border-gray-800/80 hover:bg-white/5';

            tr.innerHTML = `
                <td class="py-0.5 px-1 font-bold flex items-center gap-1.5">
                    <img src="${this.CDN_URL}${p.id}.png" 
                         class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-800 object-cover flex-shrink-0" 
                         data-player-id="${p.id}"
                         onerror="App.handleImageError(this, '${p.n.replace(/'/g, "\\'")}', '${p.t}', '')">
                    <span class="text-[11px] sm:text-xs truncate max-w-[80px] sm:max-w-[105px]">${p.n}</span> ${isMvp ? '<img src="icons/star.svg" class="icon-svg w-3.5 h-3.5 object-contain inline-block ml-1" alt="MVP" title="MVP">' : ''}
                </td>
                <td class="py-0.5 px-1 font-bold text-white text-[11px] sm:text-xs">${p.stats.pts}</td>
                <td class="py-0.5 px-1 text-[11px] sm:text-xs">${p.stats.reb}</td>
                <td class="py-0.5 px-1 text-[11px] sm:text-xs">${p.stats.ast}</td>
                <td class="py-0.5 px-1 text-[11px] sm:text-xs">${p.stats.stl}</td>
                <td class="py-0.5 px-1 text-[11px] sm:text-xs">${p.stats.blk}</td>
                <td class="py-0.5 px-1 text-[11px] sm:text-xs">${p.stats.fgm}/${p.stats.fga}</td>
                <td class="py-0.5 px-1 text-[11px] sm:text-xs">${fgPct}%</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Settings / Database Viewer
    showSettings() {
        if (window.audio) window.audio.playClick();
        this.changeScreen('settings');
        this.renderDatabaseTable();
    },

    setDbPositionFilter(pos) {
        if (window.audio) window.audio.playClick();
        this.state.dbFilter.pos = pos;

        document.querySelectorAll('.db-pos-tab').forEach(tab => {
            if (tab.dataset.pos === pos) {
                tab.className = "db-pos-tab px-3 py-1.5 rounded-lg font-bebas text-base btn-nba btn-nba-gold";
            } else {
                tab.className = "db-pos-tab px-3 py-1.5 rounded-lg font-bebas text-base bg-gray-800 hover:bg-gray-700 text-gray-300";
            }
        });

        this.renderDatabaseTable();
    },

    renderDatabaseTable() {
        const tbody = document.getElementById('db-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        let allPlayers = [];
        const posKeys = ['c', 'pf', 'sf', 'sg', 'pg'];

        posKeys.forEach(pos => {
            const list = window.NBA_DATABASE[pos] || [];
            list.forEach(p => {
                allPlayers.push({ ...p, posKey: pos, posLabel: pos.toUpperCase() });
            });
        });

        if (this.state.dbFilter.pos !== 'all') {
            allPlayers = allPlayers.filter(p => p.posKey === this.state.dbFilter.pos);
        }

        if (this.state.dbFilter.search) {
            const q = this.state.dbFilter.search;
            allPlayers = allPlayers.filter(p =>
                p.n.toLowerCase().includes(q) || p.t.toLowerCase().includes(q)
            );
        }

        const sort = this.state.dbFilter.sort;
        allPlayers.sort((a, b) => {
            if (sort === 'rat-desc') return b.rat - a.rat;
            if (sort === 'rat-asc') return a.rat - b.rat;
            if (sort === 'name-asc') return a.n.localeCompare(b.n);
            if (sort === 't2-desc') return b.t2 - a.t2;
            if (sort === 't3-desc') return b.t3 - a.t3;
            if (sort === 'reb-desc') return b.reb - a.reb;
            if (sort === 'ast-desc') return b.ast - a.ast;
            if (sort === 'stl-desc') return b.stl - a.stl;
            if (sort === 'blk-desc') return b.blk - a.blk;
            return 0;
        });

        const countEl = document.getElementById('db-player-count');
        if (countEl) countEl.innerText = `${allPlayers.length} Jugadores`;

        allPlayers.slice(0, 150).forEach(p => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-800 hover:bg-white/5 transition";
            tr.innerHTML = `
                <td class="p-1.5 font-bebas text-base text-gray-400">${p.posLabel}</td>
                <td class="p-1.5 flex items-center gap-2">
                    <img src="${this.CDN_URL}${p.id}.png" 
                         class="w-8 h-8 rounded-full bg-gray-800 object-cover border border-white/10" 
                         alt="${p.n}" 
                         data-player-id="${p.id}"
                         loading="lazy"
                         onerror="App.handleImageError(this, '${p.n.replace(/'/g, "\\'")}', '${p.t}', '${p.posKey}')">
                    <div>
                        <p class="font-bold text-white text-xs sm:text-sm leading-tight">${p.n}</p>
                        <p class="text-[10px] text-gray-400">${p.t}</p>
                    </div>
                </td>
                <td class="p-1.5 font-bebas text-xl font-black text-[var(--nba-gold)]">${p.rat}</td>
                <td class="p-1.5 text-xs sm:text-sm">${p.t2}</td>
                <td class="p-1.5 text-xs sm:text-sm">${p.t3}</td>
                <td class="p-1.5 text-xs sm:text-sm">${p.reb}</td>
                <td class="p-1.5 text-xs sm:text-sm">${p.ast}</td>
                <td class="p-1.5 text-xs sm:text-sm">${p.stl}</td>
                <td class="p-1.5 text-xs sm:text-sm">${p.blk}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Audio & Fullscreen Handlers
    toggleAudio() {
        if (window.audio) {
            const isMuted = window.audio.toggleMute();
            this.updateAudioButtonState();
            if (!isMuted) window.audio.playClick();
        }
    },

    updateAudioButtonState() {
        const btn = document.getElementById('audio-toggle-btn');
        if (!btn || !window.audio) return;
        const isMuted = window.audio.isMuted;
        btn.innerHTML = `<img src="icons/${isMuted ? 'volume-mute' : 'volume-up'}.svg" class="icon-svg w-4 h-4 sm:w-5 sm:h-5 object-contain" alt="${isMuted ? 'Silenciado' : 'Sonido'}">`;
        btn.title = isMuted ? "Activar Sonido" : "Silenciar Sonido";
    },

    toggleFullscreen() {
        if (window.audio) window.audio.playClick();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
            }
        }
    },

    updateFullscreenButtonState() {
        const btn = document.getElementById('fullscreen-btn');
        if (!btn) return;
        const isFS = !!document.fullscreenElement;
        btn.innerHTML = `<img src="icons/${isFS ? 'fullscreen-exit' : 'fullscreen'}.svg" class="icon-svg w-4 h-4 sm:w-5 sm:h-5 object-contain" alt="${isFS ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}">`;
        btn.title = isFS ? "Salir de Pantalla Completa" : "Pantalla Completa";
    },

    openLegalModal(tab) {
        if (window.ConsentManager) {
            window.ConsentManager.openLegalModal(tab);
        }
    },

    closeLegalModal() {
        if (window.ConsentManager) {
            window.ConsentManager.closeLegalModal();
        }
    }
};

window.App = App;
window.addEventListener('DOMContentLoaded', () => App.init());
