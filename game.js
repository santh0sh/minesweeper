/* UI layer: DOM, input (click, right-click, long-press, flag mode), timer, best times. */
(function () {
    'use strict';

    const boardEl = document.getElementById('board');
    const mineCounterEl = document.getElementById('mine-counter');
    const timerEl = document.getElementById('timer');
    const resetEl = document.getElementById('reset');
    const bestEl = document.getElementById('best');
    const flagModeEl = document.getElementById('flag-mode');
    const appEl = document.querySelector('.app');

    const FACES = { ready: '🙂', playing: '🙂', won: '😎', lost: '😵' };
    const BEST_KEY = 'minesweeper-best';

    let game = null;
    let level = 'beginner';
    let seconds = 0;
    let timerId = null;
    let flagMode = false;
    let pressTimer = null;
    let longPressed = false;

    function bestTimes() {
        try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {}; }
        catch { return {}; }
    }

    function saveBest(time) {
        const all = bestTimes();
        if (!all[level] || time < all[level]) {
            all[level] = time;
            localStorage.setItem(BEST_KEY, JSON.stringify(all));
        }
    }

    function showBest() {
        const best = bestTimes()[level];
        bestEl.textContent = best ? `Best: ${best}s` : '';
    }

    function pad(n) { return String(Math.max(0, Math.min(999, n))).padStart(3, '0'); }

    function startTimer() {
        stopTimer();
        seconds = 0;
        timerEl.textContent = pad(0);
        timerId = setInterval(() => {
            seconds++;
            timerEl.textContent = pad(seconds);
        }, 1000);
    }

    function stopTimer() {
        if (timerId) clearInterval(timerId);
        timerId = null;
    }

    function newGame(nextLevel) {
        level = nextLevel || level;
        game = Minesweeper.createGame(level);
        stopTimer();
        seconds = 0;
        timerEl.textContent = pad(0);
        resetEl.textContent = FACES.ready;
        appEl.classList.remove('won');
        render();
        showBest();
        document.querySelectorAll('.level').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === level);
        });
    }

    function render() {
        boardEl.innerHTML = '';
        boardEl.style.gridTemplateColumns = `repeat(${game.cols}, auto)`;
        mineCounterEl.textContent = pad(game.totalMines - game.flagCount);
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                const cell = game.board[r][c];
                const el = document.createElement('button');
                el.className = 'cell';
                el.dataset.r = r;
                el.dataset.c = c;
                el.setAttribute('aria-label', `cell ${r + 1},${c + 1}`);
                paintCell(el, cell);
                boardEl.appendChild(el);
            }
        }
    }

    function paintCell(el, cell) {
        el.classList.toggle('open', cell.revealed);
        el.classList.toggle('flag', cell.flagged && !cell.revealed);
        el.classList.remove('mine-hit', 'mine-shown', 'wrong-flag',
            'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8');
        el.textContent = '';
        if (cell.flagged && !cell.revealed) {
            el.textContent = '🚩';
        } else if (cell.revealed && cell.mine) {
            el.textContent = '💣';
            el.classList.add(cell.exploded ? 'mine-hit' : 'mine-shown');
        } else if (cell.revealed && cell.count > 0) {
            el.textContent = cell.count;
            el.classList.add(`n${cell.count}`);
        }
    }

    function repaintAll() {
        mineCounterEl.textContent = pad(game.totalMines - game.flagCount);
        boardEl.querySelectorAll('.cell').forEach(el => {
            paintCell(el, game.board[el.dataset.r][el.dataset.c]);
        });
    }

    function endCheck() {
        if (game.status === 'won' || game.status === 'lost') {
            stopTimer();
            resetEl.textContent = FACES[game.status];
            if (game.status === 'won') {
                saveBest(seconds);
                showBest();
                banner('You win! 🎉', 'win');
            } else {
                banner('Boom. Try again.', 'lose');
                markWrongFlags();
            }
        }
    }

    function banner(text, kind) {
        const el = document.createElement('div');
        el.className = `banner ${kind}`;
        el.textContent = text;
        boardEl.appendChild(el);
    }

    function markWrongFlags() {
        boardEl.querySelectorAll('.cell').forEach(el => {
            const cell = game.board[el.dataset.r][el.dataset.c];
            if (cell.flagged && !cell.mine) {
                el.classList.add('open', 'wrong-flag');
                el.textContent = '🚩';
            }
        });
    }

    function maybeStartClock() {
        if (game.status === 'playing' && !timerId) startTimer();
    }

    function handleReveal(r, c) {
        const before = game.status;
        Minesweeper.reveal(game, r, c);
        if (before === 'ready') maybeStartClock();
        repaintAll();
        endCheck();
    }

    function handleFlag(r, c) {
        if (Minesweeper.toggleFlag(game, r, c) !== undefined) repaintAll();
    }

    function handleChord(r, c) {
        const opened = Minesweeper.chord(game, r, c);
        if (opened.length) {
            repaintAll();
            endCheck();
        }
    }

    boardEl.addEventListener('click', (event) => {
        if (longPressed) { longPressed = false; return; }
        const el = event.target.closest('.cell');
        if (!el) return;
        const r = +el.dataset.r, c = +el.dataset.c;
        const cell = game.board[r][c];
        if (flagMode && !cell.revealed) { handleFlag(r, c); return; }
        if (cell.revealed) handleChord(r, c);
        else handleReveal(r, c);
    });

    boardEl.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const el = event.target.closest('.cell');
        if (!el) return;
        handleFlag(+el.dataset.r, +el.dataset.c);
    });

    /* Long-press to flag on touch screens. */
    boardEl.addEventListener('touchstart', (event) => {
        const el = event.target.closest('.cell');
        if (!el) return;
        longPressed = false;
        pressTimer = setTimeout(() => {
            longPressed = true;
            handleFlag(+el.dataset.r, +el.dataset.c);
        }, 450);
    }, { passive: true });
    boardEl.addEventListener('touchend', () => clearTimeout(pressTimer));
    boardEl.addEventListener('touchmove', () => clearTimeout(pressTimer));

    resetEl.addEventListener('click', () => newGame());
    document.querySelectorAll('.level').forEach(btn => {
        btn.addEventListener('click', () => newGame(btn.dataset.level));
    });
    flagModeEl.addEventListener('click', () => {
        flagMode = !flagMode;
        flagModeEl.classList.toggle('on', flagMode);
        flagModeEl.setAttribute('aria-pressed', String(flagMode));
    });

    newGame('beginner');
})();
