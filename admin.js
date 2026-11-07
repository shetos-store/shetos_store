/* SHETOS STORE - ADMIN LAYER. Load BEFORE script.js.
   No password is stored here: it is checked by the admin Worker (admin-worker.js). */
(function () {
  'use strict';
  var API = 'https://shetos-admin.YOURNAME.workers.dev';   // <- your admin Worker URL
  var ADMIN_PHONE = '01227395613', ADMIN_NAME = 'adam sameh', ADMIN_KEY = 'p_' + ADMIN_PHONE;
  var TK = 'shetos_admin_tok';

  var norm = function (s) { return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase(); };
  var configured = function () { return API && API.indexOf('YOURNAME') < 0; };
  function tok() {
    try { var t = JSON.parse(sessionStorage.getItem(TK)); if (t && t.exp > Date.now()) return t.t; } catch (e) {}
    return '';
  }
  function api(method, path, body, auth, keep) {
    var headers = { 'Content-Type': 'application/json' };
    if (auth) headers.Authorization = 'Bearer ' + tok();
    return fetch(API.replace(/\/+$/, '') + path, { method: method, headers: headers, keepalive: !!keep, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          d._status = r.status;
          if (r.status === 401 && auth) lock(true);
          return d;
        });
      });
  }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }

  /* ---------- password gate (called by script.js at login) ---------- */
  function gate(name) {
    return new Promise(function (resolve) {
      if (norm(name) !== ADMIN_NAME) return resolve({ ok: false, error: 'wrongName' });
      if (!configured()) return resolve({ ok: false, error: 'notConfigured' });
      var err = h('div', { class: 'adm-err' });
      var pw = h('input', { type: 'password', class: 'adm-input', placeholder: 'Admin password', autocomplete: 'current-password' });
      var go = h('button', { class: 'adm-btn', type: 'button', text: 'Unlock' });
      var cancel = h('button', { class: 'adm-btn ghost', type: 'button', text: 'Cancel' });
      var box = h('div', { class: 'adm-gate' }, [
        h('div', { class: 'adm-lock', text: '🔐' }), h('h3', { text: 'Admin password' }),
        h('p', { text: 'This number belongs to the store administrator. Enter the password to continue.' }),
        pw, err, h('div', { class: 'adm-row' }, [cancel, go])
      ]);
      var ov = h('div', { class: 'adm-overlay' }, [box]);
      document.body.appendChild(ov); pw.focus();
      function done(r) { ov.remove(); resolve(r); }
      function submit() {
        if (!pw.value) return;
        go.disabled = true; err.textContent = '';
        api('POST', '/login', { password: pw.value, phone: ADMIN_PHONE, name: name }).then(function (d) {
          go.disabled = false;
          if (d.ok && d.token) {
            sessionStorage.setItem(TK, JSON.stringify({ t: d.token, exp: d.exp }));
            showFab(); done({ ok: true });
          } else {
            err.textContent = d._status === 429 ? 'Too many attempts. Try again in 15 minutes.' : 'Wrong password.';
            pw.value = ''; pw.focus();
          }
        }).catch(function () { go.disabled = false; err.textContent = 'Cannot reach the admin server.'; });
      }
      go.addEventListener('click', submit);
      cancel.addEventListener('click', function () { done({ ok: false, error: '' }); });
      pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    });
  }

  /* ---------- visitor + order tracking (skipped while admin is unlocked) ---------- */
  function vid() {
    var v = localStorage.getItem('shetos_vid');
    if (!v) {
      v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      localStorage.setItem('shetos_vid', v);
    }
    return v;
  }
  var visitP = Promise.resolve();
  function trackVisit() {
    try {
      if (!configured() || tok() || localStorage.getItem('shetos_notrack') === '1') return;
      if (sessionStorage.getItem('shetos_adm_visit') === '1') return;
      sessionStorage.setItem('shetos_adm_visit', '1');
      visitP = api('POST', '/track/visit', { kind: 'visit', vid: vid(), lang: navigator.language || '', ref: document.referrer || '' }, false, true).catch(function () {});
    } catch (e) {}
  }
  function identify(name, contact) {
    try {
      if (!configured() || tok() || !name || contact === ADMIN_PHONE) return;
      visitP.then(function () { api('POST', '/track/visit', { kind: 'identify', vid: vid(), name: name, contact: contact || '' }, false, true).catch(function () {}); });
    } catch (e) {}
  }
  function logOrder(o) {
    try { if (configured() && !tok()) api('POST', '/track/order', o, false, true).catch(function () {}); } catch (e) {}
  }

  /* ---------- lock / unlock ---------- */
  function lock(expired) {
    sessionStorage.removeItem(TK);
    var f = document.getElementById('adm-fab'); if (f) f.remove();
    var d = document.getElementById('adm-dash'); if (d) d.remove();
    if (expired) alert('Admin session ended. Log in again.');
  }
  function showFab() {
    if (!tok() || document.getElementById('adm-fab')) return;
    document.body.appendChild(h('button', { id: 'adm-fab', class: 'adm-fab', type: 'button', text: '📊 Dashboard', onclick: openDash }));
  }

  /* ---------- dashboard ---------- */
  var data = null, tab = 'overview', query = '';
  var TABS = [['overview', 'Overview'], ['users', 'Users'], ['visitors', 'Visitors'], ['accounts', 'Accounts'], ['orders', 'Orders']];
  var fmt = function (t) { return t ? new Date(t).toLocaleString() : '-'; };

  function openDash() {
    if (document.getElementById('adm-dash')) return;
    var body = h('div', { class: 'adm-body' });
    var tabs = h('div', { class: 'adm-tabs' });
    var dash = h('div', { id: 'adm-dash', class: 'adm-dash' }, [
      h('div', { class: 'adm-head' }, [
        h('b', { text: 'Shetos Dashboard' }),
        h('div', { class: 'adm-row' }, [
          h('button', { class: 'adm-btn ghost', type: 'button', text: '↻ Refresh', onclick: load }),
          h('button', { class: 'adm-btn ghost', type: 'button', text: 'Close', onclick: function () { dash.remove(); } }),
          h('button', { class: 'adm-btn danger', type: 'button', text: '🔒 Lock', onclick: function () { lock(); } })
        ])
      ]), tabs, body
    ]);
    document.body.appendChild(dash);
    dash._body = body; dash._tabs = tabs;
    load();
  }

  function load() {
    var d = document.getElementById('adm-dash'); if (!d) return;
    d._body.textContent = 'Loading...';
    api('GET', '/admin/overview', null, true).then(function (r) {
      if (!r.ok) { if (r._status !== 401) d._body.textContent = 'Could not load data. Check the admin Worker.'; return; }
      data = r; render();
    }).catch(function () { d._body.textContent = 'Cannot reach the admin server.'; });
  }

  function render() {
    var d = document.getElementById('adm-dash'); if (!d || !data) return;
    d._tabs.textContent = '';
    TABS.forEach(function (t) {
      d._tabs.appendChild(h('button', { class: 'adm-tab' + (tab === t[0] ? ' on' : ''), type: 'button', text: t[1], onclick: function () { tab = t[0]; query = ''; render(); } }));
    });
    var b = d._body; b.textContent = '';
    if (tab === 'overview') return overview(b);
    var search = h('input', { class: 'adm-input', placeholder: 'Search...', value: query });
    search.addEventListener('input', function () { query = search.value; fill(); });
    var holder = h('div', { class: 'adm-scroll' });
    b.append(search, holder);
    function fill() { holder.textContent = ''; holder.appendChild(table()); }
    fill();
    if (query) { search.focus(); }
  }

  function overview(b) {
    var s = data.stats;
    var cards = document.querySelectorAll('#home-content-section .game-card');
    var items = [
      ['Visitors (unique)', s.visitors], ['Visitors today', s.visitorsToday], ['Total visits', s.totalVisits],
      ['Registered users', s.users], ['Accounts for sale', s.accounts], ['Game cards', cards.length],
      ['Orders', s.orders], ['Orders total (EGP)', s.revenue]
    ];
    b.appendChild(h('div', { class: 'adm-stats' }, items.map(function (i) {
      return h('div', { class: 'adm-stat' }, [h('strong', { text: String(i[1]) }), h('span', { text: i[0] })]);
    })));
    b.appendChild(h('p', { class: 'adm-note', text: 'Game cards on the site: ' + Array.prototype.map.call(cards, function (c) { return c.getAttribute('data-game-search-title') || ''; }).join(', ') }));
  }

  function match(o) {
    if (!query) return true;
    return JSON.stringify(o).toLowerCase().indexOf(query.toLowerCase()) >= 0;
  }
  function tbl(cols, rows) {
    var t = h('table', { class: 'adm-table' });
    t.appendChild(h('thead', {}, [h('tr', {}, cols.map(function (c) { return h('th', { text: c }); }))]));
    var tb = h('tbody'); rows.forEach(function (r) { tb.appendChild(r); }); t.appendChild(tb);
    if (!rows.length) return h('p', { class: 'adm-note', text: 'Nothing here yet.' });
    return t;
  }
  function row(cells) { return h('tr', {}, cells.map(function (c) { return h('td', {}, [c]); })); }
  function del(label, fn) { return h('button', { class: 'adm-btn danger sm', type: 'button', text: label || 'Delete', onclick: fn }); }
  function act(method, path, after) {
    api(method, path, null, true).then(function (r) { if (r.ok) { after && after(); load(); } else alert(r.error === 'protected' ? 'This account is protected.' : 'Action failed.'); });
  }

  function table() {
    var owners = {}; data.users.forEach(function (u) { owners[u.key] = u.name; });
    if (tab === 'users') {
      return tbl(['Name', 'Phone / Email', 'Joined', ''], data.users.filter(match).map(function (u) {
        return row([u.name || '-', u.phone || u.email || '-', fmt(u.createdAt), u.key === ADMIN_KEY ? 'Admin' :
          del('Delete user', function () {
            if (!confirm('Delete user "' + u.name + '"?')) return;
            var withAcc = confirm('Also delete the accounts this user listed for sale?\nOK = yes, Cancel = keep them');
            act('DELETE', '/admin/users/' + encodeURIComponent(u.key) + (withAcc ? '?accounts=1' : ''));
          })]);
      }));
    }
    if (tab === 'visitors') {
      return tbl(['Name', 'Contact', 'Visits', 'First', 'Last', 'Country', 'Lang', 'From', ''], data.visitors.filter(match).map(function (v) {
        return row([v.name || 'Guest', v.contact || '-', String(v.count || 0), fmt(v.first), fmt(v.last), v.country || '-', v.lang || '-', v.ref || '-',
          del('Delete', function () { if (confirm('Delete this visitor record?')) act('DELETE', '/admin/visitors/' + encodeURIComponent(v.vid)); })]);
      }));
    }
    if (tab === 'accounts') {
      return tbl(['Game', 'Price', 'Phone', 'Listed by', 'Created', ''], data.accounts.filter(match).map(function (a) {
        return row([a.game || '-', String(a.price || 0), a.phone || '-', owners[a.owner] || a.owner || '-', fmt(a.createdAt),
          h('div', { class: 'adm-row' }, [
            h('button', { class: 'adm-btn sm', type: 'button', text: 'Edit', onclick: function () { editAccount(a); } }),
            del('Delete', function () { if (confirm('Delete this account for sale?')) act('DELETE', '/admin/accounts/' + encodeURIComponent(a.id)); })
          ])]);
      }));
    }
    return tbl(['Time', 'Customer', 'Contact', 'Game', 'Item', 'Price', 'Player ID', ''], data.orders.filter(match).map(function (o) {
      return row([fmt(o.ts), o.customer || '-', o.contact || '-', o.game || '-', o.item || '-', String(o.price || 0), o.playerId || '-',
        del('Delete', function () { if (confirm('Delete this order record?')) act('DELETE', '/admin/orders/' + encodeURIComponent(o.id)); })]);
    }));
  }

  function editAccount(a) {
    var f = {
      game: h('input', { class: 'adm-input', value: a.game || '', placeholder: 'Game' }),
      price: h('input', { class: 'adm-input', type: 'number', value: a.price || 0, placeholder: 'Price' }),
      phone: h('input', { class: 'adm-input', value: a.phone || '', placeholder: 'Phone (01xxxxxxxxx)' }),
      info: h('textarea', { class: 'adm-input', rows: '4', placeholder: 'Details' })
    };
    f.info.value = a.info || '';
    var err = h('div', { class: 'adm-err' });
    var ov = h('div', { class: 'adm-overlay' });
    var save = h('button', { class: 'adm-btn', type: 'button', text: 'Save', onclick: function () {
      save.disabled = true;
      api('PATCH', '/admin/accounts/' + encodeURIComponent(a.id), { game: f.game.value, price: f.price.value, phone: f.phone.value, info: f.info.value }, true).then(function (r) {
        save.disabled = false;
        if (r.ok) { ov.remove(); load(); } else err.textContent = r.error === 'phone' ? 'Phone must start with 01 and be 11 digits.' : 'Could not save.';
      });
    } });
    ov.appendChild(h('div', { class: 'adm-gate' }, [h('h3', { text: 'Edit account' }), f.game, f.price, f.phone, f.info, err,
      h('div', { class: 'adm-row' }, [h('button', { class: 'adm-btn ghost', type: 'button', text: 'Cancel', onclick: function () { ov.remove(); } }), save])]));
    document.body.appendChild(ov);
  }

  /* ---------- public API used by script.js ---------- */
  window.ShetosAdmin = {
    isAdminPhone: function (p) { return String(p) === ADMIN_PHONE; },
    needsPassword: function (key) { return key === ADMIN_KEY && !tok(); },
    hasToken: function () { return !!tok(); },
    gate: gate, lock: function () { lock(); }, identify: identify, logOrder: logOrder,
    deleteAccount: function (id) { return api('DELETE', '/admin/accounts/' + encodeURIComponent(id), null, true); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    showFab();
    trackVisit();
    var u = localStorage.getItem('shetos_username');
    if (u) identify(u, localStorage.getItem('shetos_phone') || localStorage.getItem('shetos_email') || '');
  });
})();
