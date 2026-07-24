// Wspólny silnik map wycieczkowych (UK 2026)
const C = { food:'#e67f7f', attr:'#7fb4e6', shop:'#a67fe6', hist:'#7fe6a5', hike:'#111111', bike:'#ff9440' };

const IMGB = 'https://i0.wp.com/handluggageonly.co.uk/wp-content/uploads/';

const CMB = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';

function showIG(url) {
  let p = document.getElementById('igPanel');
  if (!p) {
    p = document.createElement('div');
    p.id = 'igPanel';
    p.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;background:#1a2027;border:1px solid #444;border-radius:12px;padding:8px;box-shadow:0 8px 30px rgba(0,0,0,.6)';
    p.innerHTML = '<div style="text-align:right;margin-bottom:4px"><a href="#" onclick="document.getElementById(\'igPanel\').remove();return false" style="color:#9aa4af;font-size:1.1em;text-decoration:none">&#10005;</a></div><iframe id="igFrame" style="width:min(320px,calc(100vw - 60px));height:430px;border:0;border-radius:8px;background:#fff"></iframe>';
    document.body.appendChild(p);
  }
  document.getElementById('igFrame').src = url + 'embed/';
}

let uid = 0;

const REG = [];
const IMGREG = {};

const PH = '<div class="ph" style="width:220px;height:150px;background:#222;border-radius:8px;margin-top:6px;color:#666;font-size:.8em;display:flex;align-items:center;justify-content:center">ładowanie zdjęcia…</div>';

const THUMB_CACHE = {};

async function resolveThumb(wiki, qname, lat, lng) {
  const key = (wiki || '') + '|' + qname;
  if (key in THUMB_CACHE) return THUMB_CACHE[key];
  let url = null;
  try {
    if (wiki) {
      const d = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + wiki).then(r => r.json());
      url = d.thumbnail ? d.thumbnail.source : null;
    }
    if (!url) {
      const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=' + encodeURIComponent('filetype:bitmap ' + qname) + '&gsrlimit=1&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=400';
      const d = await fetch(u).then(r => r.json());
      const p = d.query && Object.values(d.query.pages)[0];
      url = (p && p.imageinfo && p.imageinfo[0].thumburl) || null;
    }
    if (!url && lat && lng) {
      for (const rad of [500, 2000]) {
        const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=geosearch&ggscoord=' + lat + '%7C' + lng + '&ggsradius=' + rad + '&ggslimit=1&ggsnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=400';
        const d = await fetch(u).then(r => r.json());
        const p = d.query && Object.values(d.query.pages)[0];
        url = (p && p.imageinfo && p.imageinfo[0].thumburl) || null;
        if (url) break;
      }
    }
  } catch(e) {}
  THUMB_CACHE[key] = url;
  return url;
}

function wikiThumb(marker, html, wiki, qname, lat, lng) {
  marker.on('popupopen', function() {
    const self = this;
    if (self._thumbDone) return;
    self._thumbDone = true;
    resolveThumb(wiki, qname, lat, lng).then(t => {
      const rep = t ? '<div style="width:220px;height:150px;border-radius:8px;margin-top:6px;overflow:hidden"><img src="'+t+'" style="width:100%;height:100%;object-fit:cover"></div>' : '';
      self.setPopupContent(html.replace(PH, rep));
    });
  });
}

function linkRow(name, region, wiki, igCode) {
  const short = name.split('—')[0].split('(')[0].split('+')[0].trim();
  const q = encodeURIComponent(short + ' ' + region);
  let links = [
    '<a href="https://www.google.com/maps/search/?api=1&query='+q+'" target="_blank" style="color:#7fe6a5">Mapy &#8599;</a>',
    '<a href="https://duckduckgo.com/?q=%21ducky+'+q+'" target="_blank" style="color:#e8b07f">WWW &#8599;</a>',
    '<a href="https://www.google.com/search?tbm=isch&q='+q+'" target="_blank" style="color:#e8b07f">📷 Grafika &#8599;</a>'
  ];
  if (wiki) links.push('<a href="https://en.wikipedia.org/wiki/'+wiki+'" target="_blank" style="color:#7fb4e6">Wiki &#8599;</a>');
  if (igCode) {
    const url = 'https://www.instagram.com/p/'+igCode+'/';
    links.push('<a href="'+url+'" target="_blank" style="color:#7fb4e6">Instagram &#8599;</a>');
    links.push('<a href="#" style="color:#e6c97f" onclick="showIG(\''+url+'\');return false">&#9654; podgląd</a>');
  } else {
    links.push('<a href="https://www.instagram.com/explore/search/keyword/?q='+encodeURIComponent(short)+'" target="_blank" style="color:#7fb4e6">IG szukaj &#8599;</a>');
  }
  return '<br>' + links.join(' &nbsp;');
}

function mk(map, lat, lng, name, info, cat, img, wikiInline, region) {
  const wiki = wikiInline || (window.SITE && SITE.wiki && SITE.wiki[name]) || null;
  const ig = (window.SITE && SITE.ig && SITE.ig[name]) || null;
  region = region || (window.SITE && SITE.defreg) || 'UK';
  IMGREG[name] = {img: img || null, wiki: wiki, lat: lat, lng: lng};
  let html = '<b>'+name+'</b><br>'+info;
  if (img) html += '<br><img src="'+IMGB+img+'?w=400" style="width:220px;border-radius:8px;margin-top:6px" loading="lazy"><br><span style="font-size:.75em;color:#888">fot. Hand Luggage Only</span>';
  else html += PH;
  html += linkRow(name, region, wiki, ig);
  const m = L.circleMarker([lat,lng], {radius:7, color:C[cat], fillColor:C[cat], fillOpacity:.85, weight:2})
   .addTo(map).bindPopup(html, {maxWidth: 300});
  REG.push({map: map, m: m, cat: cat, txt: (name + ' ' + info).toLowerCase(), rated: /\d[\.,]\d\s*(★|g\b|ta\b|rg\b)|★|#\d+ ta/i.test(info)});
  m.on('mouseover', function(){ this.openPopup(); });
  if (!img) wikiThumb(m, html, wiki, name.split('—')[0].split('(')[0].split('+')[0].trim() + ' ' + region, lat, lng);
}

function stops(map, list, cls, region) {
  return L.layerGroup(list.map((p, i) => {
    const [lat, lng, name, info, wiki, ig, cimg] = p;
    const icon = L.divIcon({className:'', html:'<div class="rnum '+cls+'">'+(i+1)+'</div>', iconSize:[22,22], iconAnchor:[11,11]});
    let html = '<b>'+(i+1)+'. '+name+'</b>' + (info ? '<br>'+info : '');
    if (cimg) html += '<div style="width:220px;height:150px;border-radius:8px;margin-top:6px;overflow:hidden"><img src="'+CMB+cimg+'" style="width:100%;height:100%;object-fit:cover"></div><span style="font-size:.72em;color:#888">fot. Wikimedia Commons</span>';
    else html += PH;
    html += linkRow(name, region, wiki, ig);
    const m = L.marker([lat, lng], {icon, zIndexOffset:1000}).bindPopup(html, {maxWidth:280});
    m.on('mouseover', function(){ this.openPopup(); });
    if (!cimg) wikiThumb(m, html, wiki, name.split('—')[0].split('(')[0].split('+')[0].trim() + ' ' + region, lat, lng);
    return m;
  }));
}

function showTab(n) {
  for (let i = 1; i <= 6; i++) {
    const t = document.getElementById('tab'+i), b = document.getElementById('tb'+i);
    if (!t || !b) continue;
    t.style.display = (n === i) ? '' : 'none';
    b.classList.toggle('on', n === i);
  }
  setTimeout(() => { (window._maps || []).forEach(m => m.invalidateSize()); }, 60);
}
window._maps = [];
function regMap(m) { window._maps.push(m); return m; }

const CAT_LABELS = { food:'🍽 jedzenie', attr:'🏰 atrakcje', shop:'🛍 sklepy', hist:'🏯 zamki/historia', hike:'🥾 trasy piesze', bike:'🚲 rowery' };
function initFilters() {
  const cats = [...new Set(REG.map(r => r.cat))].filter(c => CAT_LABELS[c]);
  let html = '<b style="color:var(--gold)">Filtry:</b>';
  cats.forEach(c => { html += ' <label><input type="checkbox" class="fc" data-role="'+c+'" checked onchange="syncChk(this)"> '+CAT_LABELS[c]+'</label>'; });
  html += ' <span style="color:#444">|</span>';
  const btn = (mode, label) => ' <button class="fbtn" data-mode="'+mode+'" onclick="setMode(\''+mode+'\')" style="background:#2a3440;color:#e8e6e3;border:1px solid #444;border-radius:6px;padding:4px 10px;cursor:pointer">'+label+'</button>';
  html += btn('all','wszystko') + btn('rated','⭐ tylko z oceną');
  ((window.SITE && SITE.modes) || []).forEach(md => { html += btn(md.id, md.label); });
  html += ' <input type="search" class="fc" data-role="q" placeholder="szukaj…" oninput="syncQ(this)" style="background:#101418;color:#e8e6e3;border:1px solid #444;border-radius:6px;padding:4px 10px;min-width:160px">';
  document.querySelectorAll('.fbar').forEach(el => {
    el.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;background:#1a2027;border:1px solid #333;border-radius:10px;padding:10px 14px;margin-bottom:8px;font-size:.9em';
    el.innerHTML = html;
  });
}
function syncChk(el) { document.querySelectorAll('.fc[data-role="'+el.dataset.role+'"]').forEach(x => x.checked = el.checked); applyFilter(); }
function syncQ(el) { document.querySelectorAll('.fc[data-role="q"]').forEach(x => { if (x !== el) x.value = el.value; }); applyFilter(); }
function fOn(role) { const el = document.querySelector('.fc[data-role="'+role+'"]'); return el ? el.checked : true; }
window.__mode = 'all';
function setMode(mode) {
  window.__mode = mode;
  document.querySelectorAll('.fbtn').forEach(b => {
    b.style.background = (b.dataset.mode === mode) ? '#e6c97f' : '#2a3440';
    b.style.color = (b.dataset.mode === mode) ? '#101418' : '#e8e6e3';
  });
  applyFilter();
}
function applyFilter() {
  const qe = document.querySelector('.fc[data-role="q"]');
  const q = (qe && qe.value || '').toLowerCase().trim();
  const special = ((window.SITE && SITE.modes) || []).find(md => md.id === window.__mode);
  REG.forEach(r => {
    let show = fOn(r.cat);
    if (window.__mode === 'rated' && !r.rated) show = false;
    if (special && !new RegExp(special.re).test(r.txt)) show = false;
    if (q && !r.txt.includes(q)) show = false;
    if (show) { if (!r.map.hasLayer(r.m)) r.m.addTo(r.map); }
    else { if (r.map.hasLayer(r.m)) r.map.removeLayer(r.m); }
  });
}

function decorateTables() {
  const keys = Object.keys(IMGREG);
  const queue = [];
  document.querySelectorAll('td b').forEach(b => {
    const t = b.textContent.trim();
    if (t.length < 3) return;
    let k = IMGREG[t] ? t : keys.find(k2 => {
      const a = k2.toLowerCase(), c = t.toLowerCase();
      return a.startsWith(c.slice(0, 14)) || c.startsWith(a.slice(0, 14));
    });
    if (!k) return;
    const e = IMGREG[k];
    const td = b.closest('td');
    if (!td || td.querySelector('img') || td.querySelector('.thumbox')) return;
    if (e.img) {
      const im = document.createElement('img');
      im.style.cssText = 'width:96px;height:64px;object-fit:cover;border-radius:6px;float:left;margin:2px 10px 4px 0';
      im.loading = 'lazy';
      if (/^https?:/.test(e.img)) { im.src = e.img; im.dataset.big = e.img; }
      else im.src = IMGB + e.img + '?w=200';
      td.prepend(im);
    } else {
      const ph = document.createElement('div');
      ph.className = 'thumbox';
      ph.style.cssText = 'width:96px;height:64px;border-radius:6px;float:left;margin:2px 10px 4px 0;background:#222;color:#666;font-size:.7em;display:flex;align-items:center;justify-content:center';
      ph.textContent = 'ładowanie…';
      td.prepend(ph);
      queue.push([ph, e, k.split('—')[0].split('(')[0].split('+')[0].trim()]);
    }
  });
  (async () => {
    for (const [ph, e, nm] of queue) {
      const t = await resolveThumb(e.wiki, nm + ' ' + ((window.SITE && SITE.defreg) || "UK"), e.lat, e.lng);
      if (t) ph.innerHTML = '<img src="'+t+'" style="width:100%;height:100%;object-fit:cover;border-radius:6px">';
      else ph.textContent = 'brak zdjęcia';
      await new Promise(r => setTimeout(r, 60));
    }
  })();
}

// ===== DUŻY PODGLĄD ZDJĘCIA (desktop: hover, dotyk: tap) =====
function bigThumb(u) { return u.replace(/\/(\d+)px-/, '/960px-').replace('?w=200','?w=900').replace('?w=400','?w=900'); }
const COARSE = matchMedia('(pointer: coarse)').matches;
if (!COARSE) {
  const tip = document.createElement('div');
  tip.style.cssText = 'position:fixed;display:none;z-index:10000;pointer-events:none;border:2px solid #444;border-radius:10px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.7);background:#111';
  const tipLabel = document.createElement('div');
  tipLabel.style.cssText = 'width:260px;height:120px;display:flex;align-items:center;justify-content:center;color:#888;font-size:.9em';
  tipLabel.textContent = 'ładowanie…';
  const tipImg = document.createElement('img');
  tipImg.style.cssText = 'display:none;max-width:480px;max-height:380px';
  tip.appendChild(tipLabel); tip.appendChild(tipImg);
  document.body.appendChild(tip);
  function placeTip(e) {
    const pad = 18;
    let x = e.clientX + pad, y = e.clientY + pad;
    const w = tip.offsetWidth || 480, h = tip.offsetHeight || 380;
    if (x + w > innerWidth - 8) x = e.clientX - w - pad;
    if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8);
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  document.addEventListener('mouseover', e => {
    const im = e.target;
    if (im.tagName !== 'IMG' || im === tipImg) return;
    if (!im.closest('td') && !im.closest('.leaflet-popup-content')) return;
    tipImg.style.display = 'none';
    tipImg.removeAttribute('src');
    tipLabel.style.display = 'flex';
    tip.style.display = 'block';
    placeTip(e);
    const big = im.dataset.big || bigThumb(im.src);
    tipImg.onload = () => { tipLabel.style.display = 'none'; tipImg.style.display = 'block'; placeTip(e); };
    tipImg.onerror = () => { tipImg.onerror = null; tipImg.src = im.src; };
    tipImg.src = big;
  });
  document.addEventListener('mousemove', e => { if (tip.style.display === 'block') placeTip(e); });
  document.addEventListener('mouseout', e => {
    if (e.target.tagName === 'IMG' && e.target !== tipImg) tip.style.display = 'none';
  });
} else {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;display:none;z-index:10001;background:rgba(6,8,10,.94);align-items:center;justify-content:center;flex-direction:column;gap:10px';
  const ovLabel = document.createElement('div');
  ovLabel.style.cssText = 'color:#888;font-size:.95em';
  ovLabel.textContent = 'ładowanie…';
  const ovImg = document.createElement('img');
  ovImg.style.cssText = 'display:none;max-width:94vw;max-height:80vh;border-radius:10px';
  const ovHint = document.createElement('div');
  ovHint.style.cssText = 'color:#9aa4af;font-size:.85em';
  ovHint.textContent = 'dotknij, aby zamknąć';
  ov.appendChild(ovLabel); ov.appendChild(ovImg); ov.appendChild(ovHint);
  document.body.appendChild(ov);
  ov.addEventListener('click', () => { ov.style.display = 'none'; ovImg.removeAttribute('src'); });
  document.addEventListener('click', e => {
    const im = e.target;
    if (im.tagName !== 'IMG' || im === ovImg) return;
    if (!im.closest('td') && !im.closest('.leaflet-popup-content')) return;
    ovImg.style.display = 'none';
    ovImg.removeAttribute('src');
    ovLabel.style.display = 'block';
    ov.style.display = 'flex';
    ovImg.onload = () => { ovLabel.style.display = 'none'; ovImg.style.display = 'block'; };
    ovImg.onerror = () => { ovImg.onerror = null; ovImg.src = im.src; };
    ovImg.src = im.dataset.big || bigThumb(im.src);
  });
}


// ===== PWA: rejestracja service workera =====
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}


function SITE_INIT() {
  initFilters();
  setMode('all');
  decorateTables();
}
