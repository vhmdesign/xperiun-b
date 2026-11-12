/* ══════════════════════════════════════════════════════════════════════
   JANELAS DO +1 ANO BÔNUS DA BLACK FRIDAY (2 anos de acesso)

   ÚNICO lugar com essas datas. Quem lê:
     /ed/bf/oferta/            a copy (tag "+1 ano bônus", "2 anos" x "1 ano")
     /ed/bf/checkout/          o link de pagamento (2 anos x 1 ano)
     /ed/bf/vitalicio/         "Manter acesso de 2 anos" x "de 1 ano"
     /ed/bf/oferta/obrigado/   "com 2 anos de acesso" x "1 ano"

   Dentro de uma janela vale a oferta de 2 anos (1 ano + 1 ano bônus);
   fora, só 1 ano. Horário de Brasília, com o -03:00 escrito em cada
   data, pra a conta não depender do fuso de quem visita. O início entra
   na janela e o fim não (o fim é a 00:00 do dia seguinte).

   Pra mudar o calendário, mexa só aqui e suba o ?v= deste arquivo nas
   quatro páginas. A planilha temp/vagas-bf.xlsx (aba "Bônus 2 anos")
   mostra o mesmo calendário, dia a dia.

   Carregado SÍNCRONO no <head> (sem defer): as páginas decidem a copy
   antes da primeira pintura, pra não piscar a oferta errada. Se este
   arquivo não carregar, as páginas ficam na oferta de 1 ano, nas quatro
   ao mesmo tempo (o checkout também), então copy e pagamento continuam
   batendo.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var JANELAS = [
        /* Abertura: do fim do timer até o fim da fase 2. */
        { inicio: '2026-11-06T08:00:00-03:00', fim: '2026-11-10T00:00:00-03:00' },
        /* Depois da abertura, o bônus volta só nas sextas, o dia inteiro,
           até o fim da BF (23/11): a 13/11 e a 20/11. */
        { inicio: '2026-11-13T00:00:00-03:00', fim: '2026-11-14T00:00:00-03:00' },
        { inicio: '2026-11-20T00:00:00-03:00', fim: '2026-11-21T00:00:00-03:00' }
    ].map(function (j) {
        return { inicio: Date.parse(j.inicio), fim: Date.parse(j.fim) };
    });

    function ativo(t) {
        for (var i = 0; i < JANELAS.length; i++) {
            if (t >= JANELAS[i].inicio && t < JANELAS[i].fim) return true;
        }
        return false;
    }

    /* Lê o ?agora= de teste (horário de Brasília), o mesmo formato da
       /ed/bf/oferta/: 2026-11-13T12:00 ou só 2026-11-13. Sem ele, ou com
       ele inválido, é o relógio de verdade. */
    function agoraDaUrl() {
        var t = '';
        try { t = (new URLSearchParams(location.search).get('agora') || '').trim(); } catch (e) { /* URL estranha */ }
        if (!t) return Date.now();
        if (/^\d{4}-\d{2}-\d{2}$/.test(t)) t += 'T00:00';
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) t += ':00';
        if (!/(Z|[+-]\d{2}:\d{2})$/.test(t)) t += '-03:00';
        var alvo = Date.parse(t);
        return isNaN(alvo) ? Date.now() : alvo;
    }

    window.XpBonus = { JANELAS: JANELAS, ativo: ativo, agoraDaUrl: agoraDaUrl };
})();
