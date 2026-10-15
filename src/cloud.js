'use strict';
/* ===== cloud.js — conta (Supabase Auth) e dados (campanhas, personagens) =====
   A chave abaixo é a chave PÚBLICA (anon). Ela pode ficar no código: quem protege os dados é o RLS do banco. */

const CLOUD = {
  url: 'https://cbttmcffujohaoqnfqgz.supabase.co',
  key: 'sb_publishable_g63aZjYEs4hAwZMDqsBG8g_OYJXnERz'
};

function friendlyAuthError(e) {
  const m = (e && (e.message || e.error_description)) || String(e || '');
  if (/invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/already registered|already been registered/i.test(m)) return 'Esse e-mail já tem conta. Use "Entrar".';
  if (/password should be at least|weak password/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/email not confirmed/i.test(m)) return 'Confirme seu e-mail (veja a caixa de entrada) antes de entrar.';
  if (/anonymous sign-ins are disabled/i.test(m)) return 'Login de convidado ainda não está ativado no Supabase (Authentication → Sign In / Providers → Allow anonymous sign-ins).';
  if (/provider is not enabled|unsupported provider/i.test(m)) return 'Esse método de login ainda não foi ativado no Supabase.';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Espere um pouco e tente de novo.';
  if (/invalid.*email|unable to validate email/i.test(m)) return 'E-mail inválido.';
  if (/failed to fetch|networkerror|load failed/i.test(m)) return 'Sem conexão com o servidor. Confira sua internet.';
  if (/código de campanha inválido/i.test(m)) return 'Código de mesa não encontrado. Confira com o mestre.';
  return m || 'Algo deu errado.';
}

const Cloud = {
  client: null, user: null, profile: null, ready: false, _uploaded: new Set(), _subs: [],
  async init() {
    if (this.ready) return true;
    if (!globalThis.supabase) {
      await new Promise((res, rej) => {
        const s = document.createElement('script'); s.src = SUPABASE_CDN; s.onload = res; s.onerror = () => rej(new Error('Sem internet: não foi possível carregar o cliente Supabase.')); document.head.appendChild(s);
      });
    }
    this.client = supabase.createClient(CLOUD.url, CLOUD.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }, realtime: { params: { eventsPerSecond: 40 } } });
    const { data } = await this.client.auth.getSession(); this.user = data && data.session ? data.session.user : null;
    this.client.auth.onAuthStateChange((ev, session) => { this.user = session ? session.user : null; if (!session) this.profile = null; this._subs.forEach(f => { try { f(ev, session); } catch (e) { /* */ } }); });
    this.ready = true; return true;
  },
  onAuth(fn) { this._subs.push(fn); },
  get isGuest() { return !!(this.user && (this.user.is_anonymous || (this.profile && this.profile.is_guest))); },
  async _ok(p) { const r = await p; if (r.error) throw r.error; return r.data; },

  /* ---- autenticação ---- */
  async signUp(email, password, name) {
    const r = await this.client.auth.signUp({ email, password, options: { data: { display_name: name || '' }, emailRedirectTo: this.redirect() } }); if (r.error) throw r.error;
    this.user = r.data.session ? r.data.user : null; return { needsConfirm: !r.data.session };
  },
  async signIn(email, password) { const r = await this.client.auth.signInWithPassword({ email, password }); if (r.error) throw r.error; this.user = r.data.user; },
  async signInGuest(name) { const r = await this.client.auth.signInAnonymously({ options: { data: { display_name: name || '' } } }); if (r.error) throw r.error; this.user = r.data.user; },
  async magicLink(email) { const r = await this.client.auth.signInWithOtp({ email, options: { emailRedirectTo: this.redirect() } }); if (r.error) throw r.error; },
  async google() { const r = await this.client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: this.redirect() } }); if (r.error) throw r.error; },
  async resetPassword(email) { const r = await this.client.auth.resetPasswordForEmail(email, { redirectTo: this.redirect() }); if (r.error) throw r.error; },
  async signOut() { try { await this.client.auth.signOut(); } catch (e) { /* */ } this.user = null; this.profile = null; },
  redirect() { return location.protocol === 'file:' ? undefined : location.origin + location.pathname; },
  /* convidado vira conta de verdade mantendo mesas e personagens */
  async upgradeGuest(email, password) { const r = await this.client.auth.updateUser({ email, password }); if (r.error) throw r.error; this.user = r.data.user; await this.updateProfile({ is_guest: false }); },

  /* ---- perfil ---- */
  async loadProfile() {
    if (!this.user) return null;
    for (let i = 0; i < 4; i++) { // o gatilho do banco cria o perfil logo após o cadastro
      const p = await this._ok(this.client.from('profiles').select('*').eq('id', this.user.id).maybeSingle());
      if (p) return this.profile = p; await new Promise(r => setTimeout(r, 400));
    }
    const p = await this._ok(this.client.from('profiles').upsert({ id: this.user.id, is_guest: !!this.user.is_anonymous }).select().single()); return this.profile = p;
  },
  async updateProfile(patch) { await this._ok(this.client.from('profiles').update(patch).eq('id', this.user.id)); this.profile = Object.assign(this.profile || {}, patch); },

  /* ---- campanhas ---- */
  async myCampaigns() { return await this._ok(this.client.rpc('my_campaigns')) || []; },
  async createCampaign(name) {
    const row = await this._ok(this.client.from('campaigns').insert({ owner_id: this.user.id, name: name || 'Nova campanha', data: {} }).select().single()); return row;
  },
  async loadCampaign(id) {
    const row = await this._ok(this.client.from('campaigns').select('*').eq('id', id).single());
    const as = await this._ok(this.client.from('campaign_assets').select('id,data').eq('campaign_id', id)); const assets = {}; this._uploaded = new Set();
    for (const a of as || []) { assets[a.id] = a.data; this._uploaded.add(a.id); }
    return { row, assets };
  },
  async saveCampaign(id, C, assets) {
    const data = Object.assign({}, C, { characters: {} });
    await this._ok(this.client.from('campaigns').update({ name: C.name || 'Campanha', data }).eq('id', id));
    const used = Object.keys(assets).filter(k => !/^pa_/.test(k)); // fotos de jogadores não entram na campanha
    const fresh = used.filter(k => !this._uploaded.has(k));
    for (let i = 0; i < fresh.length; i += 4) { // em lotes pequenos (imagens são grandes)
      const batch = fresh.slice(i, i + 4).map(k => ({ campaign_id: id, id: k, data: assets[k] })); await this._ok(this.client.from('campaign_assets').upsert(batch)); batch.forEach(b => this._uploaded.add(b.id));
    }
    const gone = [...this._uploaded].filter(k => !used.includes(k));
    if (gone.length) { await this._ok(this.client.from('campaign_assets').delete().eq('campaign_id', id).in('id', gone)); gone.forEach(k => this._uploaded.delete(k)); }
  },
  async renameCampaign(id, name) { await this._ok(this.client.from('campaigns').update({ name }).eq('id', id)); },
  async deleteCampaign(id) { await this._ok(this.client.from('campaigns').delete().eq('id', id)); },
  async leaveCampaign(id) { await this._ok(this.client.from('campaign_members').delete().eq('campaign_id', id).eq('user_id', this.user.id)); },
  async joinCampaign(code, characterId) {
    const r = await this._ok(this.client.rpc('join_campaign', { p_code: String(code || '').trim().toUpperCase(), p_character: characterId || null }));
    return Array.isArray(r) ? r[0] : r;
  },

  /* ---- personagens ---- */
  async myCharacters() { return await this._ok(this.client.from('characters').select('*').order('created_at', { ascending: true })) || []; },
  async saveCharacter(c) { // c: { id?, name, style, image }
    const row = { owner_id: this.user.id, name: (c.name || 'Personagem').slice(0, 24), style: c.style || {}, image: c.image || null };
    if (c.id) { await this._ok(this.client.from('characters').update(row).eq('id', c.id)); return c.id; }
    const r = await this._ok(this.client.from('characters').insert(row).select().single()); return r.id;
  },
  async deleteCharacter(id) { await this._ok(this.client.from('characters').delete().eq('id', id)); }
};

/* personagem do banco <-> formato local do jogador */
function charToProfile(c) {
  const st = c.style || {}, ch = { frame: st.frame || 'circle', color: st.color || '#c9a227', alpha: st.alpha == null ? 1 : st.alpha, zoom: st.zoom || 1, ox: st.ox || 0, oy: st.oy || 0, state: 'normal', asset: null, name: c.name };
  if (c.image) { const id = 'pa_c' + String(c.id).replace(/[^a-z0-9]/gi, '').slice(0, 10); Assets.put(id, c.image); ch.asset = id; }
  return ch;
}
function profileToChar(ch, id) {
  return { id, name: ch.name, style: { frame: ch.frame, color: ch.color, alpha: ch.alpha, zoom: ch.zoom || 1, ox: ch.ox || 0, oy: ch.oy || 0 }, image: ch.asset && Assets.data[ch.asset] ? Assets.data[ch.asset] : null };
}
