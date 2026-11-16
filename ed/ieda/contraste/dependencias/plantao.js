/*
 * IEDA, card "Agente de plantão" (/ed/ieda/). Portado de /temp/ieda/meia-noite-a-manha/cena.js.
 * Cria a cópia parada do primeiro frame (meia-noite, 00:00) por cima da cena animada.
 * No fim do ciclo ela esmaece por cima das 7:00; quando cobre tudo, a cena animada
 * recomeça do 0:00 por baixo, idêntica à cópia, e a cópia some de uma vez.
 * Roda antes do progressive-blur.js para a cópia também ganhar as camadas de blur.
 */
(function () {
    var animada = document.querySelector('.mn-cena-animada');
    if (!animada) return;
    var inicio = animada.cloneNode(true);
    inicio.classList.remove('mn-cena-animada');
    inicio.classList.add('mn-cena-inicio');
    inicio.setAttribute('aria-hidden', 'true');
    var rotulo = inicio.querySelector('[role="img"]');
    if (rotulo) {
        rotulo.removeAttribute('role');
        rotulo.removeAttribute('aria-label');
    }
    animada.parentNode.appendChild(inicio);

    // a lista de horários fica fora das camadas da cena; ganha a sua própria cópia parada
    // do primeiro frame, que aparece junto com a do relógio (ver .mn-evento-inicio no CSS)
    var evento = document.querySelector('.mn-evento');
    if (evento) {
        var eventoInicio = evento.cloneNode(true);
        eventoInicio.classList.add('mn-evento-inicio');
        eventoInicio.setAttribute('aria-hidden', 'true');
        evento.parentNode.insertBefore(eventoInicio, evento.nextSibling);
    }
})();
