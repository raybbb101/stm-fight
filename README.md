# Stickmen PvP Arena

A 2D online 1v1 stickman fighting game for mobile that you can install from Chrome as an app (PWA).

- **Online rooms:** one player taps **Create Room** and gets a 5-digit room number. The other player taps **Join Room** and types the number in. The **Share** button sends an invite link that fills in the room number for you.
- **3 lives** per player. You lose a life when your HP reaches 0 or you get knocked off the stage. The lower your HP, the further hits send you flying.
- **50 weapons** (melee, ranged, magic). Every weapon has a normal attack plus its own **skill**: dashes, spins, ground slams, lightning, freezing, teleport backstab, shields that reflect shots, life drain, boomerangs, meteor/arrow rain, grappling hooks, poison clouds, black holes, beams, mines, quakes, tornados, rage mode, rapid fire.
- **12 stages:** Rooftops, Volcano (lava), Sky Islands, Ice Cavern (slippery), Moon Base (low gravity), Factory (moving platforms), Storm Peak (wind), Dojo (walls), Neon Grid (jump pads), Desert Ruins, Jungle Canopy, Space Station.
- Weapons fall from the sky during the match. Tap **GRAB** to pick one up.
- **Practice vs CPU** has Easy, Normal and Hard bots and also works offline.

## Controls
| Touch | Keyboard | Action |
|---|---|---|
| Left joystick | A / D | Move |
| Flick stick up / JUMP | W / Space | Jump (double jump) |
| Hold stick down | S (+ jump) | Drop through platform |
| ATK (hold) | J | Normal attack |
| SKILL | K | Weapon skill |
| GRAB | L | Pick up weapon |

## Install as an app on your phone
1. Host the folder on any HTTPS static host. GitHub Pages is set up already: in the repo go to **Settings → Pages → Source: GitHub Actions**, then merge to `main`. The workflow in `.github/workflows/pages.yml` deploys it.
2. Open the site in **Chrome** on Android and tap **⬇ Install App** in the menu, or use Chrome's menu ⋮ → **Install app** / **Add to Home screen**.
3. The app starts fullscreen in landscape, like a native game.

## How it works
- Plain HTML5 Canvas plus ES modules. There's no build step.
- Online play is **peer-to-peer WebRTC** through [PeerJS](https://peerjs.com/) (bundled in `vendor/`). The room host runs the game simulation at 60 FPS and streams snapshots to the guest at 30 Hz. The guest sends its inputs. You don't need a game server.
- Signaling (room lookup) uses the free public PeerJS cloud server. To self-host one, run `npx peerjs --port 9000` and open the game with `?peer=yourhost:9000`.
- Some strict mobile carrier networks block direct peer-to-peer connections. If joining fails on mobile data, try Wi-Fi.

## Files
- `js/game.js`: game simulation (physics, attacks, skills, lives)
- `js/weapons.js`: the 50 weapons and their skills
- `js/stages.js`: the 12 stages
- `js/render.js`: drawing for stickmen, weapons, effects and HUD
- `js/net.js`: rooms and networking
- `js/bot.js`: CPU opponent
- `js/input.js`: touch joystick, buttons and keyboard
- `js/main.js`: menus, lobby and game loop
- `sw.js`, `manifest.webmanifest`, `icons/`: PWA install and offline support

Run locally: `python3 -m http.server 8000` and open http://localhost:8000
