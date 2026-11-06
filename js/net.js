// Peer-to-peer rooms over WebRTC using PeerJS (global `Peer` from vendor/peerjs.min.js).
// The host's peer id is PREFIX + room number, so the guest only needs the number.
const PREFIX = 'stickmen-pvp-arena-v1-';

// Optional self-hosted signaling server: add ?peer=host:port (or host) to the URL.
function peerOpts() {
  const o = { debug: 0 };
  const m = new URLSearchParams(location.search).get('peer');
  if (m) {
    const [host, port] = m.split(':');
    o.host = host; o.port = +(port || 443); o.path = '/'; o.secure = location.protocol === 'https:' && host !== 'localhost';
  }
  return o;
}

export function makeRoomCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export class Net {
  constructor() {
    this.peer = null; this.conn = null;
    this.onData = () => {}; this.onOpen = () => {}; this.onClose = () => {}; this.onError = () => {};
    this.ping = null;
  }

  host(onCode, tries = 0) {
    const code = makeRoomCode();
    this.peer = new Peer(PREFIX + code, peerOpts());
    this.peer.on('open', () => onCode(code));
    this.peer.on('connection', (c) => {
      if (this.conn && this.conn.open) { c.on('open', () => { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); }); return; }
      this.attach(c);
    });
    this.peer.on('error', (err) => {
      if (err.type === 'unavailable-id' && tries < 5) { this.peer.destroy(); this.host(onCode, tries + 1); return; }
      this.onError(niceError(err));
    });
    this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch {} });
  }

  join(code) {
    this.peer = new Peer(peerOpts());
    this.peer.on('open', () => {
      const c = this.peer.connect(PREFIX + code.trim(), { reliable: true, serialization: 'json' });
      this.attach(c);
      setTimeout(() => { if (!this.conn || !this.conn.open) this.onError('Could not connect to room ' + code + '. Check the number and try again.'); }, 12000);
    });
    this.peer.on('error', (err) => this.onError(niceError(err, code)));
  }

  attach(c) {
    this.conn = c;
    c.on('open', () => { this.onOpen(); this.startPing(); });
    c.on('data', (d) => {
      if (d && d.t === 'ping') { this.send({ t: 'pong', ts: d.ts }); return; }
      if (d && d.t === 'pong') { this.ping = Math.round(performance.now() - d.ts); return; }
      this.onData(d);
    });
    c.on('close', () => { this.stopPing(); this.onClose(); });
    c.on('error', () => {});
  }

  startPing() {
    this.stopPing();
    this.pingT = setInterval(() => this.send({ t: 'ping', ts: performance.now() }), 2000);
  }
  stopPing() { if (this.pingT) clearInterval(this.pingT); this.pingT = null; }

  send(obj) {
    if (this.conn && this.conn.open) {
      try { this.conn.send(obj); } catch {}
    }
  }

  close() {
    this.stopPing();
    try { this.conn && this.conn.close(); } catch {}
    try { this.peer && this.peer.destroy(); } catch {}
    this.conn = null; this.peer = null;
  }
}

function niceError(err, code) {
  switch (err.type) {
    case 'peer-unavailable': return `Room ${code || ''} not found. Make sure the host has created it.`;
    case 'network': case 'server-error': case 'socket-error': case 'socket-closed':
      return 'Network error — check your internet connection.';
    case 'browser-incompatible': return 'This browser does not support online play (WebRTC).';
    default: return 'Connection error: ' + (err.type || err.message || err);
  }
}
