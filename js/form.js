/* Ficha de candidatura: confere os campos, monta a mensagem e abre o WhatsApp.
   As perguntas ficam no index.html. Cada bloco com data-field vira uma linha da mensagem:
     data-kind   = text | phone | choice | note
     data-rotulo = nome da linha na mensagem ("Nome", "Cidade"...)
     data-falta  = como o campo aparece no aviso "Falta ...". Sem data-falta o campo é opcional.
     data-min    = mínimo de letras (só para text)
   Cada campo obrigatório acende um dos paralelogramos no topo da ficha. */
(function () {
  var CONFIG = window.VAGAS_CONFIG || {};
  var NUMERO = String(CONFIG.whatsapp || "").replace(/\D/g, "");
  var ADM = String(CONFIG.whatsappAdm || "").replace(/\D/g, "");
  var form = document.getElementById("ficha-form");
  if (!form || !NUMERO) return;

  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var card = document.getElementById("ficha-card");
  // Quem pode receber a ficha. Cada botão de envio (data-enviar) e cada botão da tela
  // seguinte (data-reenviar) aponta para um destes números.
  var destinos = { whats: NUMERO, adm: ADM };
  var enviados = {};
  function comDestino(seletor, attr) {
    var achados = [];
    each(document.querySelectorAll(seletor), function (el) {
      if (destinos[el.getAttribute(attr)]) achados.push(el); else el.hidden = true;
    });
    return achados;
  }
  var botoes = comDestino("[data-enviar]", "data-enviar");
  var reenvios = comDestino("[data-reenviar]", "data-reenviar");
  var statusEl = document.getElementById("status");
  var meterText = document.getElementById("meter-text");
  var sent = document.getElementById("sent");
  var formView = document.getElementById("form-view");
  var doneView = document.getElementById("done-view");
  var doneTitle = document.getElementById("done-title");
  var segs = document.querySelectorAll(".seg");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touched = {};
  var wasReady = false;

  function digits(v) { return v.replace(/\D/g, ""); }
  function clean(v) { return v.replace(/\s+/g, " ").trim(); }

  function maskPhone(v) {
    var d = digits(v).slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  // O número aparece escrito na página a partir do config, no mesmo formato das artes.
  // Sempre sem o 55 na frente.
  function escrito(numero) {
    var local = numero.indexOf("55") === 0 && numero.length > 11 ? numero.slice(2) : numero;
    return local.length === 11
      ? "(" + local.slice(0, 2) + ") " + local.charAt(2) + "." + local.slice(3, 7) + "-" + local.slice(7)
      : maskPhone(local);
  }
  function publicar(numero, nome) {
    if (!numero) return;
    each(document.querySelectorAll("[data-" + nome + "-text]"), function (el) { el.textContent = escrito(numero); });
    each(document.querySelectorAll("[data-" + nome + "-link]"), function (el) { el.href = "https://wa.me/" + numero; });
  }
  publicar(NUMERO, "whats");
  publicar(ADM, "adm");

  var fields = Array.prototype.map.call(form.querySelectorAll("[data-field]"), function (el) {
    return {
      el: el,
      key: el.getAttribute("data-field"),
      kind: el.getAttribute("data-kind"),
      rotulo: el.getAttribute("data-rotulo"),
      falta: el.getAttribute("data-falta"),
      min: parseInt(el.getAttribute("data-min") || "1", 10),
      msg: el.querySelector(".msg")
    };
  });
  var required = fields.filter(function (f) { return !!f.falta; });

  function valueOf(f) {
    if (f.kind === "choice") {
      return Array.prototype.map.call(f.el.querySelectorAll("input:checked"), function (i) { return i.value; }).join(", ");
    }
    return clean(f.el.querySelector("input, textarea").value);
  }
  function isOk(f) {
    var v = valueOf(f);
    if (f.kind === "phone") { var n = digits(v).length; return n === 10 || n === 11; }
    if (f.kind === "text") return v.length >= f.min;
    return v.length > 0;
  }
  function buildMessage() {
    var lines = ["*" + CONFIG.titulo + "*", CONFIG.saudacao, ""];
    fields.forEach(function (f) {
      var v = valueOf(f);
      if (v) lines.push("*" + f.rotulo + ":* " + v);
    });
    return lines.join("\n");
  }
  function joinList(items) {
    if (items.length <= 1) return items.join("");
    return items.slice(0, -1).join(", ") + " e " + items[items.length - 1];
  }

  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function refresh() {
    var missing = [];
    required.forEach(function (f, i) {
      var good = isOk(f);
      var showError = !good && !!touched[f.key];
      f.el.classList.toggle("is-done", good);
      f.el.classList.toggle("has-error", showError);
      if (f.msg) f.msg.hidden = !showError;
      if (segs[i]) segs[i].style.setProperty("--fill", good ? 1 : 0);
      if (!good) missing.push(f.falta);
    });
    var ready = missing.length === 0;
    meterText.textContent = (required.length - missing.length) + " de " + required.length;
    statusEl.textContent = ready ? "Tudo certo. Escolha para quem enviar." : "Falta " + joinList(missing) + ".";
    statusEl.classList.toggle("is-ready", ready);
    // Quando a ficha fica completa, os botões chamam a atenção uma vez.
    if (ready && !wasReady) botoes.forEach(function (b) { replay(b, "is-ready"); });
    wasReady = ready;
    var texto = "?text=" + encodeURIComponent(buildMessage());
    botoes.forEach(function (b) { b.href = "https://wa.me/" + destinos[b.getAttribute("data-enviar")] + texto; });
    reenvios.forEach(function (b) { b.href = "https://wa.me/" + destinos[b.getAttribute("data-reenviar")] + texto; });
    return ready;
  }

  // Tela seguinte: quem já recebeu vira "abrir de novo"; quem falta fica em destaque.
  function pintarReenvios() {
    reenvios.forEach(function (b) {
      var feito = !!enviados[b.getAttribute("data-reenviar")];
      var nome = b.getAttribute("data-nome");
      b.classList.toggle("btn--line", feito);
      b.querySelector("[data-reenviar-texto]").textContent =
        feito ? "Abrir de novo: " + nome : "Enviar também para " + nome;
    });
  }

  // Troca de tela com uma lâmina vermelha cruzando a ficha.
  function swap(show, hide, then) {
    function change() {
      hide.hidden = true;
      show.hidden = false;
      if (then) then();
    }
    if (calm || !card) { change(); return; }
    replay(card, "is-wiping");
    window.setTimeout(change, 430);
    window.setTimeout(function () { card.classList.remove("is-wiping"); }, 950);
  }

  form.addEventListener("input", function (e) {
    if (e.target.type === "tel") e.target.value = maskPhone(e.target.value);
    refresh();
  });
  form.addEventListener("change", function (e) {
    var wrap = e.target.closest("[data-field]");
    if (wrap) touched[wrap.getAttribute("data-field")] = true;
    refresh();
  });
  form.addEventListener("focusout", function (e) {
    var wrap = e.target.closest("[data-field]");
    if (wrap && e.target.matches('input[type="text"], input[type="tel"]') && e.target.value) {
      touched[wrap.getAttribute("data-field")] = true;
      refresh();
    }
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  // Cada botão é um link de verdade: com a ficha completa, o próprio toque abre o WhatsApp de quem foi escolhido.
  botoes.forEach(function (enviar) { enviar.addEventListener("click", function (e) {
    required.forEach(function (f) { touched[f.key] = true; });
    if (!refresh()) {
      e.preventDefault();
      replay(enviar, "is-shaking");
      var first = form.querySelector(".has-error");
      if (first) {
        first.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
        var control = first.querySelector("input, textarea");
        if (control) control.focus({ preventScroll: true });
      }
      return;
    }
    sent.textContent = buildMessage();
    enviados = {};
    enviados[enviar.getAttribute("data-enviar")] = true;
    pintarReenvios();
    window.setTimeout(function () {
      swap(doneView, formView, function () {
        doneTitle.focus({ preventScroll: true });
        if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: "start" });
      });
    }, 250);
  }); });

  // Enviar a mesma ficha para o outro contato (ou abrir de novo a conversa).
  reenvios.forEach(function (b) { b.addEventListener("click", function () {
    enviados[b.getAttribute("data-reenviar")] = true;
    window.setTimeout(pintarReenvios, 600);
  }); });

  document.getElementById("corrigir").addEventListener("click", function () {
    swap(formView, doneView, function () { form.querySelector("input").focus({ preventScroll: true }); });
  });

  document.getElementById("copiar").addEventListener("click", function (e) {
    var btn = e.currentTarget;
    function selectFallback() {
      var range = document.createRange();
      range.selectNodeContents(sent);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      btn.textContent = "Mensagem selecionada, agora copie";
    }
    try {
      navigator.clipboard.writeText(sent.textContent).then(function () {
        btn.textContent = "Mensagem copiada";
        window.setTimeout(function () { btn.textContent = "Copiar a mensagem"; }, 2400);
      }, selectFallback);
    } catch (err) { selectFallback(); }
  });

  refresh();
})();
