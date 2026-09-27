/**
 * Ultimate Draft - Motor de Simulación
 * Cumple con la especificación del PRD:
 * - 30 real seconds per quarter.
 * - 12:00 -> 0:00 NBA time descending fluidly.
 * - 3 real seconds pause between quarters with intermediate score modal.
 * - Overtime support (5 mins NBA time) for ties.
 * - Probabilistic rating-based play-by-play with Scout penalty.
 * - MVP calculation and Box Score tracking.
 * - Pause and Abort controls.
 */

class SimulationEngine {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.interval = null;
        this.quarter = 1;
        this.timeRemaining = 720; // NBA seconds
        this.realDurationSeconds = 30; // 30s real time per quarter
        this.ticksPerSecond = 10;
        this.isOT = false;
        this.logs = [];
        this.mvp = null;
        this.onTick = null;
        this.onPlay = null;
        this.onFinish = null;
    }

    startMatch(teams, scoutPenalties, callbacks) {
        this.teams = teams;
        this.scoutPenalties = scoutPenalties || { p1: false, p2: false };
        this.onTick = callbacks?.onTick || (() => {});
        this.onPlay = callbacks?.onPlay || (() => {});
        this.onFinish = callbacks?.onFinish || (() => {});
        this.onQuarterEnd = callbacks?.onQuarterEnd || (() => {});
        
        this.quarter = 1;
        this.timeRemaining = 720;
        this.isOT = false;
        this.isRunning = true;
        this.isPaused = false;
        this.logs = [];
        this.mvp = null;

        // Reset scores and stats
        this.teams.p1.currentScore = 0;
        this.teams.p2.currentScore = 0;

        [this.teams.p1, this.teams.p2].forEach(team => {
            team.roster.forEach(player => {
                player.stats = {
                    pts: 0,
                    reb: 0,
                    ast: 0,
                    stl: 0,
                    blk: 0,
                    fga: 0,
                    fgm: 0,
                    t3a: 0,
                    t3m: 0
                };
            });
        });

        if (window.audio) window.audio.playWhistle();
        this.runLoop();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    runLoop() {
        const totalTicks = this.realDurationSeconds * this.ticksPerSecond;
        const periodTotalSeconds = this.isOT ? 300 : 720;
        const nbaSecondsPerTick = periodTotalSeconds / totalTicks;

        clearInterval(this.interval);
        this.interval = setInterval(() => {
            if (!this.isRunning || this.isPaused) return;

            this.timeRemaining -= nbaSecondsPerTick;

            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.handleQuarterEnd();
                return;
            }

            this.processGameTick();
            this.onTick({
                quarter: this.quarter,
                timeRemaining: Math.max(0, Math.floor(this.timeRemaining)),
                isOT: this.isOT,
                scores: { p1: this.teams.p1.currentScore, p2: this.teams.p2.currentScore }
            });

        }, 1000 / this.ticksPerSecond);
    }

    processGameTick() {
        // Frequency of game action (~18% chance per tick)
        if (Math.random() > 0.18) return;

        const isP1Attack = Math.random() > 0.5;
        const attackKey = isP1Attack ? 'p1' : 'p2';
        const defendKey = isP1Attack ? 'p2' : 'p1';

        const attackingTeam = this.teams[attackKey];
        const defendingTeam = this.teams[defendKey];

        const shooter = attackingTeam.roster[Math.floor(Math.random() * attackingTeam.roster.length)];
        const defender = defendingTeam.roster[Math.floor(Math.random() * defendingTeam.roster.length)];

        // Scout penalty check (-5% on ratings if scout was activated)
        const scoutPenalty = this.scoutPenalties[attackKey] ? 0.95 : 1.0;

        // 1. Defense check: Steal
        const stealChance = (defender.stl / 100) * 0.16;
        if (Math.random() < stealChance) {
            defender.stats.stl++;
            this.addPlayLog(`Robo de ${defender.n} (${defendingTeam.name})`, defendKey, defender.id, false, 'steal');
            if (window.audio) window.audio.playDefensivePlay();
            return;
        }

        // 2. Defense check: Block
        const blockChance = (defender.blk / 100) * 0.15;
        if (Math.random() < blockChance) {
            shooter.stats.fga++;
            defender.stats.blk++;
            this.addPlayLog(`Taponazo de ${defender.n} (${defendingTeam.name}) sobre ${shooter.n}`, defendKey, defender.id, false, 'block');
            if (window.audio) window.audio.playDefensivePlay();
            return;
        }

        // 3. Shot attempt (2-pointer or 3-pointer)
        const isThree = Math.random() < 0.35;
        const shotRating = (isThree ? shooter.t3 : shooter.t2) * scoutPenalty;
        const successRate = isThree ? (shotRating * 0.44) / 100 : (shotRating * 0.58) / 100;

        shooter.stats.fga++;
        if (isThree) shooter.stats.t3a++;

        if (Math.random() < successRate) {
            const pts = isThree ? 3 : 2;
            shooter.stats.pts += pts;
            shooter.stats.fgm++;
            if (isThree) shooter.stats.t3m++;
            attackingTeam.currentScore += pts;

            if (window.audio) window.audio.playSwish();

            // Assist check
            const potentialPassers = attackingTeam.roster.filter(p => p.id !== shooter.id);
            if (potentialPassers.length > 0 && Math.random() < 0.65) {
                const passer = potentialPassers.sort((a, b) => (b.ast * Math.random()) - (a.ast * Math.random()))[0];
                passer.stats.ast++;
                this.addPlayLog(`${shooter.n} anota ${pts}pt (Asist: ${passer.n})`, attackKey, shooter.id, true, 'basketball');
            } else {
                this.addPlayLog(`${shooter.n} anota ${pts}pt en jugada individual`, attackKey, shooter.id, true, 'basketball');
            }
        } else {
            // Rebound battle
            const allPlayers = [...attackingTeam.roster, ...defendingTeam.roster];
            const rebounder = allPlayers.sort((a, b) => (b.reb * (0.5 + Math.random())) - (a.reb * (0.5 + Math.random())))[0];
            const rebTeamKey = attackingTeam.roster.some(p => p.id === rebounder.id) ? attackKey : defendKey;
            
            rebounder.stats.reb++;
            this.addPlayLog(`Rebote de ${rebounder.n} (${this.teams[rebTeamKey].name})`, rebTeamKey, rebounder.id, false, 'rebound');
        }
    }

    addPlayLog(message, teamKey, playerId, isScore, icon = 'basketball') {
        const playItem = {
            id: Date.now() + Math.random(),
            msg: message,
            team: teamKey,
            time: Math.floor(this.timeRemaining),
            pid: playerId,
            isScore: isScore,
            icon: icon
        };
        this.logs.unshift(playItem);
        if (this.logs.length > 25) {
            this.logs.pop();
        }
        if (this.onPlay) {
            this.onPlay(playItem);
        }
    }

    handleQuarterEnd() {
        clearInterval(this.interval);
        this.isRunning = false;
        if (window.audio) window.audio.playBuzzer();

        if (this.quarter < 4) {
            this.onQuarterEnd({
                title: `FIN DEL CUARTO ${this.quarter}`,
                subtitle: `Siguiente: Cuarto ${this.quarter + 1}`,
                scores: { p1: this.teams.p1.currentScore, p2: this.teams.p2.currentScore }
            });

            setTimeout(() => {
                if (!this.isRunning && !this.isPaused) {
                    this.quarter++;
                    this.timeRemaining = 720;
                    this.isRunning = true;
                    if (window.audio) window.audio.playWhistle();
                    this.runLoop();
                }
            }, 3000);

        } else {
            if (this.teams.p1.currentScore === this.teams.p2.currentScore) {
                this.isOT = true;
                this.onQuarterEnd({
                    title: `¡EMPATE! TIEMPO REGLAMENTARIO`,
                    subtitle: `Iniciando Tiempo Extra (5:00 min NBA)`,
                    scores: { p1: this.teams.p1.currentScore, p2: this.teams.p2.currentScore }
                });

                setTimeout(() => {
                    if (!this.isRunning && !this.isPaused) {
                        this.timeRemaining = 300;
                        this.isRunning = true;
                        if (window.audio) window.audio.playWhistle();
                        this.runLoop();
                    }
                }, 3000);

            } else {
                this.finishMatch();
            }
        }
    }

    finishMatch() {
        clearInterval(this.interval);
        this.isRunning = false;

        const winnerKey = this.teams.p1.currentScore > this.teams.p2.currentScore ? 'p1' : 'p2';
        
        const allRoster = [...this.teams.p1.roster, ...this.teams.p2.roster];
        allRoster.sort((a, b) => {
            const scoreA = (a.stats.pts) + (a.stats.reb * 1.2) + (a.stats.ast * 1.5) + (a.stats.stl * 2) + (a.stats.blk * 2) + (a.stats.fgm) - (a.stats.fga * 0.5);
            const scoreB = (b.stats.pts) + (b.stats.reb * 1.2) + (b.stats.ast * 1.5) + (b.stats.stl * 2) + (b.stats.blk * 2) + (b.stats.fgm) - (b.stats.fga * 0.5);
            return scoreB - scoreA;
        });

        this.mvp = allRoster[0];

        if (window.audio) {
            window.audio.playCheer();
            setTimeout(() => window.audio.playFanfare(), 300);
            window.audio.playVictory();
        }

        this.onFinish({
            winner: winnerKey,
            mvp: this.mvp,
            scores: { p1: this.teams.p1.currentScore, p2: this.teams.p2.currentScore }
        });
    }

    stop() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.isPaused = false;
    }
}

window.simulation = new SimulationEngine();
