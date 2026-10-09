/* Abertura. As lâminas e o logo se animam em CSS; este script conta o carregamento,
   espera a fonte e a foto, e então abre as lâminas em camadas até a diagonal do hero,
   enquanto o logo voa para o lugar dele. Se o script não rodar, a abertura some pelo CSS. */
(function () {
  var root = document.documentElement;
  var intro = document.getElementById("intro");
  var title = document.getElementById("hero-title");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Título em letras soltas, para subirem uma a uma.
  if (title) {
    var count = 0;
    Array.prototype.forEach.call(title.querySelectorAll(".line"), function (line) {
      var text = line.textContent;
      line.textContent = "";
      text.split("").forEach(function (letter) {
        var span = document.createElement("span");
        span.className = "ch";
        span.style.setProperty("--c", count++);
        span.textContent = letter;
        line.appendChild(span);
      });
    });
  }

  if (!intro) return;
  if (reduce || !intro.animate) {
    root.classList.add("hero-in", "intro-done");
    return;
  }

  var HOLD = 2350;        // tempo mínimo da abertura, em ms
  var COUNT_FROM = 620;   // o contador acompanha a barra
  var COUNT_FOR = 1500;
  var OPEN_FOR = 1050;    // duração da abertura das lâminas
  var LAYER_GAP = 95;     // atraso entre uma lâmina e a seguinte

  var layers = [
    document.getElementById("intro-panel"),
    document.getElementById("intro-blade-b"),
    document.getElementById("intro-blade-a")
  ];
  var logo = document.getElementById("intro-logo");
  var counter = document.getElementById("intro-count");
  var extras = [document.getElementById("intro-tag"), document.getElementById("intro-load")];
  var started = performance.now();

  root.classList.add("intro-armed");
  document.body.classList.add("is-locked");
  intro.style.animation = "none";

  // Contador de 0 a 100, no mesmo ritmo da barra.
  function tick(now) {
    var t = Math.min(1, Math.max(0, (now - started - COUNT_FROM) / COUNT_FOR));
    var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    if (counter) counter.textContent = Math.round(eased * 100) + "%";
    if (t < 1 && intro.parentNode) window.requestAnimationFrame(tick);
  }
  window.requestAnimationFrame(tick);

  function finish() {
    root.classList.add("hero-in", "intro-done");
    document.body.classList.remove("is-locked");
    if (intro.parentNode) intro.parentNode.removeChild(intro);
  }

  function open() {
    try {
      var hero = document.getElementById("hero");
      var target = document.getElementById("hero-logo");
      var W = window.innerWidth;
      var H = window.innerHeight;
      var cs = window.getComputedStyle(hero);
      var sx = parseFloat(cs.getPropertyValue("--sx")) / 100 * W;
      var tan = parseFloat(cs.getPropertyValue("--tan"));
      var ease = "cubic-bezier(.7,0,.2,1)";

      root.classList.add("hero-in");
      intro.style.background = "transparent";

      if (window.scrollY > 4 || isNaN(sx) || isNaN(tan)) {
        intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }).onfinish = finish;
        return;
      }

      // A borda entra inclinada e para exatamente em cima da diagonal do hero.
      // A lâmina da frente sai primeiro; as de trás vêm atrasadas e deixam um rastro.
      var from = "polygon(-10px 0px, " + W + "px 0px, " + W + "px " + H + "px, " + (-10 - tan * H) + "px " + H + "px)";
      var to = "polygon(" + sx + "px 0px, " + W + "px 0px, " + W + "px " + H + "px, " + (sx - tan * H) + "px " + H + "px)";
      layers.forEach(function (layer, i) {
        if (layer) layer.animate([{ clipPath: from }, { clipPath: to }], { duration: OPEN_FOR, delay: i * LAYER_GAP, easing: ease, fill: "both" });
      });

      extras.forEach(function (el) {
        if (el) el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" });
      });

      var canFly = target && target.offsetParent !== null && target.getBoundingClientRect().width > 0;
      if (canFly) {
        var a = logo.getBoundingClientRect();
        var b = target.getBoundingClientRect();
        var move = "translate(" + (b.left - a.left) + "px, " + (b.top - a.top) + "px) scale(" + (b.width / a.width) + ")";
        logo.animate([{ transform: "none" }, { transform: move }], { duration: 920, easing: "cubic-bezier(.6,0,.1,1)", fill: "forwards" });
      } else {
        logo.animate(
          [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-28px) scale(.94)" }],
          { duration: 420, easing: ease, fill: "forwards" }
        );
      }
      window.setTimeout(finish, OPEN_FOR + LAYER_GAP * (layers.length - 1) + 60);
    } catch (err) {
      finish();
    }
  }

  function wait(ms) { return new Promise(function (resolve) { window.setTimeout(resolve, ms); }); }
  var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var figure = document.querySelector(".hero-figure img");
  var photo = figure && figure.decode ? figure.decode().catch(function () {}) : Promise.resolve();

  Promise.race([Promise.all([fonts, photo]), wait(3000)]).then(function () {
    window.setTimeout(open, Math.max(0, HOLD - (performance.now() - started)));
  });
})();
