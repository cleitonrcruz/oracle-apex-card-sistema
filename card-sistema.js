/* Card de Sistema: selecao opcional e protecao dos links.
   Selecao: so existe quando o card traz o botao (o app informou o rotulo). O clique no botao, ou no card fora dos links,
   marca o card dentro da mesma lista (ou da regiao, no uso como Single) e dispara o evento "cardsistemaselecao" na
   regiao, com { chave, peloBotao }. O estado vai no texto do botao, que troca para o rotulo de selecionado.
   Links: o escape HTML nao barra um endereco "javascript:"; link do card que nao seja http, https ou relativo perde o
   href e o target quando o card aparece, e deixa de ser link; o clique nele tambem e cancelado. */
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
    new MutationObserver(function (mudancas) {
      mudancas.forEach(function (mudanca) {
        mudanca.addedNodes.forEach(function (no) {
          if (no.nodeType === 1 && (no.matches(".pf-Card, .pf-CardGrid, .pf-CardGrid-item") || no.querySelector(".pf-Card"))) {
            protegerLinks(no.parentNode || no);
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
