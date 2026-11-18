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
  var WHATSAPP_NUMBER = "593988145824"; // código de país sin +, sin espacios

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
