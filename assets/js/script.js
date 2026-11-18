// Menú móvil
(function(){
  var hamburger = document.getElementById('hamburgerBtn');
  var mobileNav = document.getElementById('mobileNav');
  var backdrop = document.getElementById('mobileNavBackdrop');
  if(!hamburger || !mobileNav || !backdrop) return;

  function isOpen(){ return mobileNav.classList.contains('open'); }
  function closeMenu(){
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded','false');
    hamburger.setAttribute('aria-label','Abrir menú');
    mobileNav.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('menu-open');
  }
  function openMenu(){
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded','true');
    hamburger.setAttribute('aria-label','Cerrar menú');
    mobileNav.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('menu-open');
  }
  hamburger.addEventListener('click', function(){
    if(isOpen()){ closeMenu(); } else { openMenu(); }
  });
  backdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && isOpen()){ closeMenu(); hamburger.focus(); }
  });

  // Cerrar el menú al tocar un enlace
  mobileNav.querySelectorAll('a').forEach(function(link){
    link.addEventListener('click', closeMenu);
  });

  // Acordeón "Servicios" en móvil
  var ddToggle = mobileNav.querySelector('.mobile-dropdown-toggle');
  var dd = mobileNav.querySelector('.mobile-dropdown');
  if(ddToggle && dd){
    ddToggle.addEventListener('click', function(){
      var open = dd.classList.toggle('open');
      ddToggle.classList.toggle('open', open);
      ddToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Cerrar el menú si la pantalla pasa a tamaño escritorio
  window.addEventListener('resize', function(){
    if(window.innerWidth > 900 && isOpen()){ closeMenu(); }
  });
})();

// Envío del formulario de cotización: Web3Forms (correo) + WhatsApp
(function(){
  var form = document.getElementById('quote-form');
  if(!form) return;
  var statusMsg = document.getElementById('quote-form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var WHATSAPP_NUMBER = "593968759686"; // código de país sin +, sin espacios

  function showStatus(type, html){
    statusMsg.hidden = false;
    statusMsg.className = 'full form-status ' + type;
    statusMsg.innerHTML = html;
  }

  function buildWhatsAppText(d){
    var lines = [
      "\u{1F3D7}️ *Nueva solicitud de cotización*",
      "_Equinoccial – Maniobras e Izajes_",
      "",
      "\u{1F464} *Nombre:* " + d.nombre
    ];
    if(d.empresa) lines.push("\u{1F3E2} *Empresa:* " + d.empresa);
    lines.push("\u{1F4DE} *Teléfono:* " + d.telefono);
    lines.push("\u{2709}️ *Correo:* " + d.email);
    if(d.sector) lines.push("\u{2699}️ *Sector:* " + d.sector);
    if(d.servicio) lines.push("\u{1F69B} *Servicio:* " + d.servicio);
    if(d.mensaje){ lines.push(""); lines.push("\u{1F4DD} *Detalle:*"); lines.push(d.mensaje); }
    return encodeURIComponent(lines.join("\n"));
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();

    // Validación con mensajes del navegador (campos obligatorios, correo válido, casilla de privacidad)
    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }

    var fd = new FormData(form);
    var d = {
      nombre: (fd.get('name') || '').trim(),
      empresa: (fd.get('company') || '').trim(),
      telefono: (fd.get('phone') || '').trim(),
      email: (fd.get('email') || '').trim(),
      sector: fd.get('sector') || '',
      servicio: fd.get('service') || '',
      mensaje: (fd.get('message') || '').trim()
    };
    var waUrl = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + buildWhatsAppText(d);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    showStatus('info', 'Enviando solicitud...');

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: fd
    })
    .then(function(res){ return res.json(); })
    .then(function(data){
      if(data && data.success){
        form.reset();
        showStatus('ok',
          '¡Solicitud enviada! Te contactaremos pronto.' +
          '<a class="btn-whatsapp" href="' + waUrl + '" target="_blank" rel="noopener">Enviar también por WhatsApp</a>');
      } else {
        throw new Error('error');
      }
    })
    .catch(function(){
      showStatus('error',
        'No pudimos enviar el formulario. Revisa tu conexión o envíanos la solicitud por WhatsApp.' +
        '<a class="btn-whatsapp" href="' + waUrl + '" target="_blank" rel="noopener">Enviar por WhatsApp</a>');
    })
    .then(function(){
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar solicitud';
    });
  });
})();

// Video del hero: se reproduce solo si el usuario no pidió reducir animaciones
// y se reintenta al primer toque/scroll (modo ahorro de batería en iOS)
(function(){
  var heroVideo = document.querySelector('.hero-video');
  if(!heroVideo) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  if(reduceMotion || saveData){
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
    return;
  }

  function tryPlayVideo(){
    var p = heroVideo.play();
    if(p && p.catch) p.catch(function(){});
  }
  tryPlayVideo();

  var events = ['touchstart', 'scroll', 'click'];
  function onFirstInteraction(){
    if(heroVideo.paused){ tryPlayVideo(); }
    events.forEach(function(evt){ window.removeEventListener(evt, onFirstInteraction); });
  }
  events.forEach(function(evt){
    window.addEventListener(evt, onFirstInteraction, { passive: true });
  });

  // Pausar el video cuando no está en pantalla para ahorrar batería y datos
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ tryPlayVideo(); } else { heroVideo.pause(); }
      });
    }).observe(heroVideo);
  }
})();

// Mapa de cobertura: dibuja los puntos a partir de los datos en #coverageData
(function(){
  var dataEl = document.getElementById('coverageData');
  var svg = document.querySelector('.coverage-svg');
  if(!dataEl || !svg) return;

  var data;
  try { data = JSON.parse(dataEl.textContent); } catch(e){ return; }
  var base = data.base;
  var trabajos = (data.trabajos || []).filter(function(t){ return typeof t.lat === 'number' && typeof t.lon === 'number'; });

  var NS = 'http://www.w3.org/2000/svg';
  var minx = parseFloat(svg.dataset.minx), maxy = parseFloat(svg.dataset.maxy);
  var K = parseFloat(svg.dataset.k), pad = parseFloat(svg.dataset.pad);
  var gal = (svg.dataset.gal || '').split(',').map(parseFloat); // [lon0, lat0, escala, lonDestino, latDestino]

  function project(lat, lon){
    if(lon < -86 && gal.length === 5){ // Galápagos va en el recuadro, a escala reducida
      lon = gal[3] + (lon - gal[0]) * gal[2];
      lat = gal[4] + (lat - gal[1]) * gal[2];
    }
    return [ (lon - minx) * K + pad, (maxy - lat) * K + pad ];
  }
  function norm(s){ return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  function esc(s){ var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  var markersG = document.getElementById('coverageMarkers');
  var detail = document.getElementById('coverageDetail');
  var provsBox = document.getElementById('coverageProvs');
  var provPaths = {};
  svg.querySelectorAll('.prov').forEach(function(p){ provPaths[norm(p.dataset.prov)] = p; });

  // Provincias con trabajos (más la de la base)
  var provNames = {};
  [base].concat(trabajos).forEach(function(t){
    if(t && t.provincia){ provNames[norm(t.provincia)] = t.provincia; }
  });
  Object.keys(provNames).forEach(function(k){ if(provPaths[k]) provPaths[k].classList.add('worked'); });

  document.getElementById('covProvCount').textContent = Object.keys(provNames).length;
  document.getElementById('covJobCount').textContent = trabajos.length;

  // Posiciones: separa los puntos que caen casi en el mismo lugar según el zoom actual
  var allItems = trabajos.concat(base ? [base] : []);
  var raw = allItems.map(function(t){ return project(t.lat, t.lon); });
  var pos = raw.slice();
  var fullVB = svg.getAttribute('viewBox').split(' ').map(Number);
  var zoom = 1;
  function spread(){
    // Repulsión simple: separa los puntos hasta que ninguno se tape (la base queda fija)
    var MIN = 32 / zoom, baseIdx = base ? allItems.length - 1 : -1;
    pos = raw.map(function(p, i){ return [p[0] + (i === baseIdx ? 0 : Math.cos(i * 2.4) * 0.5), p[1] + (i === baseIdx ? 0 : Math.sin(i * 2.4) * 0.5)]; });
    for(var it = 0; it < 120; it++){
      var moved = false;
      for(var i = 0; i < pos.length; i++){
        for(var j = i + 1; j < pos.length; j++){
          var dx = pos[j][0] - pos[i][0], dy = pos[j][1] - pos[i][1], d = Math.hypot(dx, dy) || 0.01;
          var need = MIN * ((i === baseIdx || j === baseIdx) ? 1.25 : 1);
          if(d < need){
            var push = (need - d) / 2, ux = dx / d, uy = dy / d;
            if(i === baseIdx){ pos[j][0] += ux * push * 2; pos[j][1] += uy * push * 2; }
            else if(j === baseIdx){ pos[i][0] -= ux * push * 2; pos[i][1] -= uy * push * 2; }
            else { pos[i][0] -= ux * push; pos[i][1] -= uy * push; pos[j][0] += ux * push; pos[j][1] += uy * push; }
            moved = true;
          }
        }
      }
      if(!moved) break;
    }
  }
  function posOf(item){ return pos[allItems.indexOf(item)]; }
  function placeMarkers(){
    spread();
    markerEls.forEach(function(g){
      var xy = posOf(g._item);
      g.setAttribute('transform', 'translate(' + xy[0].toFixed(1) + ',' + xy[1].toFixed(1) + ') scale(' + (1 / zoom).toFixed(3) + ')');
    });
  }

  var markerEls = [];
  function makeMarker(item, isBase, index){
    var g = document.createElementNS(NS, 'g');
    g._item = item;
    g.setAttribute('class', 'marker' + (isBase ? ' marker-base' : ''));
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', (isBase ? 'Base de operaciones: ' : '') + (item.titulo || '') + ' — ' + (item.lugar || ''));
    var r = isBase ? 16 : 11;
    g.innerHTML =
      '<circle class="hit" r="30"></circle>' +
      '<circle class="pulse" r="' + r + '"></circle>' +
      '<circle class="dot" r="' + r + '"></circle>' +
      (isBase
        ? '<path class="icon" d="M-7 1 L0 -7 L7 1 M-4.5 -1.5 V7 H4.5 V-1.5" />'
        : '<circle class="core" r="4"></circle>');
    g.style.animationDelay = (index * 0.12) + 's';
    function activate(){ select(item, isBase, g); }
    g.addEventListener('click', activate);
    g.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); activate(); } });
    markersG.appendChild(g);
    markerEls.push(g);
    return g;
  }

  function select(item, isBase, el){
    markerEls.forEach(function(m){ m.classList.remove('active'); });
    if(el) el.classList.add('active');
    Object.keys(provPaths).forEach(function(k){ provPaths[k].classList.remove('selected'); });
    var pp = provPaths[norm(item.provincia)];
    if(pp) pp.classList.add('selected');
    detail.innerHTML =
      '<span class="cov-tag">' + esc(isBase ? 'Base de operaciones' : (item.sector || 'Proyecto')) + '</span>' +
      '<h3>' + esc(item.titulo) + '</h3>' +
      '<div class="cov-place">' + esc(item.lugar) + (item.provincia ? ' · ' + esc(item.provincia) : '') + '</div>' +
      (item.detalle ? '<p>' + esc(item.detalle) + '</p>' : '') +
      (item.enlace ? '<a class="cov-link" href="' + esc(item.enlace) + '" target="_blank" rel="noopener">Ver video del trabajo →</a>' : '');
    provsBox.querySelectorAll('button').forEach(function(b){
      b.classList.toggle('active', norm(b.dataset.prov) === norm(item.provincia));
    });
  }

  // Trabajos primero y la base al final para que quede encima
  trabajos.forEach(function(t, i){ makeMarker(t, false, i); });
  var baseEl = base ? makeMarker(base, true, trabajos.length) : null;
  placeMarkers();

  // Botón Acercar / Ver todo el Ecuador: enfoca la zona donde están los trabajos (sin Galápagos)
  var zoomBtn = document.getElementById('coverageZoom');
  var mainland = raw.filter(function(p, i){ return allItems[i].lon > -86; });
  if(zoomBtn && mainland.length > 1){
    var xs = mainland.map(function(p){ return p[0]; }), ys = mainland.map(function(p){ return p[1]; });
    var m = 90, x0 = Math.min.apply(null, xs) - m, x1 = Math.max.apply(null, xs) + m;
    var y0 = Math.min.apply(null, ys) - m, y1 = Math.max.apply(null, ys) + m;
    // mantener la proporción del mapa
    var ratio = fullVB[2] / fullVB[3], w = x1 - x0, h = y1 - y0;
    if(w / h < ratio){ var nw = h * ratio; x0 -= (nw - w) / 2; w = nw; } else { var nh = w / ratio; y0 -= (nh - h) / 2; h = nh; }
    var zoomVB = [x0, y0, w, h], zoomFactor = fullVB[2] / w;
    if(zoomFactor > 1.3){
      zoomBtn.hidden = false;
      var animId = null;
      function animateTo(target, z){
        var from = svg.getAttribute('viewBox').split(' ').map(Number), z0 = zoom, t0 = null;
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(animId) cancelAnimationFrame(animId);
        function step(ts){
          if(!t0) t0 = ts;
          var k = reduce ? 1 : Math.min(1, (ts - t0) / 450);
          var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          svg.setAttribute('viewBox', from.map(function(v, i){ return (v + (target[i] - v) * e).toFixed(1); }).join(' '));
          zoom = z0 + (z - z0) * e;
          placeMarkers();
          if(k < 1){ animId = requestAnimationFrame(step); }
        }
        animId = requestAnimationFrame(step);
      }
      zoomBtn.addEventListener('click', function(){
        var zoomed = zoomBtn.getAttribute('aria-pressed') === 'true';
        animateTo(zoomed ? fullVB : zoomVB, zoomed ? 1 : zoomFactor);
        svg.classList.toggle('zoomed', !zoomed);
        zoomBtn.setAttribute('aria-pressed', zoomed ? 'false' : 'true');
        zoomBtn.textContent = zoomed ? 'Acercar a los trabajos +' : 'Ver todo el Ecuador −';
      });
    }
  }

  // Botones por provincia (lista accesible y útil en celular)
  Object.keys(provNames).sort().forEach(function(k){
    var b = document.createElement('button');
    b.type = 'button';
    b.dataset.prov = provNames[k];
    var n = trabajos.filter(function(t){ return norm(t.provincia) === k; }).length;
    b.innerHTML = esc(provNames[k]) + (n ? ' <span>' + n + '</span>' : '');
    b.addEventListener('click', function(){ showProvince(k); });
    provsBox.appendChild(b);
  });

  // Lista de trabajos de una provincia (útil cuando los puntos están muy juntos)
  function showProvince(k){
    var list = [];
    trabajos.forEach(function(t, i){ if(norm(t.provincia) === k) list.push(i); });
    var baseHere = base && norm(base.provincia) === k;
    if(list.length === 0 && baseHere){ select(base, true, baseEl); return; }
    if(list.length === 1 && !baseHere){ select(trabajos[list[0]], false, markerEls[list[0]]); return; }
    markerEls.forEach(function(m){ m.classList.remove('active'); });
    Object.keys(provPaths).forEach(function(p){ provPaths[p].classList.toggle('selected', p === k); });
    var html = '<span class="cov-tag">Provincia</span><h3>' + esc(provNames[k]) + '</h3>' +
      '<div class="cov-place">' + list.length + (list.length === 1 ? ' trabajo' : ' trabajos') + ' · toca uno para ver el detalle</div><ul class="cov-list">';
    if(baseHere){ html += '<li><button type="button" data-i="base"><strong>Base de operaciones</strong><span>' + esc(base.lugar) + '</span></button></li>'; }
    list.forEach(function(i){
      html += '<li><button type="button" data-i="' + i + '"><strong>' + esc(trabajos[i].titulo) + '</strong><span>' + esc(trabajos[i].lugar) + '</span></button></li>';
    });
    detail.innerHTML = html + '</ul>';
    detail.querySelectorAll('.cov-list button').forEach(function(btn){
      btn.addEventListener('click', function(){
        var i = btn.dataset.i;
        if(i === 'base'){ select(base, true, baseEl); } else { select(trabajos[+i], false, markerEls[+i]); }
      });
    });
    provsBox.querySelectorAll('button').forEach(function(bt){ bt.classList.toggle('active', norm(bt.dataset.prov) === k); });
  }

  // Clic en una provincia con trabajos: muestra la lista de sus trabajos
  Object.keys(provPaths).forEach(function(k){
    if(!provNames[k]) return;
    provPaths[k].addEventListener('click', function(){ showProvince(k); });
  });

  if(base) select(base, true, baseEl);
})();
