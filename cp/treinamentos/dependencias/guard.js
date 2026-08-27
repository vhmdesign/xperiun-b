/* guard.js — mesmas proteções de abertura das páginas /cp/*, só que em
   arquivo externo em vez de <script> inline, pra CSP poder rodar em
   enforcement com script-src 'self' (sem 'unsafe-inline').

   1) Página salva em disco / aberta por file:// ou data: não renderiza.
   2) Não deixa a página ser embutida em iframe de terceiro (clickjacking
      e wrappers de clone), reforçando o X-Frame-Options do .htaccess. */
(function () {
    var p = location.protocol;
    if (p !== 'https:' && p !== 'http:') {
        document.documentElement.innerHTML = '';
        return;
    }
    if (window.top !== window.self) {
        try { window.top.location = window.self.location; } catch (e) { /* cross-origin: só limpa */ }
        document.documentElement.innerHTML = '';
    }
})();
