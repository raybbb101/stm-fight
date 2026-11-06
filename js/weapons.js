// Weapon roster. Index 0 = Fists (default), 1..50 = pickable weapons.
// atk.kind: 'melee' | 'shot'
// skill.type: see doSkill() in game.js

const M = (dmg, range, cd, kb) => ({ kind: 'melee', dmg, range, cd, kb });
const S = (dmg, cd, speed, o = {}) => ({
  kind: 'shot', dmg, cd, speed,
  kb: o.kb ?? 4, r: o.r ?? 5, grav: o.grav ?? 0, life: o.life ?? 90,
  count: o.count ?? 1, spread: o.spread ?? 0, pierce: !!o.pierce,
  explode: o.explode ?? 0, pk: o.pk ?? 'bullet', color: o.color,
});
const K = (type, name, cd, o = {}) => ({ type, name, cd, ...o });
const w = (name, shape, color, cat, atk, skill, size = 1) => ({ name, shape, color, cat, atk, skill, size });

export const WEAPONS = [
  w('Fists', 'fist', '#ffffff', 'Melee', M(5, 42, 14, 5), K('uppercut', 'Rising Fist', 240, { dmg: 10 })),

  // ---------- MELEE (1-25) ----------
  w('Iron Sword', 'sword', '#c9d2dc', 'Melee', M(9, 72, 22, 7), K('dash', 'Lunge', 180, { dmg: 14 })),
  w('Katana', 'katana', '#eef1f6', 'Melee', M(8, 78, 16, 6), K('teleport', 'Shadow Step', 240, { dmg: 16 })),
  w('Battle Axe', 'axe', '#8a919c', 'Melee', M(14, 66, 34, 11), K('spin', 'Whirlwind', 300, { dmg: 4, dur: 60 })),
  w('War Hammer', 'hammer', '#8d7b68', 'Melee', M(16, 62, 40, 14), K('slam', 'Earthshaker', 270, { dmg: 18 })),
  w('Spear', 'spear', '#c49a5a', 'Melee', M(10, 108, 26, 8), K('dash', 'Impale', 200, { dmg: 15, speed: 26 })),
  w('Dagger', 'dagger', '#d6d6d6', 'Melee', M(6, 46, 10, 4), K('teleport', 'Backstab', 210, { dmg: 20 })),
  w('Scythe', 'scythe', '#5c5c66', 'Melee', M(12, 92, 30, 9), K('blackhole', 'Soul Reap', 420, { dmg: 3, color: '#9c27b0' })),
  w('Flame Sword', 'sword', '#ff6a00', 'Melee', M(10, 72, 22, 7), K('fireball', 'Inferno Orb', 260, { dmg: 18 })),
  w('Frost Blade', 'sword', '#8fe3ff', 'Melee', M(9, 72, 22, 6), K('freeze', 'Frost Wave', 300, { dmg: 8 })),
  w('Thunder Hammer', 'hammer', '#ffe14d', 'Melee', M(15, 62, 38, 12), K('lightning', 'Thunderstrike', 300, { dmg: 18, n: 1 })),
  w('Lance', 'lance', '#d4b83a', 'Melee', M(11, 118, 30, 10), K('dash', 'Charge', 220, { dmg: 18, speed: 24, dur: 20 })),
  w('Trident', 'trident', '#2ec4b6', 'Melee', M(10, 100, 26, 8), K('burst', 'Tidal Burst', 240, { dmg: 8, n: 3, spreadA: 0.25, pk: 'ball', color: '#4dd0e1', r: 10 })),
  w('Spiked Club', 'club', '#7b4b2a', 'Melee', M(11, 56, 26, 10), K('uppercut', 'Bonk Launch', 220, { dmg: 13 })),
  w('Whip', 'whip', '#9c6a3a', 'Melee', M(7, 135, 20, 5), K('grapple', 'Lasso', 240, { dmg: 6 })),
  w('Twin Blades', 'dagger', '#ff4da6', 'Melee', M(5, 52, 8, 3), K('spin', 'Blade Dance', 260, { dmg: 3, dur: 50 })),
  w('Greatsword', 'sword', '#a3aebb', 'Melee', M(17, 88, 42, 13), K('slam', 'Skybreaker', 300, { dmg: 22 }), 1.45),
  w('Nunchaku', 'nunchaku', '#3b3b3b', 'Melee', M(6, 56, 9, 4), K('rapid', 'Flurry', 300, { dur: 80 })),
  w('Halberd', 'halberd', '#a8a8a8', 'Melee', M(13, 102, 32, 10), K('quake', 'Fault Line', 260, { dmg: 14 })),
  w('Boxing Gloves', 'gauntlet', '#e63946', 'Melee', M(7, 42, 12, 8), K('uppercut', 'Haymaker', 200, { dmg: 14 })),
  w('Power Gauntlet', 'gauntlet', '#6c63ff', 'Melee', M(10, 46, 18, 12), K('explosion', 'Shockwave Punch', 320, { dmg: 16 })),
  w('Bo Staff', 'staff', '#a67c52', 'Melee', M(8, 96, 18, 7), K('spin', 'Staff Cyclone', 260, { dmg: 3, dur: 70 })),
  w('Chainsaw', 'chainsaw', '#f4a261', 'Melee', M(4, 62, 5, 2), K('rage', 'Overdrive', 420, { dur: 300 })),
  w('Vampire Blade', 'sword', '#b0002a', 'Melee', M(9, 72, 22, 6), K('heal', 'Blood Drain', 420, { heal: 25, dmg: 12 })),
  w('Guardian Mace', 'club', '#b0bec5', 'Melee', M(11, 60, 26, 9), K('shield', 'Aegis', 360, { dur: 130 })),
  w("Miner's Pick", 'pick', '#7d7d7d', 'Melee', M(12, 62, 28, 9), K('mines', 'Dynamite Trap', 300, { n: 1, dmg: 22 })),

  // ---------- RANGED (26-44) ----------
  w('Pistol', 'pistol', '#5a5a5a', 'Ranged', S(6, 18, 19), K('burst', 'Fan the Hammer', 240, { dmg: 5, n: 5, spreadA: 0.18 })),
  w('Shotgun', 'shotgun', '#6d4c41', 'Ranged', S(4, 45, 17, { count: 5, spread: 0.22, life: 30, kb: 3 }), K('burst', 'Buckshot Storm', 300, { dmg: 4, n: 12, spreadA: 0.6, life: 35 })),
  w('Sniper Rifle', 'rifle', '#2f3e46', 'Ranged', S(18, 70, 42, { pierce: true, kb: 10, pk: 'laser', color: '#fff59d' }), K('beam', 'Rail Shot', 360, { dmg: 26, color: '#fff59d' }), 1.3),
  w('Assault Rifle', 'rifle', '#4a5759', 'Ranged', S(4, 8, 22), K('rapid', 'Full Auto', 330, { dur: 90 })),
  w('SMG', 'smg', '#333333', 'Ranged', S(3, 5, 20, { spread: 0.08, kb: 2 }), K('rapid', 'Bullet Hose', 330, { dur: 100 })),
  w('Longbow', 'bow', '#8d6e63', 'Ranged', S(9, 30, 18, { grav: 0.15, pk: 'arrow', kb: 6 }), K('meteor', 'Arrow Rain', 360, { dmg: 7, n: 8, pk: 'arrow' })),
  w('Crossbow', 'crossbow', '#5d4037', 'Ranged', S(12, 40, 23, { pk: 'arrow', kb: 7 }), K('burst', 'Triple Bolt', 240, { dmg: 9, n: 3, spreadA: 0.15, pk: 'arrow' })),
  w('Rocket Launcher', 'launcher', '#556b2f', 'Ranged', S(14, 70, 11, { explode: 90, pk: 'rocket', kb: 9 }), K('meteor', 'Airstrike', 420, { dmg: 12, n: 5, pk: 'rocket', explode: 80 })),
  w('Grenade Launcher', 'launcher', '#6b8e23', 'Ranged', S(10, 50, 12, { grav: 0.35, explode: 85, pk: 'grenade', life: 120 }), K('mines', 'Cluster Mines', 360, { n: 3, dmg: 16 })),
  w('Laser Gun', 'pistol', '#00e5ff', 'Ranged', S(5, 12, 28, { pk: 'laser', color: '#00e5ff' }), K('beam', 'Hyper Beam', 330, { dmg: 22, color: '#00e5ff' })),
  w('Plasma Rifle', 'rifle', '#b388ff', 'Ranged', S(8, 22, 15, { r: 9, pk: 'ball', color: '#b388ff' }), K('blackhole', 'Singularity', 420, { dmg: 3, color: '#7c4dff' })),
  w('Flamethrower', 'flamer', '#ff7043', 'Ranged', S(2, 4, 10, { life: 26, spread: 0.2, pk: 'flame', kb: 1, r: 9 }), K('poison', 'Napalm', 330, { dmg: 2, color: '#ff6d00' })),
  w('Freeze Ray', 'pistol', '#b3e5fc', 'Ranged', S(4, 14, 18, { pk: 'ice', color: '#b3e5fc' }), K('freeze', 'Deep Freeze', 300, { dmg: 10 })),
  w('Shuriken', 'shuriken', '#9e9e9e', 'Ranged', S(5, 14, 20, { pk: 'shuriken' }), K('burst', 'Shuriken Storm', 300, { dmg: 6, n: 10, spreadA: Math.PI, pk: 'shuriken' })),
  w('Throwing Knives', 'dagger', '#cfd8dc', 'Ranged', S(6, 16, 22, { pk: 'knife' }), K('teleport', 'Vanish', 260, { dmg: 15 })),
  w('Boomerang', 'boomerang', '#ff9800', 'Ranged', S(8, 40, 15, { pk: 'boomerang', life: 70, pierce: true }), K('boomerang', 'Mega Boomerang', 280, { dmg: 14 })),
  w('Chakram', 'chakram', '#ffd54f', 'Ranged', S(9, 36, 14, { pk: 'chakram', life: 70, pierce: true }), K('spin', 'Ring Storm', 280, { dmg: 4, dur: 60 })),
  w('Slingshot', 'slingshot', '#795548', 'Ranged', S(5, 20, 17, { grav: 0.25, pk: 'rock', kb: 6 }), K('burst', 'Pebble Spray', 220, { dmg: 5, n: 6, spreadA: 0.35, pk: 'rock' })),
  w('Harpoon Gun', 'rifle', '#607d8b', 'Ranged', S(10, 45, 18, { pk: 'arrow' }), K('grapple', 'Reel In', 260, { dmg: 8 })),

  // ---------- MAGIC (45-50) ----------
  w('Fire Staff', 'staff', '#ff5722', 'Magic', S(8, 30, 13, { r: 10, pk: 'fire', explode: 50, color: '#ff5722' }), K('meteor', 'Meteor Shower', 420, { dmg: 12, n: 6, pk: 'meteor', explode: 70 })),
  w('Ice Staff', 'staff', '#4fc3f7', 'Magic', S(7, 26, 14, { pk: 'ice', r: 8, color: '#4fc3f7' }), K('freeze', 'Blizzard', 330, { dmg: 12, big: true })),
  w('Lightning Wand', 'wand', '#fff176', 'Magic', S(6, 18, 24, { pk: 'spark', color: '#fff176' }), K('lightning', 'Chain Storm', 360, { dmg: 12, n: 3 })),
  w('Poison Staff', 'staff', '#8bc34a', 'Magic', S(6, 28, 13, { pk: 'ball', r: 8, color: '#8bc34a' }), K('poison', 'Toxic Cloud', 330, { dmg: 2, color: '#76ff03' })),
  w('Wind Fan', 'fan', '#80cbc4', 'Magic', S(3, 24, 14, { kb: 12, pk: 'wind', r: 12, color: '#b2dfdb' }), K('tornado', 'Cyclone', 330, { dmg: 2 })),
  w('Dark Orb', 'orb', '#7e57c2', 'Magic', S(9, 32, 12, { pk: 'ball', r: 9, color: '#7e57c2' }), K('blackhole', 'Void', 420, { dmg: 4, color: '#311b92' })),
];

export const SKILL_DESC = {
  dash: 'Rush forward, hitting anyone in the way',
  spin: 'Spin attack that hits all around you',
  slam: 'Smash the ground and send out shockwaves',
  burst: 'Fire a spread of projectiles',
  fireball: 'Launch an exploding fire orb',
  lightning: 'Call lightning down on your enemy',
  freeze: 'Freeze your enemy solid',
  teleport: 'Teleport behind your enemy and strike',
  shield: 'Become invulnerable and reflect projectiles',
  heal: 'Drain nearby enemies and heal yourself',
  boomerang: 'Throw a giant returning blade',
  meteor: 'Rain projectiles from the sky',
  grapple: 'Hook your enemy and pull them in',
  poison: 'Create a damaging cloud',
  blackhole: 'Summon a vortex that sucks enemies in',
  explosion: 'Explode with huge knockback',
  beam: 'Fire a piercing beam across the stage',
  uppercut: 'Leap up and launch the enemy skyward',
  rage: 'Boost damage and speed for a while',
  mines: 'Plant explosive traps',
  quake: 'Send a ground wave that launches enemies',
  tornado: 'Summon a moving tornado',
  rapid: 'Unleash rapid attacks for a short time',
};
