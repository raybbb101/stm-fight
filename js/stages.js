// Stage definitions. World is 1600 x 900. Platform y = top surface.
// type: 'solid' (cannot drop through) | 'oneway' | 'pad' (jump pad)
// move: { ax, ay, period } -> oscillates around its base position

export const W = 1600, H = 900;

const P = (x, y, w, type = 'oneway', move = null, h = 22) => ({ x, y, w, h, type, move });

export const STAGES = [
  {
    name: 'Rooftops', theme: 'city',
    sky: ['#0b1026', '#2b2d6e'], plat: '#3d405b', platTop: '#81b29a',
    spawns: [[420, 600], [1180, 600]],
    plats: [P(160, 700, 520, 'solid', null, 200), P(920, 700, 520, 'solid', null, 200), P(700, 520, 200), P(260, 450, 200), P(1140, 450, 200), P(700, 300, 200)],
  },
  {
    name: 'Volcano', theme: 'volcano', lava: 820,
    sky: ['#2b0b0b', '#8a2a0b'], plat: '#3b2a26', platTop: '#ff7b00',
    spawns: [[400, 560], [1200, 560]],
    plats: [P(250, 620, 300, 'solid', null, 60), P(1050, 620, 300, 'solid', null, 60), P(650, 500, 300, 'oneway', { ax: 0, ay: 60, period: 300 }), P(120, 380, 200), P(1280, 380, 200), P(700, 260, 200)],
  },
  {
    name: 'Sky Islands', theme: 'sky',
    sky: ['#4fc3f7', '#e1f5fe'], plat: '#6d4c41', platTop: '#7cb342',
    spawns: [[400, 540], [1200, 540]],
    plats: [P(280, 600, 260, 'solid', null, 70), P(1060, 600, 260, 'solid', null, 70), P(660, 680, 280, 'solid', null, 70), P(700, 420, 200, 'oneway', { ax: 160, ay: 0, period: 420 }), P(150, 380, 160), P(1290, 380, 160)],
  },
  {
    name: 'Ice Cavern', theme: 'ice', ice: true,
    sky: ['#0d2b45', '#4a90b8'], plat: '#9ad0ec', platTop: '#ffffff',
    spawns: [[400, 620], [1200, 620]],
    plats: [P(140, 700, 1320, 'solid', null, 200), P(320, 520, 260), P(1020, 520, 260), P(670, 380, 260), P(140, 300, 160), P(1300, 300, 160)],
  },
  {
    name: 'Moon Base', theme: 'moon', grav: 0.38, jump: 0.72,
    sky: ['#000000', '#1a1a2e'], plat: '#9e9e9e', platTop: '#e0e0e0',
    spawns: [[400, 600], [1200, 600]],
    plats: [P(200, 700, 1200, 'solid', null, 200), P(350, 480, 220), P(1030, 480, 220), P(690, 300, 220), P(100, 250, 150), P(1350, 250, 150)],
  },
  {
    name: 'Factory', theme: 'factory',
    sky: ['#263238', '#455a64'], plat: '#ff8f00', platTop: '#ffca28',
    spawns: [[300, 640], [1300, 640]],
    plats: [P(150, 720, 380, 'solid', null, 180), P(1070, 720, 380, 'solid', null, 180), P(640, 620, 320, 'oneway', { ax: 0, ay: 150, period: 360 }), P(250, 450, 200, 'oneway', { ax: 120, ay: 0, period: 300 }), P(1150, 450, 200, 'oneway', { ax: -120, ay: 0, period: 300 }), P(700, 260, 200)],
  },
  {
    name: 'Storm Peak', theme: 'storm', wind: 0.22,
    sky: ['#1c2331', '#5c6b7a'], plat: '#5d5d5d', platTop: '#cfd8dc',
    spawns: [[450, 580], [1150, 580]],
    plats: [P(300, 660, 1000, 'solid', null, 240), P(200, 470, 220), P(1180, 470, 220), P(690, 430, 220), P(690, 240, 220)],
  },
  {
    name: 'Dojo', theme: 'dojo', walls: true,
    sky: ['#3e2723', '#8d6e63'], plat: '#5d4037', platTop: '#d7a86e',
    spawns: [[400, 700], [1200, 700]],
    plats: [P(0, 780, 1600, 'solid', null, 120), P(250, 580, 300), P(1050, 580, 300), P(650, 420, 300), P(200, 300, 200), P(1200, 300, 200)],
  },
  {
    name: 'Neon Grid', theme: 'neon',
    sky: ['#0a0014', '#2a0040'], plat: '#1a0033', platTop: '#ff00ff',
    spawns: [[420, 580], [1180, 580]],
    plats: [P(250, 650, 1100, 'solid', null, 40), P(120, 650, 110, 'pad', null, 40), P(1370, 650, 110, 'pad', null, 40), P(400, 440, 220), P(980, 440, 220), P(690, 250, 220)],
  },
  {
    name: 'Desert Ruins', theme: 'desert', wind: 0.12,
    sky: ['#f57c00', '#ffe082'], plat: '#a1887f', platTop: '#ffcc80',
    spawns: [[380, 620], [1220, 620]],
    plats: [P(180, 690, 500, 'solid', null, 210), P(920, 690, 500, 'solid', null, 210), P(690, 560, 220, 'oneway', { ax: 0, ay: 40, period: 240 }), P(300, 430, 200), P(1100, 430, 200), P(700, 300, 200)],
  },
  {
    name: 'Jungle Canopy', theme: 'jungle',
    sky: ['#1b5e20', '#a5d6a7'], plat: '#4e342e', platTop: '#66bb6a',
    spawns: [[330, 560], [1270, 560]],
    plats: [P(200, 620, 260, 'solid', null, 50), P(1140, 620, 260, 'solid', null, 50), P(670, 700, 260, 'solid', null, 50), P(470, 480, 180, 'oneway', { ax: 0, ay: 80, period: 330 }), P(950, 480, 180, 'oneway', { ax: 0, ay: -80, period: 330 }), P(700, 300, 200), P(60, 400, 140), P(1400, 400, 140)],
  },
  {
    name: 'Space Station', theme: 'space', grav: 0.5, jump: 0.82,
    sky: ['#000010', '#0d1b4c'], plat: '#37474f', platTop: '#00e676',
    spawns: [[400, 560], [1200, 560]],
    plats: [P(250, 640, 400, 'solid', null, 40), P(950, 640, 400, 'solid', null, 40), P(700, 520, 200, 'oneway', { ax: 200, ay: 0, period: 480 }), P(300, 400, 180), P(1120, 400, 180), P(710, 260, 180, 'oneway', { ax: 0, ay: 60, period: 300 }), P(720, 760, 160, 'pad', null, 30)],
  },
];

// Current platform rect at time t (frames)
export function platAt(p, t) {
  if (!p.move) return { x: p.x, y: p.y };
  const s = Math.sin((t / p.move.period) * Math.PI * 2);
  return { x: p.x + p.move.ax * s, y: p.y + p.move.ay * s };
}
