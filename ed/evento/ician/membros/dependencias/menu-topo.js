/* Menu do topo compartilhado: injeta /ed/evento/ician/membros/dependencias/menu-topo.html no
   placeholder <div data-menu-topo> e liga o dropdown de perfil.
   (fetch precisa de servidor http/https — não funciona em file://) */
(function () {
    var slot = document.querySelector('[data-menu-topo]');
    if (!slot) return;

    fetch('/ed/evento/ician/membros/dependencias/menu-topo.html')
        .then(function (r) { return r.text(); })
        .then(function (html) {
            slot.innerHTML = html;
            ligar();
            document.dispatchEvent(new CustomEvent('menu-topo:ready'));
        })
        .catch(function () {});

    function ligar() {
        var p = new URLSearchParams(location.search);
        var nome = (p.get('nome') || '').trim();
        var email = (p.get('email') || '').trim();
        if (nome) {
            var elNome = document.querySelector('[data-perfil-nome]');
            if (elNome) elNome.textContent = nome;
            var av = document.querySelector('.menu-perfil');
            if (av) {
                av.querySelector('.menu-perfil-letra').textContent = nome.charAt(0).toUpperCase();
                av.classList.add('has-letra');
            }
        }
        if (email) {
            var elEmail = document.querySelector('[data-perfil-email]');
            if (elEmail) elEmail.textContent = email;
        }

        var perfilWrap = document.querySelector('.menu-perfil-wrap');
        if (!perfilWrap) return;
        perfilWrap.addEventListener('click', function (e) {
            var item = e.target.closest('.menu-perfil-item');
            if (item) {
                perfilWrap.classList.remove('is-open');
                if (item.matches('[data-certificado]')) {
                    e.preventDefault();
                    /* concluiu tudo → popup "Parabéns" (badge + certificado) tem prioridade */
                    if (window.XPCert && window.XPCert.abrirSeCompleto && window.XPCert.abrirSeCompleto()) return;
                    var cert = document.getElementById('aula-modal-certificado');
                    if (cert) cert.classList.add('is-open');           /* senão → popup de progresso */
                    else location.href = '/ed/evento/ician/membros/aulas/';  /* senão → vai pras aulas */
                }
                return;
            }
            e.stopPropagation();
            perfilWrap.classList.toggle('is-open');
        });
        document.addEventListener('click', function () { perfilWrap.classList.remove('is-open'); });
    }
})();
