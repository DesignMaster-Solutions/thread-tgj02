# Thread

A small game for [thatgamejam #02](https://itch.io/jam/thatgamejam02) by Design Master Solutions.

You are a needle carrying one warm thread through a cold winter town. Touch a window to stitch it:
the window lights up, the thread anchors there and grows a little longer. Some shutters only open
when the song breathes in (every other bar at 80 BPM). When every window in the town is stitched,
the houses lift into the sky together.

The track's arc (quiet opening, a long swell, letting go at the end) is the game's arc: a cold,
lonely start, warmth that grows with every person you reach, and a release.

- Play: open `web/index.html` (mouse or arrow keys). `web/index.html?autoplay` plays itself (attract mode). `?autoplay&record` also records the canvas and the music into one webm and POSTs it to `/upload` (how the walkthrough video with sound was made).
- Walkthrough video (with the music): https://youtu.be/P2Wte2zimlI (file: `docs/walkthrough.mp4`)
- itch.io: https://designmastersolutions.itch.io/thread
- Mac build: `./mac/build.sh` makes `dist/Thread-mac.zip` (universal .app, native WKWebView shell around `web/`).
  Self-check: `THREAD_SNAPSHOT=/tmp/t.png dist/Thread.app/Contents/MacOS/Thread` renders the game to a PNG and quits.
- Check: `node tests/reach.mjs` proves every level is solvable on 5 screen sizes.
- Music: original, generated live with the Web Audio API in F minor at 80 BPM. The theme track is not included.

AI disclosure: the code was written with the help of an AI coding assistant (Claude). No AI-generated images or audio.
