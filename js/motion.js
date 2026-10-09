/* Movimento ligado à rolagem e ao mouse: entradas, texto que acende, palavras
   que deslizam, deslocamento suave, barra de leitura, barra fixa, cartões que
   inclinam e botões que acompanham o ponteiro. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  // Ordem de entrada dentro de cada grupo.
  each(document.querySelectorAll("[data-stagger]"), function (group) {
    var i = 0;
    each(group.querySelectorAll("[data-reveal]"), function (el) {
      // quem está dentro de outro item do grupo herda a ordem dele
      var outer = el.parentElement.closest("[data-reveal]");
      if (outer && group.contains(outer)) return;
      el.style.setProperty("--i", i++);
    });
  });

  // Texto que acende: cada palavra vira um trecho próprio.
  var scrubs = [];
  each(document.querySelectorAll("[data-scrub]"), function (el) {
    var words = [];
    function wrap(textNode, hot) {
      var frag = document.createDocumentFragment();
      textNode.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
        var span = document.createElement("span");
        span.className = hot ? "w hot" : "w";
        span.textContent = part;
        words.push(span);
        frag.appendChild(span);
      });
      textNode.parentNode.replaceChild(frag, textNode);
    }
    each(Array.prototype.slice.call(el.childNodes), function (node) {
      if (node.nodeType === 3) wrap(node, false);
      else if (node.nodeType === 1) each(Array.prototype.slice.call(node.childNodes), function (inner) {
        if (inner.nodeType === 3) wrap(inner, true);
      });
    });
    scrubs.push({ el: el, words: words, lit: 0 });
  });

  root.classList.add("motion-on");

  // Números que contam do zero quando o cartão entra (01, 02, 03...).
  function countUp(el, delay) {
    var end = parseInt(el.textContent, 10);
    if (isNaN(end) || reduce) return;
    var width = el.textContent.length;
    var pad = function (n) { n = String(n); while (n.length < width) n = "0" + n; return n; };
    var start = 0;
    el.textContent = pad(0);
    function step(now) {
      if (!start) start = now + delay;
      var t = Math.min(1, Math.max(0, (now - start) / 650));
      el.textContent = pad(Math.round((1 - Math.pow(1 - t, 3)) * end));
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  // Entradas ao aparecer na tela.
  var reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        var counter = entry.target.querySelector("[data-count]");
        if (counter) countUp(counter, (parseInt(entry.target.style.getPropertyValue("--i"), 10) || 0) * 90 + 150);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    each(reveals, function (el) { io.observe(el); });
  } else {
    each(reveals, function (el) { el.classList.add("is-in"); });
  }

  var hero = document.getElementById("hero");
  var dock = document.getElementById("dock");
  var ficha = document.getElementById("ficha");

  // Dentro da seção da ficha, o botão da barra fixa não faz falta.
  if (dock && ficha && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      dock.classList.toggle("at-form", entries[0].isIntersecting);
    }, { rootMargin: "-30% 0px -30% 0px" }).observe(ficha);
  }
  var parallax = document.querySelectorAll("[data-parallax]");
  var drifts = document.querySelectorAll("[data-drift]");
  var ticker = document.getElementById("ticker-track");
  var tickerAnim = null;
  var lastY = window.scrollY;
  var calmTimer = 0;
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;

    root.style.setProperty("--read", max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0);
    if (dock && hero) dock.classList.toggle("is-on", y > hero.offsetHeight - 90);

    scrubs.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      var progress = reduce ? 1 : clamp((vh * 0.86 - r.top) / (r.height + vh * 0.34), 0, 1);
      var lit = Math.round(progress * s.words.length);
      if (lit === s.lit) return;
      var a = Math.min(lit, s.lit);
      var b = Math.max(lit, s.lit);
      for (var i = a; i < b; i++) s.words[i].classList.toggle("is-lit", lit > s.lit);
      s.lit = lit;
    });

    if (reduce) return;

    // A diagonal do hero avança um pouco enquanto ele sai da tela.
    if (hero && y < hero.offsetHeight) {
      hero.style.setProperty("--shift", (clamp(y / hero.offsetHeight, 0, 1) * 9).toFixed(2) + "%");
    }

    each(parallax, function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.setProperty("--py", (r.top * parseFloat(el.getAttribute("data-parallax"))).toFixed(1) + "px");
    });

    each(drifts, function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var progress = clamp(1 - (r.top + r.height) / (vh + r.height), 0, 1);
      var range = Math.min(window.innerWidth * 0.55, 620);
      el.style.setProperty("--drift", (parseFloat(el.getAttribute("data-drift")) * progress * range).toFixed(1) + "px");
    });

    // A faixa acelera junto com a rolagem e volta ao ritmo normal.
    if (ticker && ticker.getAnimations) {
      tickerAnim = tickerAnim || ticker.getAnimations()[0];
      if (tickerAnim) {
        tickerAnim.playbackRate = 1 + clamp(Math.abs(y - lastY) / 14, 0, 5);
        window.clearTimeout(calmTimer);
        calmTimer = window.setTimeout(function () { tickerAnim.playbackRate = 1; }, 180);
      }
    }
    lastY = y;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();

  if (reduce || !finePointer) return;

  // A pessoa do hero acompanha de leve o mouse.
  var followers = document.querySelectorAll("[data-mouse]");
  if (hero && followers.length) {
    each(followers, function (el) { el.style.transition = "transform .7s cubic-bezier(.2,.8,.2,1)"; });
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var k = (e.clientX - r.left) / r.width - 0.5;
      each(followers, function (el) {
        el.style.setProperty("--px", (k * parseFloat(el.getAttribute("data-mouse"))).toFixed(1) + "px");
      });
    });
    hero.addEventListener("pointerleave", function () {
      each(followers, function (el) { el.style.setProperty("--px", "0px"); });
    });
  }

  // Cartões de benefício inclinam na direção do ponteiro.
  each(document.querySelectorAll("[data-tilt]"), function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 7).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - (e.clientY - r.top) / r.height) * 7).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", function () {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });

  // Botões principais puxam um pouco para o ponteiro.
  each(document.querySelectorAll("[data-magnetic]"), function (btn) {
    btn.style.transition = "translate .4s cubic-bezier(.2,.8,.2,1)";
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      btn.style.translate = (dx * 12).toFixed(1) + "px " + (dy * 8).toFixed(1) + "px";
    });
    btn.addEventListener("pointerleave", function () { btn.style.translate = "0px 0px"; });
  });
})();
