'use strict';
/* ===== net.js — transporte (Supabase Realtime ou local) com fila e fragmentação ===== */

const CHUNK = 40000;
const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

class Net {
  constructor(tr, myId) {
    this.tr = tr; this.id = myId; this.handlers = []; this.q = []; this.sending = false; this.partial = {}; this.status = 'idle'; this.onStatus = null;
    tr.onmsg = m => this._recv(m);
    tr.onstatus = st => { const was = this.status; this.status = st; if (this.onStatus) this.onStatus(st, was); };
  }
  async open() { await this.tr.open(); if (this.status === 'idle') this.status = 'open'; }
  on(fn) { this.handlers.push(fn); }
  close() { this.q = []; try { this.tr.close(); } catch (e) { /* */ } this.status = 'closed'; }
  send(msg, to) {
    msg.from = this.id; if (to) msg.to = to;
    const s = JSON.stringify(msg);
    if (s.length <= CHUNK) { this._enq({ m: msg, key: msg.t === 'pos' || msg.t === 'move' ? msg.t : null }); return; }
    const cid = uid('c'), n = Math.ceil(s.length / CHUNK);
    for (let i = 0; i < n; i++) this._enq({ m: { t: '~c', from: this.id, to: msg.to, cid, i, n, s: s.slice(i * CHUNK, (i + 1) * CHUNK) } });
  }
  _enq(it) {
    if (it.key) { const i = this.q.findIndex(x => x.key === it.key); if (i >= 0) { this.q[i] = it; this._pump(); return; } }
    this.q.push(it); this._pump();
  }
  _pump() {
    if (this.sending) return; this.sending = true;
    const step = () => {
      const it = this.q.shift(); if (!it) { this.sending = false; return; }
      try { this.tr.send(it.m); } catch (e) { /* */ }
      setTimeout(step, this.tr.gap == null ? 28 : this.tr.gap);
    };
    step();
  }
  _recv(m) {
    if (!m || m.from === this.id) return;
    if (m.to && m.to !== this.id) return;
    if (m.t === '~c') {
      const p = this.partial[m.cid] || (this.partial[m.cid] = { n: m.n, got: 0, parts: [], ts: Date.now() });
      if (!p.parts[m.i]) { p.parts[m.i] = m.s; p.got++; }
      if (p.got === p.n) { delete this.partial[m.cid]; try { m = JSON.parse(p.parts.join('')); } catch (e) { return; } }
      else { for (const k in this.partial) if (Date.now() - this.partial[k].ts > 60000) delete this.partial[k]; return; }
    }
    for (const h of this.handlers) { try { h(m); } catch (e) { console.error(e); } }
  }
}

class LocalTransport {
  constructor(code) { this.code = code; this.gap = 4; }
  async open() { this.bc = new BroadcastChannel('vtt-' + this.code); this.bc.onmessage = e => this.onmsg && this.onmsg(e.data); }
  send(m) { this.bc.postMessage(m); }
  close() { if (this.bc) this.bc.close(); }
}

class SupabaseTransport {
  constructor(code, url, key) { this.code = code; this.url = url; this.key = key; this.gap = 30; }
  async open() {
    if (!globalThis.supabase) {
      await new Promise((res, rej) => {
        const s = document.createElement('script'); s.src = SUPABASE_CDN; s.onload = res; s.onerror = () => rej(new Error('Não foi possível carregar o cliente Supabase (sem internet?)')); document.head.appendChild(s);
      });
    }
    this.shared = !!(globalThis.Cloud && Cloud.client && this.url === CLOUD.url);
    this.client = this.shared ? Cloud.client : supabase.createClient(this.url, this.key, { realtime: { params: { eventsPerSecond: 40 } } });
    this.ch = this.client.channel('vtt:' + this.code, { config: { broadcast: { self: false, ack: false } } });
    this.ch.on('broadcast', { event: 'm' }, p => this.onmsg && this.onmsg(p.payload));
    await new Promise((res, rej) => {
      let first = true;
      const to = setTimeout(() => { if (first) { first = false; rej(new Error('Tempo esgotado ao conectar ao Realtime. Confira a URL e a chave.')); } }, 15000);
      this.ch.subscribe(st => {
        if (st === 'SUBSCRIBED') { if (first) { first = false; clearTimeout(to); res(); } else if (this.onstatus) this.onstatus('reconnected'); }
        else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT' || st === 'CLOSED') {
          if (first) { first = false; clearTimeout(to); rej(new Error('Falha no canal Realtime (' + st + ')')); } else if (this.onstatus) this.onstatus('lost');
        }
      });
    });
  }
  send(m) { this.ch.send({ type: 'broadcast', event: 'm', payload: m }); }
  close() { try { this.client.removeChannel(this.ch); } catch (e) { /* */ } }
}

function makeTransport(cfg) {
  if (cfg.mode === 'online') return new SupabaseTransport(cfg.code, cfg.url, cfg.key);
  return new LocalTransport(cfg.code);
}
function genCode() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 6; i++) s += a[(Math.random() * a.length) | 0]; return s; }
