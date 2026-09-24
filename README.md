# Minesweeper

The classic, done properly. Pure HTML/CSS/vanilla JavaScript - no frameworks, no build step, no dependencies. Open `index.html` and play.

## Features

- Three classic levels: Beginner 9x9 (10 mines), Intermediate 16x16 (40), Expert 16x30 (99)
- First click is always safe (and so is everything around it)
- Flood-fill reveal, right-click flags, chord clicks on numbers
- Touch support: long-press to flag, plus a flag-mode toggle
- Timer, mine counter, best time per level (saved on your device)
- Win/lose states with wrong-flag marking, dark UI, mobile responsive

## Play

Open `index.html` in any browser. That's it.

- Left click / tap: reveal
- Right click / long-press / flag mode: flag
- Click a revealed number whose flags match: open the rest (chord)
- The face button starts a new game

## Logic tests

The game logic (`minesweeper-core.js`) is pure JavaScript with no DOM, so it runs in Node:

```bash
node core.test.js
```

9 tests: safe first click, exact mine counts, neighbor math, flood fill, flags, chords, win and loss detection.

## Publish it live with GitHub Pages (free)

1. With this repo on GitHub: Settings > Pages > Source: `main` branch, root > Save
2. Playable at `https://santh0sh.github.io/minesweeper` in about a minute

## Upload steps from a phone (5 minutes)

1. Create a public repo named exactly `minesweeper` on github.com (do not tick "Add a README")
2. Unzip this package anywhere (Files app works)
3. On the repo page: Add file > Upload files > select ALL the files > Commit
4. Flat layout on purpose: every file at root, no folders, so mobile upload just works

## Structure

```
index.html           the page
style.css            dark theme, responsive
minesweeper-core.js  pure game logic (browser + Node)
game.js              DOM, input, timer, best times
core.test.js         logic tests, no dependencies
```

All files sit flat at the repo root - easy to upload from any device, including a phone.

Part of a public build series on applied software engineering.
