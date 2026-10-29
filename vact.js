/* V-ACT Add-ons: đồng hồ giờ Việt Nam · điểm danh theo ngày · thư viện tài liệu lật trang */
(() => {
  'use strict';
  const TZ = 'Asia/Ho_Chi_Minh';
  const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const me = () => jget('vact_current_user', null);
  const isAdmin = () => me()?.role === 'admin';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Thời gian: múi giờ VN, hiệu chỉnh theo header Date của server ---------- */
  let offset = 0;
  fetch(location.href, { method: 'HEAD', cache: 'no-store' })
    .then(r => { const d = r.headers.get('date'); if (d) offset = new Date(d).getTime() - Date.now(); })
    .catch(() => {});
  const now = () => new Date(Date.now() + offset);
  const dayKey = t => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(t); // YYYY-MM-DD
  const lastDays = n => Array.from({ length: n }, (_, i) => dayKey(new Date(now().getTime() - (n - 1 - i) * 864e5)));
  const fTime = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const fDate = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  /* ---------- Giao diện ---------- */
  const style = document.createElement('style');
  style.textContent = `
  .va-clock{position:fixed;right:14px;bottom:14px;z-index:9990;padding:10px 16px;border-radius:18px;background:linear-gradient(135deg,#0f172a ,#1e293b);border:1px solid rgba(251,191,36,.45);box-shadow:0 10px 30px rgba(0,0,0,.5),0 0 22px rgba(251,191,36,.12);color:#e2e8f0;font-family:'Be Vietnam Pro',system-ui,sans-serif;text-align:center;min-width:150px}
  .va-clock b{display:block;font:600 26px/1.1 'JetBrains Mono',monospace;color:#fbbf24;letter-spacing:1px}
  .va-clock small{display:block;font-size:11px;color:#94a3b8;margin-top:3px;text-transform:capitalize}
  .va-clock i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#34d399;margin-right:6px;animation:vap 1.4s infinite}
  @keyframes vap{50%{opacity:.25}}
  .va-dock{position:fixed;left:14px;bottom:14px;z-index:9990;display:flex;gap:8px;flex-wrap:wrap}
  .va-btn{cursor:pointer;border:1px solid rgba(251,191,36,.45);background:#0f172a;color:#fbbf24;padding:9px 14px;border-radius:14px;font:700 12px 'Be Vietnam Pro',sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.4)}
  .va-btn:hover{background:#1e293b}.va-btn.p{background:#f59e0b;color:#0f172a}
  .va-ov{position:fixed;inset:0;z-index:9995;background:rgba(2,6,23,.88);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:14px}
  .va-box{width:100%;max-width:880px;max-height:92vh;overflow:auto;background:#0f172a;border:1px solid #334155;border-radius:24px;padding:22px;color:#e2e8f0;font-family:'Be Vietnam Pro',sans-serif}
  .va-box h2{margin:0 0 4px;font-size:20px;color:#fff}.va-box p{margin:0 0 14px;font-size:12px;color:#94a3b8}
  .va-x{float:right;cursor:pointer;background:#1e293b;border:0;color:#cbd5e1;border-radius:10px;padding:6px 10px}
  .va-tbl{width:100%;border-collapse:collapse;font-size:12px}.va-tbl th,.va-tbl td{padding:8px 6px;border-bottom:1px solid #1e293b;text-align:center}.va-tbl td:first-child,.va-tbl th:first-child{text-align:left}
  .va-ok{color:#34d399;font-weight:700}.va-no{color:#475569}.va-bad{color:#fb7185;font-weight:700}
  .va-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin:12px 0}
  .va-day{padding:10px 4px;border-radius:12px;background:#1e293b;text-align:center;font-size:11px;color:#94a3b8}.va-day.on{background:rgba(52,211,153,.15);border:1px solid #34d399;color:#6ee7b7}.va-day b{display:block;font-size:15px;color:inherit}
  .va-stat{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}.va-stat div{flex:1;min-width:120px;padding:12px;border-radius:14px;background:#1e293b;font-size:11px;color:#94a3b8}.va-stat b{display:block;font-size:22px;color:#fbbf24}
  .va-doc{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:#1e293b;margin-bottom:8px;font-size:13px}.va-doc span{flex:1;word-break:break-word}.va-doc em{font-size:11px;color:#94a3b8;display:block;font-style:normal}
  .va-book{display:flex;justify-content:center;padding:10px 0;min-height:300px}
  .va-pg{background:#fff;overflow:hidden}.va-pg img{width:100%;height:100%;object-fit:contain;display:block}
  .va-nav{display:flex;gap:10px;align-items:center;justify-content:center;margin-top:10px;font-size:12px}
  .va-ov.full .va-box{max-width:1100px}`;
  document.head.appendChild(style);

  const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
  function modal(title, sub, body, cls = '') {
    const ov = el(`<div class="va-ov ${cls}"><div class="va-box"><button class="va-x">✕</button><h2>${title}</h2><p>${sub}</p><div class="va-body"></div></div></div>`);
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); ov._onClose?.(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    ov.querySelector('.va-x').onclick = close;
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    document.addEventListener('keydown', onKey);
    const b = ov.querySelector('.va-body'); typeof body === 'string' ? (b.innerHTML = body) : b.appendChild(body);
    document.body.appendChild(ov); return ov;
  }

  /* ---------- Đồng hồ ---------- */
  const clock = el(`<div class="va-clock"><b>--:--:--</b><small><i></i>Giờ Việt Nam (GMT+7)</small><small class="d"></small></div>`);
  const dock = el(`<div class="va-dock"><button class="va-btn p" data-a="docs">📚 Tài liệu</button><button class="va-btn" data-a="att">📅 Điểm danh</button></div>`);
  document.body.append(clock, dock);
  let lastT = '';
  setInterval(() => {
    const t = fTime.format(now());
    if (t !== lastT) { lastT = t; clock.querySelector('b').textContent = t; clock.querySelector('.d').textContent = fDate.format(now()); }
    dock.style.display = me() ? 'flex' : 'none';
  }, 200);
  dock.onclick = e => { const a = e.target.dataset.a; if (a === 'att') openAttendance(); if (a === 'docs') openDocs(); };

  /* ---------- Điểm danh ---------- */
  function collect() {
    const att = jget('vact_attempts_db', []);
    const raw = jget('vact_users_db', []);
    const users = new Map((Array.isArray(raw) ? raw : Object.values(raw || {})).filter(u => u && u.role !== 'admin').map(u => [u.id, u]));
    const by = {};
    att.forEach(a => {
      const d = dayKey(new Date(a.submittedAt));
      ((by[a.userId] ??= {})[d] ??= 0); by[a.userId][d]++;
      if (!users.has(a.userId)) users.set(a.userId, { id: a.userId, name: a.userName, email: a.userEmail });
    });
    return { by, users: [...users.values()] };
  }
  function streak(days) {
    const keys = lastDays(400).reverse(); let i = days[keys[0]] ? 0 : 1, n = 0;
    while (days[keys[i]]) { n++; i++; } return n;
  }
  function openAttendance() {
    const { by, users } = collect(); const today = dayKey(now()); const u = me();
    if (isAdmin()) {
      const w = lastDays(7), done = users.filter(x => by[x.id]?.[today]);
      const total = users.reduce((s, x) => s + (by[x.id]?.[today] || 0), 0);
      const missing = users.filter(x => !by[x.id]?.[today]).map(x => x.name);
      const rows = users.map(x => `<tr><td>${esc(x.name)}<br><small class="va-no">${esc(x.email || '')}</small></td>${w.map(d => by[x.id]?.[d] ? `<td class="va-ok">✓ ${by[x.id][d]}</td>` : `<td class="va-no">–</td>`).join('')}<td>${streak(by[x.id] || {})} ngày</td></tr>`).join('');
      const ov = modal('📅 Điểm danh toàn bộ thí sinh', `Hôm nay ${fDate.format(now())} · làm ≥1 đề trong ngày = đã điểm danh`,
        `<div class="va-stat"><div><b>${done.length}/${users.length}</b>đã điểm danh hôm nay</div><div><b>${total}</b>bài đã làm hôm nay</div><div><b class="va-bad">${missing.length}</b>chưa điểm danh</div></div>
         <div style="overflow:auto"><table class="va-tbl"><tr><th>Thí sinh</th>${w.map(d => `<th>${d.slice(8)}/${d.slice(5, 7)}</th>`).join('')}<th>Chuỗi</th></tr>${rows || '<tr><td colspan="9" class="va-no">Chưa có thí sinh/lượt làm bài.</td></tr>'}</table></div>
         <p style="margin-top:12px"><button class="va-btn p" id="va-copy">📋 Sao chép danh sách cần nhắc nhở</button></p>`);
      ov.querySelector('#va-copy').onclick = e => { navigator.clipboard?.writeText(`Nhắc học hôm nay (${today}):\n` + missing.map(n => '• ' + n).join('\n')); e.target.textContent = '✓ Đã sao chép'; };
    } else {
      const mine = by[u.id] || {}, days = lastDays(14), n = mine[today] || 0;
      modal('📅 Điểm danh của bạn', `${esc(u.name)} · ${fDate.format(now())}`,
        `<div class="va-stat"><div><b class="${n ? 'va-ok' : 'va-bad'}">${n ? '✓ Đã điểm danh' : 'Chưa điểm danh'}</b>hôm nay</div><div><b>${n}</b>bài đã làm hôm nay</div><div><b>${streak(mine)}</b>ngày liên tiếp</div></div>
         <div class="va-grid">${days.map(d => `<div class="va-day ${mine[d] ? 'on' : ''}">${d.slice(8)}/${d.slice(5, 7)}<b>${mine[d] ? '✓ ' + mine[d] : '–'}</b></div>`).join('')}</div>
         <p>${n ? 'Tuyệt vời, tiếp tục giữ nhịp học nhé!' : 'Làm ít nhất 1 đề hôm nay để được điểm danh.'}</p>`);
    }
  }

  /* ---------- Thư viện tài liệu (IndexedDB) ---------- */
  const db = () => new Promise((res, rej) => { const r = indexedDB.open('vact_docs', 1); r.onupgradeneeded = () => r.result.createObjectStore('docs', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('docs', mode), q = fn(t.objectStore('docs')); t.oncomplete = () => res(q?.result); t.onerror = () => rej(t.error); }); };
  const loaded = {};
  const load = src => loaded[src] || (loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Không tải được ' + src)); document.head.appendChild(s); }));
  const size = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.ceil(b / 1024) + ' KB';
  const readable = d => /pdf|^image\//.test(d.type) || /\.pdf$/i.test(d.name);

  async function openDocs() {
    const docs = ((await tx('readonly', s => s.getAll())) || []).sort((a, b) => b.addedAt - a.addedAt);
    const admin = isAdmin();
    const ov = modal('📚 Thư viện tài liệu', 'Sách, ebook, lý thuyết — đọc trực tiếp như sách thật hoặc tải về',
      `${admin ? `<p><label class="va-btn p" style="display:inline-block">⬆ Tải tài liệu lên<input id="va-up" type="file" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.epub,.txt"></label></p>` : ''}
       ${docs.map(d => `<div class="va-doc"><span>📖 ${esc(d.name)}<em>${size(d.size)} · ${new Date(d.addedAt).toLocaleDateString('vi-VN', { timeZone: TZ })}</em></span>${readable(d) ? `<button class="va-btn p" data-r="${d.id}">Đọc</button>` : ''}<button class="va-btn" data-d="${d.id}">Tải về</button>${admin ? `<button class="va-btn" data-x="${d.id}">Xóa</button>` : ''}</div>`).join('') || '<p>Chưa có tài liệu nào.</p>'}`);
    ov.querySelector('#va-up')?.addEventListener('change', async e => {
      for (const f of e.target.files) await tx('readwrite', s => s.put({ id: crypto.randomUUID(), name: f.name, type: f.type, size: f.size, addedAt: Date.now(), blob: f }));
      ov.remove(); openDocs();
    });
    ov.onclick = async e => {
      const t = e.target, get = id => docs.find(d => d.id === id);
      if (t.dataset.r) { ov.remove(); readBook(get(t.dataset.r)); }
      if (t.dataset.d) { const d = get(t.dataset.d), a = document.createElement('a'); a.href = URL.createObjectURL(d.blob); a.download = d.name; a.click(); }
      if (t.dataset.x && confirm('Xóa tài liệu này?')) { await tx('readwrite', s => s.delete(t.dataset.x)); ov.remove(); openDocs(); }
    };
  }

  async function readBook(d) {
    const host = el('<div><div class="va-book"></div><div class="va-nav"><button class="va-btn" id="p">◀</button><span id="c">Đang chuẩn bị…</span><button class="va-btn" id="n">▶</button></div></div>');
    const ov = modal('📖 ' + esc(d.name), 'Kéo góc trang, bấm ◀ ▶ hoặc dùng phím mũi tên để lật', host, 'full');
    const status = host.querySelector('#c'), imgs = [];
    try {
      if (d.type.startsWith('image/')) imgs.push(URL.createObjectURL(d.blob));
      else {
        await load('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: await d.blob.arrayBuffer() }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          if (!ov.isConnected) return;
          status.textContent = `Đang dựng trang ${i}/${pdf.numPages}…`;
          const pg = await pdf.getPage(i), vp = pg.getViewport({ scale: 1.4 }), cv = document.createElement('canvas');
          cv.width = vp.width; cv.height = vp.height;
          await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
          imgs.push(cv.toDataURL('image/jpeg', .82));
        }
      }
      await load('https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js');
      const probe = new Image(); probe.src = imgs[0]; await probe.decode();
      const ratio = probe.naturalHeight / probe.naturalWidth, w = Math.min(460, Math.floor((innerWidth - 60) / (innerWidth > 800 ? 2 : 1)));
      const holder = host.querySelector('.va-book'), pf = new St.PageFlip(holder, { width: w, height: Math.round(w * ratio), size: 'fixed', showCover: true, maxShadowOpacity: .55, flippingTime: 800, usePortrait: true, mobileScrollSupport: false });
      pf.loadFromImages(imgs);
      const upd = () => status.textContent = `Trang ${pf.getCurrentPageIndex() + 1} / ${pf.getPageCount()}`; upd();
      pf.on('flip', upd);
      host.querySelector('#p').onclick = () => pf.flipPrev(); host.querySelector('#n').onclick = () => pf.flipNext();
      const key = e => { if (e.key === 'ArrowLeft') pf.flipPrev(); if (e.key === 'ArrowRight') pf.flipNext(); };
      document.addEventListener('keydown', key); ov._onClose = () => { document.removeEventListener('keydown', key); try { pf.destroy(); } catch {} };
    } catch (err) { status.textContent = 'Không mở được tài liệu: ' + err.message; }
  }
})();
