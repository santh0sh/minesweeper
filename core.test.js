/* Run: node tests/core.test.js  (no dependencies) */
const assert = require('assert');
const M = require('./minesweeper-core.js');

let passed = 0;
function test(name, fn) {
    fn();
    passed++;
    console.log(`ok - ${name}`);
}

function freshGame(level = 'beginner') {
    return M.createGame(level);
}

test('levels are the classic three', () => {
    assert.deepStrictEqual(M.LEVELS.beginner, { rows: 9, cols: 9, mines: 10 });
    assert.deepStrictEqual(M.LEVELS.expert, { rows: 16, cols: 30, mines: 99 });
});

test('first click is always safe, and so are its neighbors', () => {
    for (let i = 0; i < 50; i++) {
        const g = freshGame();
        M.reveal(g, 4, 4);
        const safeZone = [[4, 4], ...M.neighbors(g, 4, 4)];
        for (const [r, c] of safeZone) assert.strictEqual(g.board[r][c].mine, false, `mine in safe zone on run ${i}`);
    }
});

test('exactly the level mine count is placed', () => {
    const g = freshGame('intermediate');
    M.reveal(g, 0, 0);
    assert.strictEqual(g.board.flat().filter(c => c.mine).length, 40);
});

test('neighbor counts match the mines', () => {
    const g = freshGame();
    M.reveal(g, 0, 0);
    for (let r = 0; r < g.rows; r++) {
        for (let c = 0; c < g.cols; c++) {
            const expected = M.neighbors(g, r, c).filter(([nr, nc]) => g.board[nr][nc].mine).length;
            assert.strictEqual(g.board[r][c].count, expected);
        }
    }
});

test('revealing a mine loses and exposes the board', () => {
    const g = freshGame();
    M.reveal(g, 4, 4); // safe start
    let mineAt = null;
    for (let r = 0; r < g.rows && !mineAt; r++) {
        for (let c = 0; c < g.cols && !mineAt; c++) {
            if (g.board[r][c].mine) mineAt = [r, c];
        }
    }
    M.reveal(g, ...mineAt);
    assert.strictEqual(g.status, 'lost');
    assert.strictEqual(g.board[mineAt[0]][mineAt[1]].exploded, true);
    assert.ok(g.board.flat().filter(c => c.mine).every(c => c.revealed));
});

test('flags toggle and count', () => {
    const g = freshGame();
    M.reveal(g, 0, 0);
    assert.strictEqual(M.toggleFlag(g, 8, 8), true);
    assert.strictEqual(g.flagCount, 1);
    assert.strictEqual(M.toggleFlag(g, 8, 8), false);
    assert.strictEqual(g.flagCount, 0);
});

test('flagged cells do not reveal', () => {
    const g = freshGame();
    M.reveal(g, 0, 0);
    M.toggleFlag(g, 8, 8);
    assert.deepStrictEqual(M.reveal(g, 8, 8), []);
    assert.strictEqual(g.board[8][8].revealed, false);
});

test('revealing every safe cell wins', () => {
    const g = freshGame();
    M.reveal(g, 4, 4);
    for (let r = 0; r < g.rows; r++) {
        for (let c = 0; c < g.cols; c++) {
            if (!g.board[r][c].mine) M.reveal(g, r, c);
        }
    }
    assert.strictEqual(g.status, 'won');
});

test('chord opens neighbors only when flags match the number', () => {
    const g = freshGame();
    M.reveal(g, 4, 4);
    // find a revealed number with unrevealed, unflagged neighbors
    outer:
    for (let r = 0; r < g.rows; r++) {
        for (let c = 0; c < g.cols; c++) {
            const cell = g.board[r][c];
            if (cell.revealed && cell.count > 0) {
                const around = M.neighbors(g, r, c).filter(([nr, nc]) => !g.board[nr][nc].revealed);
                if (around.length === 0) continue;
                // wrong flag count: nothing opens
                assert.deepStrictEqual(M.chord(g, r, c), []);
                // flag exactly count cells around it (only safe if those are mines; use real mines)
                const mines = around.filter(([nr, nc]) => g.board[nr][nc].mine);
                if (mines.length !== cell.count) continue;
                for (const [nr, nc] of mines) M.toggleFlag(g, nr, nc);
                const opened = M.chord(g, r, c);
                assert.ok(opened.length > 0, 'chord should open the rest');
                break outer;
            }
        }
    }
});

console.log(`\n${passed} tests passed`);
