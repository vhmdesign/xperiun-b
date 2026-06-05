/* anti-copy.js — deterrentes client-side pra landing pages /ed/*.
   Bypass trivial via extensão de browser ou menu nativo (View >
   Developer Tools), mas filtra ~80% das tentativas casuais de
   save-as / view-source / drag-to-save-image.

   NÃO incluir em páginas futuras de leitura/conteúdo do aluno (player
   de aula, leitura de PDF, exercícios). Bloquear copy ali quebra
   acessibilidade, leitor de tela, e UX legítima (aluno citando
   trecho, copiando código de exemplo). */
(function () {
    /* Não atrapalha desenvolvimento local nem testes em staging. */
    var host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '' || host.endsWith('.local')) return;

    /* Right-click + long-press touch. */
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    /* Atalhos de save/view-source/devtools.
       ctrlKey cobre Windows/Linux; metaKey cobre macOS. */
    document.addEventListener('keydown', function (e) {
        var mod = e.ctrlKey || e.metaKey;
        var k = (e.key || '').toLowerCase();

        if (e.key === 'F12') { e.preventDefault(); return; }
        if (mod && (k === 'u' || k === 's')) { e.preventDefault(); return; }
        if (mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) { e.preventDefault(); return; }
    });

    /* Drag de imagem (vetor comum de "save image" sem usar right-click). */
    document.addEventListener('dragstart', function (e) {
        if (e.target && e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
})();
