/* Card de Sistema: selecao opcional e protecao dos links.
   Selecao: so existe quando o card traz o botao (o app informou o rotulo). O clique no botao, ou no card fora dos links,
   marca o card dentro da mesma lista (ou da regiao, no uso como Single) e dispara o evento "cardsistemaselecao" na
   regiao, com { chave, peloBotao }. O estado vai no texto do botao, que troca para o rotulo de selecionado.
   Links: o escape HTML nao barra um endereco "javascript:"; link do card que nao seja http, https ou relativo perde o
   href e o target quando o card aparece, e deixa de ser link; o clique nele tambem e cancelado.
   Carrossel: com o Layout "Carrossel" a grade vira uma faixa que rola para o lado; as setas ficam logo depois da faixa
   e so aparecem quando ha mais cards que a largura. */
(function () {
  "use strict";

  function linkSeguro(endereco) {
    try {
      var url = new URL(endereco, window.location.href);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (e) {
      return false;
    }
  }

  function protegerLinks(raiz) {
    raiz.querySelectorAll(".pf-Card a[href]").forEach(function (link) {
      if (!linkSeguro(link.getAttribute("href"))) {
        link.removeAttribute("href");
        link.removeAttribute("target");
      }
    });
  }

  function marcar(card, lista) {
    lista.querySelectorAll(".pf-Card").forEach(function (outro) {
      var ativo = outro === card,
          botao = outro.querySelector(".js-cardSistema-selecao"),
          rotulo = botao && botao.querySelector(".t-Button-label");
      outro.classList.toggle("is-selecionado", ativo);
      // sem aria-pressed: o rotulo ja muda com o estado, e botao de alternar nao deve trocar de nome
      if (rotulo) {
        rotulo.textContent = ativo ? (botao.dataset.rotuloSelecionado || botao.dataset.rotulo) : botao.dataset.rotulo;
      }
    });
  }

  var reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

  // em pagina da direita para a esquerda o scrollLeft vai de 0 a negativo e "proximo" rola para a esquerda
  function seta(grade, direcao, rotulo, icone, rtl) {
    var botao = document.createElement("button"),
        simbolo = document.createElement("span");
    botao.type = "button";
    botao.className = "pf-Carrossel-seta";
    botao.setAttribute("aria-label", rotulo);
    simbolo.className = "fa " + icone;
    simbolo.setAttribute("aria-hidden", "true");
    botao.appendChild(simbolo);
    botao.addEventListener("click", function () {
      var item = grade.querySelector(".pf-CardGrid-item");
      grade.scrollBy({ left: (rtl ? -direcao : direcao) * (item ? item.getBoundingClientRect().width : grade.clientWidth),
                       behavior: reduzMovimento.matches ? "auto" : "smooth" });
    });
    return botao;
  }

  function montarCarrossel(grade) {
    var nav, anterior, proximo, rtl;
    if (grade.pfCarrossel) {
      return;
    }
    // regiao redesenhada: a navegacao da faixa anterior sai
    if (grade.nextElementSibling && grade.nextElementSibling.classList.contains("pf-Carrossel-nav")) {
      grade.nextElementSibling.remove();
    }
    rtl = getComputedStyle(grade).direction === "rtl";
    anterior = seta(grade, -1, grade.dataset.rotuloAnterior || "Anterior", rtl ? "fa-chevron-right" : "fa-chevron-left", rtl);
    proximo = seta(grade, 1, grade.dataset.rotuloProximo || "Próximo", rtl ? "fa-chevron-left" : "fa-chevron-right", rtl);
    nav = document.createElement("div");
    nav.className = "pf-Carrossel-nav";
    nav.appendChild(anterior);
    nav.appendChild(proximo);
    grade.insertAdjacentElement("afterend", nav);
    function atualizar() {
      var posicao = Math.abs(grade.scrollLeft);
      nav.classList.toggle("is-ativo", grade.scrollWidth > grade.clientWidth + 2);
      anterior.disabled = posicao <= 2;
      proximo.disabled = posicao + grade.clientWidth >= grade.scrollWidth - 2;
    }
    grade.addEventListener("scroll", atualizar, { passive: true });
    new ResizeObserver(atualizar).observe(grade);
    // paginacao por rolagem anexa cards na mesma faixa sem mudar a largura dela
    new MutationObserver(atualizar).observe(grade, { childList: true });
    grade.pfCarrossel = true;
    atualizar();
  }

  function montarCarrosseis(raiz) {
    if (raiz.matches && raiz.matches(".pf-CardGrid--carrossel")) {
      montarCarrossel(raiz);
    }
    raiz.querySelectorAll(".pf-CardGrid--carrossel").forEach(montarCarrossel);
  }

  document.addEventListener("click", function (evento) {
    var link = evento.target.closest(".pf-Card a[href]");
    if (link && !linkSeguro(link.getAttribute("href"))) {
      evento.preventDefault();
      return;
    }
    var card = evento.target.closest(".pf-Card"),
        botao = evento.target.closest(".js-cardSistema-selecao"),
        lista = card && (card.closest(".pf-CardGrid") || card.parentElement),
        regiao;
    // sem botao de selecao o card nao e selecionavel; links e outros botoes seguem com a acao deles
    if (!card || !lista || !card.querySelector(".js-cardSistema-selecao") || (!botao && evento.target.closest("a, button"))) {
      return;
    }
    marcar(card, lista);
    regiao = apex.region.findClosest(lista);
    apex.event.trigger(regiao ? regiao.element : lista, "cardsistemaselecao",
                       { chave: card.dataset.chave, peloBotao: !!botao });
  });

  // o template component desenha os cards depois da carga e de cada refresh
  apex.jQuery(function () {
    protegerLinks(document);
    montarCarrosseis(document);
    new MutationObserver(function (mudancas) {
      mudancas.forEach(function (mudanca) {
        mudanca.addedNodes.forEach(function (no) {
          if (no.nodeType === 1 && (no.matches(".pf-Card, .pf-CardGrid, .pf-CardGrid-item") || no.querySelector(".pf-Card"))) {
            protegerLinks(no.parentNode || no);
            montarCarrosseis(no);
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
