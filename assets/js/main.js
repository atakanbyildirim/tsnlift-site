/* TSN LİFT — site davranışları
   Telefon / e-posta değişirse yalnızca aşağıdaki AYARLAR bloğunu güncelleyin. */
const AYARLAR = {
  whatsapp: '905395267903',          // başında + olmadan, ülke koduyla
  eposta: 'tsnlift.54@gmail.com',
  // Çalışma saatleri (0 = Pazar ... 6 = Cumartesi). null = kapalı.
  saatler: {0: null, 1: [8, 19], 2: [8, 19], 3: [8, 19], 4: [8, 19], 5: [8, 19], 6: [8, 19]}
};

/* ---------- yardımcılar ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function copyText(text, btn) {
  const done = () => {
    const o = btn.textContent;
    btn.textContent = 'Kopyalandı';
    btn.classList.add('done');
    setTimeout(() => { btn.textContent = o; btn.classList.remove('done'); }, 1600);
  };
  const fallback = () => {
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    t.remove();
  };
  try { navigator.clipboard.writeText(text).then(done).catch(fallback); } catch (e) { fallback(); }
}

/* ---------- yıl ---------- */
$$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

/* ---------- mobil menü ---------- */
const drawer = $('#drawer');
const menuBtn = $('#menu-btn');
function setDrawer(open) {
  if (!drawer) return;
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  menuBtn && menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) { const f = $('nav a', drawer); f && f.focus(); } else { menuBtn && menuBtn.focus(); }
}
menuBtn && menuBtn.addEventListener('click', () => setDrawer(true));
$$('[data-close]').forEach(el => el.addEventListener('click', () => setDrawer(false)));
drawer && $$('a', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) setDrawer(false); });

/* ---------- açık / kapalı durumu (İstanbul saatiyle) ---------- */
(function status() {
  let day, hour, minute;
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Istanbul', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(new Date());
    const get = t => (parts.find(p => p.type === t) || {}).value;
    day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    hour = parseInt(get('hour'), 10); minute = parseInt(get('minute'), 10);
  } catch (e) { const d = new Date(); day = d.getDay(); hour = d.getHours(); minute = d.getMinutes(); }
  const now = hour + minute / 60;
  const today = AYARLAR.saatler[day];
  const open = !!today && now >= today[0] && now < today[1];
  let text;
  if (open) text = `Şu an açığız · ${String(today[1]).padStart(2, '0')}:00'a kadar`;
  else {
    let d = day, label = '';
    for (let i = 0; i < 8; i++) {
      const h = AYARLAR.saatler[d];
      if (h && (i > 0 || now < h[0])) { label = i === 0 ? 'bugün' : i === 1 ? 'yarın' : ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][d]; text = `Şu an kapalı · ${label} ${String(h[0]).padStart(2, '0')}:00'da açılır`; break; }
      d = (d + 1) % 7;
    }
    text = text || 'Şu an kapalı';
  }
  $$('.status').forEach(el => { el.textContent = text; el.classList.add(open ? 'open' : 'closed'); });
  $$('[data-day]').forEach(tr => { if (tr.dataset.day.split(',').map(Number).includes(day)) tr.classList.add('today'); });
})();

/* ---------- kopyala düğmeleri ---------- */
$$('button.mini[data-copy]').forEach(b => b.addEventListener('click', () => copyText(b.dataset.copy, b)));

/* ---------- servis talebi formu ---------- */
const form = $('#servis-form');
if (form) {
  const sub = $('#form-sub');
  const subText = sub.textContent;
  // hizmetler sayfasından gelindiyse (iletisim.html?hizmet=...) hizmeti önceden seç
  const pre = new URLSearchParams(location.search).get('hizmet');
  if (pre) { const o = [...form.elements.hizmet.options].find(x => x.value === pre); if (o) o.selected = true; }
  const v = id => (form.elements[id] ? String(form.elements[id].value).trim() : '');
  const build = () => [
    'Merhaba TSN Lift, servis talebim var:',
    `Ad / Firma: ${v('ad')}`,
    `Telefon: ${v('tel')}`,
    `Marka / Model: ${v('marka') || '-'}`,
    `Makine tipi: ${v('tip')}`,
    `Hizmet: ${v('hizmet')}`,
    `Aciliyet: ${v('aciliyet') || '-'}`,
    `İlçe / Adres: ${v('ilce') || '-'}`,
    `Açıklama: ${v('mesaj') || '-'}`
  ].join('\n');
  const validate = () => {
    const missing = ['ad', 'tel'].filter(id => !v(id));
    ['ad', 'tel'].forEach(id => form.elements[id].setAttribute('aria-invalid', missing.includes(id) ? 'true' : 'false'));
    if (missing.length) {
      sub.textContent = 'Ad ve telefon alanlarını doldurun; size geri dönebilmemiz için gerekli.';
      sub.classList.add('err');
      form.elements[missing[0]].focus();
      return false;
    }
    sub.textContent = subText; sub.classList.remove('err');
    return true;
  };
  const show = msg => {
    $('#out-text').textContent = msg;
    $('#wa-link').href = `https://wa.me/${AYARLAR.whatsapp}?text=${encodeURIComponent(msg)}`;
    $('#out').hidden = false;
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    const msg = build();
    show(msg);
    window.open(`https://wa.me/${AYARLAR.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
  $('#mail-btn').addEventListener('click', () => {
    if (!validate()) return;
    const msg = build();
    show(msg);
    location.href = `mailto:${AYARLAR.eposta}?subject=${encodeURIComponent('Servis talebi - ' + v('ad'))}&body=${encodeURIComponent(msg)}`;
  });
  $('#copy-msg').addEventListener('click', e => copyText($('#out-text').textContent, e.currentTarget));
}

/* ---------- çalışmalar filtresi ---------- */
const filters = $('.filters');
if (filters) {
  filters.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', filters).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    const f = b.dataset.filter;
    $$('.work').forEach(w => { w.hidden = f !== 'hepsi' && !w.dataset.cat.split(' ').includes(f); });
  });
}

/* ---------- fotoğraf galerisi (assets/js/galeri.js içinden) ---------- */
const gal = $('#galeri');
if (gal) {
  const list = Array.isArray(window.TSN_GALERI) ? window.TSN_GALERI.filter(x => x && x.foto) : [];
  if (list.length) {
    gal.innerHTML = '';
    list.forEach(item => {
      const fig = document.createElement('figure');
      const img = document.createElement('img');
      img.src = item.foto; img.alt = item.baslik || 'TSN Lift servis çalışması'; img.loading = 'lazy';
      fig.appendChild(img);
      if (item.baslik) { const c = document.createElement('figcaption'); c.textContent = item.baslik; fig.appendChild(c); }
      gal.appendChild(fig);
    });
    $('#galeri-blok') && ($('#galeri-blok').hidden = false);
  }
}

/* ---------- hizmetler alt menüsü: görünen bölümü işaretle ---------- */
const subnav = $('.subnav');
if (subnav && 'IntersectionObserver' in window) {
  const links = $$('a', subnav);
  const bar = $('.wrap', subnav);
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => {
        const on = a.getAttribute('href') === '#' + en.target.id;
        a.classList.toggle('on', on);
        // yalnızca alt menü şeridini yatay kaydır; sayfanın kendisine dokunma
        if (on && bar.scrollWidth > bar.clientWidth) bar.scrollLeft += a.getBoundingClientRect().left - bar.getBoundingClientRect().left - (bar.clientWidth - a.offsetWidth) / 2;
      });
    });
  }, {rootMargin: '-45% 0px -50% 0px'});
  links.forEach(a => { const s = $(a.getAttribute('href')); s && io.observe(s); });
}

/* ---------- yukarı çık ---------- */
const totop = $('.totop');
if (totop) {
  addEventListener('scroll', () => totop.classList.toggle('show', scrollY > 900), {passive: true});
  totop.addEventListener('click', () => scrollTo({top: 0, behavior: 'smooth'}));
}
