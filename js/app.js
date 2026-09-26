/**
 * NBA Ultimate Draft - Main Application Controller
 * Handles screen routing, game modes, drafting flow, scout mechanics,
 * simulation integration, box score rendering, and database browser.
 */

const App = {
    state: {
        screen: 'menu',
        mode: 'normal', // normal, libre, 3x3, finales
        teams: {
            p1: { name: 'Equipo 1', roster: [], scoutUsed: false, seriesWins: 0, currentScore: 0 },
            p2: { name: 'Equipo 2', roster: [], scoutUsed: false, seriesWins: 0, currentScore: 0 }
        },
        draft: {
            currentPlayer: 1, // 1 or 2
            currentRound: 0,
            positions: ['c', 'pf', 'sf', 'sg', 'pg'],
            pool: [],
            scoutedIndices: [],
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
    FALLBACK_SVG: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNjAgMTkwIiB3aWR0aD0iMjYwIiBoZWlnaHQ9IjE5MCI+PHJlY3Qgd2lkdGg9IjI2MCIgaGVpZ2h0PSIxOTAiIGZpbGw9IiMwZDFlMzMiLz48Y2lyY2xlIGN4PSIxMzAiIGN5PSI4NSIgcj0iNDUiIGZpbGw9IiMxNzQwOGIiLz48cGF0aCBkPSJNNTAgMTcwIEM1MCAxMjAgMjEwIDEyMCAyMTAgMTcwIFoiIGZpbGw9IiMxNzQwOGIiLz48dGV4dCB4PSIxMzAiIHk9IjE3NSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5CQTwvdGV4dD48L3N2Zz4=',

    init() {
        this.bindEvents();
        this.updateAudioButtonState();
        console.log("🏀 NBA Ultimate Draft Pro Loaded with 1,000 Real Players!");
    },

    bindEvents() {
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

    changeScreen(screenId) {
        document.querySelectorAll('section[id^="screen-"]').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(`screen-${screenId}`);
        if (target) {
            target.classList.remove('hidden');
        }
        this.state.screen = screenId;
        window.scrollTo(0, 0);

        if (window.spatialNav) {
            setTimeout(() => window.spatialNav.updateFocusables(), 100);
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

        // Set screen title or badge
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

        this.changeScreen('config');
    },

    startDraft() {
        if (window.audio) window.audio.playClick();

        const p1Input = document.getElementById('p1-name');
        const p2Input = document.getElementById('p2-name');

        this.state.teams.p1.name = p1Input?.value.trim() || 'Equipo 1';
        this.state.teams.p2.name = p2Input?.value.trim() || 'Equipo 2';
        this.state.teams.p1.roster = [];
        this.state.teams.p2.roster = [];
        this.state.teams.p1.seriesWins = 0;
        this.state.teams.p2.seriesWins = 0;
        this.state.finals.gamesPlayed = 0;
        this.state.finals.seriesHistory = [];

        this.state.draft.currentPlayer = 1;
        this.state.draft.currentRound = 0;
        this.state.draft.scoutPenalties = { p1: false, p2: false };
        this.state.draft.scoutedIndices = [];

        this.renderDraftRound();
        this.changeScreen('draft');
    },

    renderDraftRound() {
        const d = this.state.draft;
        const currentPosKey = d.positions[d.currentRound];
        const isPlayer1 = d.currentPlayer === 1;
        const currentTeam = isPlayer1 ? this.state.teams.p1 : this.state.teams.p2;

        const posNames = {
            'c': 'PÍVOT (C)',
            'pf': 'ALA-PÍVOT (PF)',
            'sf': 'ALERO (SF)',
            'sg': 'ESCOLTA (SG)',
            'pg': 'BASE (PG)',
            'mix': 'JUGADOR 3x3 (PF / SF / SG / PG)'
        };

        // Header info
        const turnTitle = document.getElementById('draft-turn-title');
        const posSubtitle = document.getElementById('draft-pos-subtitle');
        const pBadge = document.getElementById('draft-player-badge');

        if (turnTitle) turnTitle.innerText = `Turno de Selección: ${currentTeam.name}`;
        if (posSubtitle) posSubtitle.innerText = `Posición: ${posNames[currentPosKey] || currentPosKey.toUpperCase()} (Ronda ${d.currentRound + 1} de ${d.positions.length})`;
        
        if (pBadge) {
            pBadge.innerText = isPlayer1 ? 'P1' : 'P2';
            pBadge.className = isPlayer1 
                ? 'px-3 py-1 rounded-full text-lg font-bebas nba-gradient-red border border-white/20'
                : 'px-3 py-1 rounded-full text-lg font-bebas nba-gradient-blue border border-white/20';
        }

        // Scout Button handling
        const scoutBtn = document.getElementById('scout-btn');
        d.scoutedIndices = [];

        if (this.state.mode === 'normal') {
            scoutBtn.classList.remove('hidden');
            const penaltyActive = d.scoutPenalties[isPlayer1 ? 'p1' : 'p2'];
            if (penaltyActive) {
                scoutBtn.innerText = "Scout Utilizado (-5% Stats)";
                scoutBtn.disabled = true;
            } else {
                scoutBtn.innerText = "🔍 Scout (-5% Rendimiento)";
                scoutBtn.disabled = false;
            }
        } else {
            scoutBtn.classList.add('hidden');
        }

        // Generate independent pool of 20 unique cards from NBA_DATABASE
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

        // Filter out already drafted players
        const alreadyDraftedIds = new Set([
            ...this.state.teams.p1.roster.map(p => p.id),
            ...this.state.teams.p2.roster.map(p => p.id)
        ]);

        const available = sourcePool.filter(p => !alreadyDraftedIds.has(p.id));
        
        // Shuffle & pick 20
        d.pool = available.sort(() => 0.5 - Math.random()).slice(0, 20);

        this.renderDraftGrid();
    },

    renderDraftGrid() {
        const grid = document.getElementById('draft-cards-grid');
        grid.innerHTML = '';

        const d = this.state.draft;
        const isNormalMode = this.state.mode === 'normal';

        d.pool.forEach((player, index) => {
            const isScouted = d.scoutedIndices.includes(index);
            const isHidden = isNormalMode && !isScouted;

            const card = document.createElement('div');
            card.setAttribute('tabindex', '0');
            card.className = `card-draft ${isHidden ? 'card-hidden' : 'card-revealed'} ${isScouted ? 'card-scouted-glow' : ''}`;

            if (isHidden) {
                card.innerHTML = `
                    <div class="card-badge-num">${index + 1}</div>
                `;
            } else {
                card.innerHTML = `
                    <div class="card-badge-num">${index + 1}</div>
                    <div class="card-photo-wrapper">
                        <img src="${this.CDN_URL}${player.id}.png" 
                             alt="${player.n}" 
                             loading="lazy"
                             onerror="this.src='${this.FALLBACK_SVG}'">
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
                if (e.key === 'Enter') {
                    card.click();
                }
            };

            grid.appendChild(card);
        });
    },

    applyScout() {
        const d = this.state.draft;
        const playerKey = d.currentPlayer === 1 ? 'p1' : 'p2';
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
            scoutBtn.innerText = "Scout Activado (-5% Stats)";
            scoutBtn.disabled = true;
        }

        this.renderDraftGrid();
    },

    openPlayerModal(player) {
        this.selectedPlayer = player;

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
        imgBox.innerHTML = `
            <img src="${this.CDN_URL}${player.id}.png" 
                 class="w-full h-full object-contain filter drop-shadow-lg" 
                 alt="${player.n}"
                 onerror="this.src='${this.FALLBACK_SVG}'">
        `;

        document.getElementById('player-modal').classList.remove('hidden');

        const confirmBtn = document.getElementById('modal-select-btn');
        if (confirmBtn) {
            confirmBtn.focus();
        }
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

        // Advance draft lifecycle
        this.state.draft.currentRound++;

        if (this.state.draft.currentRound >= this.state.draft.positions.length) {
            if (this.state.draft.currentPlayer === 1) {
                // Switch to Player 2
                this.state.draft.currentPlayer = 2;
                this.state.draft.currentRound = 0;
                this.renderDraftRound();
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
                    <div class="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white/20 bg-gray-900 overflow-hidden shadow-lg">
                        <img src="${this.CDN_URL}${p.id}.png" class="w-full h-full object-cover" onerror="this.src='${this.FALLBACK_SVG}'">
                    </div>
                    <span class="text-xs font-bold truncate max-w-[80px] mt-1 text-gray-300">${p.n.split(' ').pop()}</span>
                    <span class="text-[10px] text-[var(--nba-gold)] font-bebas">${p.rat} OVR</span>
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

        window.simulation.startMatch(
            this.state.teams,
            this.state.draft.scoutPenalties,
            {
                onTick: (data) => this.onSimTick(data),
                onQuarterEnd: (data) => this.onSimQuarterEnd(data),
                onFinish: (data) => this.onSimFinish(data)
            }
        );
    },

    onSimTick(data) {
        // Update Clock
        const minutes = Math.floor(data.timeRemaining / 60);
        const seconds = Math.floor(data.timeRemaining % 60);
        document.getElementById('s-clock').innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Update Scores
        const s1El = document.getElementById('s-t1-score');
        const s2El = document.getElementById('s-t2-score');

        const prevS1 = parseInt(s1El.innerText || '0', 10);
        const prevS2 = parseInt(s2El.innerText || '0', 10);

        s1El.innerText = data.scores.p1;
        s2El.innerText = data.scores.p2;

        if (data.scores.p1 > prevS1) {
            s1El.classList.remove('score-flash-red');
            void s1El.offsetWidth; // trigger reflow
            s1El.classList.add('score-flash-red');
        }
        if (data.scores.p2 > prevS2) {
            s2El.classList.remove('score-flash-blue');
            void s2El.offsetWidth;
            s2El.classList.add('score-flash-blue');
        }

        // Quarter label
        const qNames = ["1ER CUARTO", "2DO CUARTO", "3ER CUARTO", "4TO CUARTO", "OVERTIME"];
        document.getElementById('s-quarter').innerText = data.isOT ? "TIEMPO EXTRA (OT)" : qNames[data.quarter - 1];

        // Render live stats table
        this.renderSimStatsTable();

        // Render logs
        this.renderSimLogs(data.logs);
    },

    renderSimStatsTable() {
        const tbody = document.getElementById('stats-table-body');
        tbody.innerHTML = '';

        [this.state.teams.p1, this.state.teams.p2].forEach((team, tIdx) => {
            team.roster.forEach(p => {
                const tr = document.createElement('tr');
                tr.id = `stat-row-${p.id}`;
                tr.className = "border-b border-gray-800 transition";
                tr.innerHTML = `
                    <td class="p-2 font-bold ${tIdx === 0 ? 'text-red-400' : 'text-blue-400'} flex items-center gap-2">
                        <img src="${this.CDN_URL}${p.id}.png" class="w-6 h-6 rounded-full bg-gray-800 object-cover" onerror="this.src='${this.FALLBACK_SVG}'">
                        <span class="truncate max-w-[120px]">${p.n}</span>
                    </td>
                    <td class="p-2 font-bold">${p.stats.pts}</td>
                    <td class="p-2 text-gray-300">${p.stats.reb}</td>
                    <td class="p-2 text-gray-300">${p.stats.ast}</td>
                    <td class="p-2 text-gray-300">${p.stats.stl}</td>
                    <td class="p-2 text-gray-300">${p.stats.blk}</td>
                `;
                tbody.appendChild(tr);
            });
        });
    },

    renderSimLogs(logs) {
        const logContainer = document.getElementById('sim-log');
        logContainer.innerHTML = '';

        // Show up to 10 lines
        logs.slice(0, 10).forEach(entry => {
            const div = document.createElement('div');
            div.className = `log-entry ${entry.team === 'p1' ? 'team-p1' : 'team-p2'}`;
            div.innerText = entry.msg;
            logContainer.appendChild(div);

            // Highlight player row in stats table if available
            if (entry.pid) {
                const row = document.getElementById(`stat-row-${entry.pid}`);
                if (row) {
                    row.classList.remove('stat-row-highlight');
                    void row.offsetWidth;
                    row.classList.add('stat-row-highlight');
                }
            }
        });
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

        const winnerKey = data.winner;
        this.state.teams[winnerKey].seriesWins++;
        this.state.finals.gamesPlayed++;

        // Render Final Score
        const scoreBox = document.getElementById('final-score-box');
        scoreBox.innerHTML = `
            <div class="text-center">
                <p class="font-bebas text-3xl text-gray-300">${this.state.teams.p1.name}</p>
                <p class="text-7xl md:text-8xl font-black ${winnerKey === 'p1' ? 'text-[var(--nba-red)] font-bebas' : 'text-gray-400 font-bebas'}">${this.state.teams.p1.currentScore}</p>
            </div>
            <div class="text-5xl font-bebas text-[var(--nba-gold)] italic px-4">VS</div>
            <div class="text-center">
                <p class="font-bebas text-3xl text-gray-300">${this.state.teams.p2.name}</p>
                <p class="text-7xl md:text-8xl font-black ${winnerKey === 'p2' ? 'text-[var(--nba-blue)] font-bebas' : 'text-gray-400 font-bebas'}">${this.state.teams.p2.currentScore}</p>
            </div>
        `;

        // Render MVP Card
        const mvp = data.mvp;
        document.getElementById('mvp-name').innerText = mvp.n;
        document.getElementById('mvp-team').innerText = mvp.t;
        document.getElementById('mvp-stats-line').innerText = `${mvp.stats.pts} PTS | ${mvp.stats.reb} REB | ${mvp.stats.ast} AST | ${mvp.stats.stl} STL | ${mvp.stats.blk} BLK`;
        document.getElementById('mvp-img-box').innerHTML = `
            <img src="${this.CDN_URL}${mvp.id}.png" class="w-full h-full object-contain filter drop-shadow" onerror="this.src='${this.FALLBACK_SVG}'">
        `;

        const isP1Mvp = this.state.teams.p1.roster.some(p => p.id === mvp.id);
        const mvpCard = document.getElementById('mvp-card');
        mvpCard.style.borderColor = isP1Mvp ? 'var(--nba-red)' : 'var(--nba-blue)';

        // Render Box Scores
        this.renderBoxScoreTable('res-table-t1', this.state.teams.p1.roster, mvp.id);
        this.renderBoxScoreTable('res-table-t2', this.state.teams.p2.roster, mvp.id);
        document.getElementById('res-t1-name').innerText = this.state.teams.p1.name;
        document.getElementById('res-t2-name').innerText = this.state.teams.p2.name;

        // Finales Controls (Best of 7)
        const controls = document.getElementById('finales-controls');
        controls.innerHTML = '';

        if (this.state.mode === 'finales') {
            const limit = 4;
            const p1Wins = this.state.teams.p1.seriesWins;
            const p2Wins = this.state.teams.p2.seriesWins;

            if (p1Wins >= limit || p2Wins >= limit) {
                const champName = p1Wins >= limit ? this.state.teams.p1.name : this.state.teams.p2.name;
                controls.innerHTML = `
                    <div class="text-center space-y-4">
                        <div class="text-4xl md:text-6xl font-bebas text-[var(--nba-gold)] animate-pulse">
                            🏆 ¡${champName} ES EL CAMPEÓN DE LAS FINALES! 🏆
                        </div>
                        <p class="text-xl text-gray-300 font-bebas">Serie Final: ${p1Wins} - ${p2Wins}</p>
                        <div class="flex gap-4 justify-center">
                            <button onclick="location.reload()" class="btn-nba btn-nba-gold px-12 py-4 text-3xl rounded-xl">Menú Principal</button>
                        </div>
                    </div>
                `;
            } else {
                controls.innerHTML = `
                    <div class="text-center space-y-4">
                        <div class="text-2xl font-bebas text-gray-300">
                            Serie al mejor de 7: <span class="text-[var(--nba-red)] font-bold">${this.state.teams.p1.name} (${p1Wins})</span> - <span class="text-[var(--nba-blue)] font-bold">(${p2Wins}) ${this.state.teams.p2.name}</span>
                        </div>
                        <div class="flex gap-4 justify-center">
                            <button onclick="App.startSimulation()" class="btn-nba btn-nba-gold px-12 py-4 text-3xl rounded-xl">Siguiente Partido (Juego ${this.state.finals.gamesPlayed + 1})</button>
                            <button onclick="location.reload()" class="btn-nba px-8 py-4 text-2xl rounded-xl">Salir al Menú</button>
                        </div>
                    </div>
                `;
            }
        } else {
            controls.innerHTML = `
                <button onclick="location.reload()" class="btn-nba btn-nba-gold px-14 py-4 text-3xl rounded-xl">Menú Principal</button>
            `;
        }
    },

    renderBoxScoreTable(tableId, roster, mvpId) {
        const table = document.getElementById(tableId);
        table.innerHTML = `
            <thead>
                <tr class="text-gray-400 font-bebas text-sm border-b border-gray-700">
                    <th class="p-2">JUGADOR</th>
                    <th class="p-2">PTS</th>
                    <th class="p-2">REB</th>
                    <th class="p-2">AST</th>
                    <th class="p-2">ROB</th>
                    <th class="p-2">TAP</th>
                    <th class="p-2">TC</th>
                    <th class="p-2">FG%</th>
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
                : 'border-b border-gray-800 hover:bg-white/5';

            tr.innerHTML = `
                <td class="p-2 font-bold flex items-center gap-2">
                    <img src="${this.CDN_URL}${p.id}.png" class="w-6 h-6 rounded-full bg-gray-800 object-cover" onerror="this.src='${this.FALLBACK_SVG}'">
                    <span>${p.n}</span> ${isMvp ? '⭐ <span class="text-xs text-[var(--nba-gold)]">MVP</span>' : ''}
                </td>
                <td class="p-2 font-bold text-white">${p.stats.pts}</td>
                <td class="p-2">${p.stats.reb}</td>
                <td class="p-2">${p.stats.ast}</td>
                <td class="p-2">${p.stats.stl}</td>
                <td class="p-2">${p.stats.blk}</td>
                <td class="p-2">${p.stats.fgm}/${p.stats.fga}</td>
                <td class="p-2">${fgPct}%</td>
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
                tab.className = "db-pos-tab px-4 py-2 rounded-lg font-bebas text-lg btn-nba btn-nba-gold";
            } else {
                tab.className = "db-pos-tab px-4 py-2 rounded-lg font-bebas text-lg bg-gray-800 hover:bg-gray-700 text-gray-300";
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

        // Apply Position Filter
        if (this.state.dbFilter.pos !== 'all') {
            allPlayers = allPlayers.filter(p => p.posKey === this.state.dbFilter.pos);
        }

        // Apply Search Filter
        if (this.state.dbFilter.search) {
            const q = this.state.dbFilter.search;
            allPlayers = allPlayers.filter(p => 
                p.n.toLowerCase().includes(q) || p.t.toLowerCase().includes(q)
            );
        }

        // Apply Sort
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

        // Counter
        const countEl = document.getElementById('db-player-count');
        if (countEl) countEl.innerText = `${allPlayers.length} Jugadores`;

        // Render first 200 matches (for ultra snappy DOM performance)
        allPlayers.slice(0, 200).forEach(p => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-800 hover:bg-white/5 transition";
            tr.innerHTML = `
                <td class="p-2 font-bebas text-lg text-gray-400">${p.posLabel}</td>
                <td class="p-2 flex items-center gap-3">
                    <img src="${this.CDN_URL}${p.id}.png" 
                         class="w-10 h-10 rounded-full bg-gray-800 object-cover border border-white/10" 
                         alt="${p.n}" 
                         loading="lazy"
                         onerror="this.src='${this.FALLBACK_SVG}'">
                    <div>
                        <p class="font-bold text-white text-base leading-tight">${p.n}</p>
                        <p class="text-xs text-gray-400">${p.t}</p>
                    </div>
                </td>
                <td class="p-2 font-bebas text-2xl font-black text-[var(--nba-gold)]">${p.rat}</td>
                <td class="p-2">${p.t2}</td>
                <td class="p-2">${p.t3}</td>
                <td class="p-2">${p.reb}</td>
                <td class="p-2">${p.ast}</td>
                <td class="p-2">${p.stl}</td>
                <td class="p-2">${p.blk}</td>
            `;
            tbody.appendChild(tr);
        });
    },

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

        if (window.audio.isMuted) {
            btn.innerHTML = '🔇';
            btn.title = "Activar Sonido";
        } else {
            btn.innerHTML = '🔊';
            btn.title = "Silenciar Sonido";
        }
    }
};

window.App = App;
window.addEventListener('DOMContentLoaded', () => App.init());
