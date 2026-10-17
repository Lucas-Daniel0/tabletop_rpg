'use strict';
/* ===== itemdb.js — catálogos revisados (Ordem Paranormal C.R.I.S. + D&D 5e SRD) =====
   Ordem: nome, dano, crítico, tipo, empunhadura, espaços e categoria seguem a transcrição do Livro Base e do suplemento
   “Sobrevivendo ao Horror” (SaH). Itens marcados “Item de mesa” NÃO estão no livro (são conveniências do app).
   D&D: valores do SRD 5.1 (custo em po/pp/pc, peso convertido para kg). Tudo é referência — confira no seu livro. */
const RN = ['0', 'I', 'II', 'III', 'IV'];
const ITEM_ALIAS = { op_granada_luz: 'op_granada_atordoamento' };          // ids antigos → ids atuais
const kg = lb => (lb * 0.4536).toFixed(lb < 1 ? 2 : 1).replace('.', ',') + ' kg';
const esp = n => String(n).replace('.', ',');

/* ---------- Ordem Paranormal ---------- */
const GRIP = { L: 'leve', 1: 'uma mão', 2: 'duas mãos' };
function OW(id, name, kind, grip, glyph, color, dmg, crit, tipo, alc, e, cat, prof, desc, alias) {
  OP(id, name, kind, grip === 2 ? 'two' : 'main', glyph, color, dmg + ' · ' + crit + ' · ' + tipo + (alc ? ' · alc. ' + alc : '') + ' · ' + GRIP[grip] + ' · ' + esp(e) + ' esp · Cat. ' + RN[cat], prof + '. ' + (desc || ''), { alias: alias || '' });
}
function OI(id, name, type, slot, glyph, color, cat, e, efeito, desc, extra) {
  OP(id, name, type, slot, glyph, color, (efeito ? efeito + ' · ' : '') + 'Cat. ' + RN[cat] + ' · ' + esp(e) + ' esp', desc || '', extra);
}
const MESA = 'Item de mesa — não consta no livro; ajuste à vontade. ';
const SAH = 'Sobrevivendo ao Horror — confira o efeito no suplemento. ';

/* armas simples */
OW('bastao', 'Bastão', 'weapon', 1, 'club', '#8a5a2c', '1d6 (1d8 com 2 mãos)', 'x2', 'impacto', '', 1, 0, 'Arma simples', 'Taco, cassetete, tonfa ou clava.', 'taco cassetete tonfa clava');
OW('cajado', 'Cajado', 'weapon', 2, 'staff', '#7a4f2a', '1d6', 'x2', 'impacto', '', 2, 0, 'Arma simples', 'Ágil. Pode ser usado com Combater com Duas Armas (conta como uma arma de uma mão + uma leve). Inclui o bo.', 'bo');
OW('faca', 'Faca', 'weapon', 'L', 'dagger', '#b9c0cb', '1d4', '19', 'corte', 'curto', 1, 0, 'Arma simples', 'Ágil e arremessável.');
OW('lanca', 'Lança', 'weapon', 1, 'spear', '#9aa0ad', '1d6', 'x2', 'perfuração', 'curto', 1, 0, 'Arma simples', 'Arremessável.');
OW('machete', 'Machete', 'weapon', 1, 'sword', '#b9c0cb', '1d6', '19', 'corte', '', 1, 0, 'Arma simples', 'Lâmina longa usada para abrir trilhas.', 'facão facao');
OW('martelo', 'Martelo', 'weapon', 'L', 'hammer', '#8a8f9c', '1d6', 'x2', 'impacto', '', 1, 0, 'Arma simples', 'Ferramenta usada como arma improvisada.');
OW('punhal', 'Punhal', 'weapon', 'L', 'dagger', '#9aa0ad', '1d4', 'x3', 'perfuração', '', 1, 0, 'Arma simples', 'Ágil. Usado por cultistas em rituais.', 'adaga');
OW('arco', 'Arco', 'ranged', 2, 'bow', '#7a4f2a', '1d6', 'x3', 'perfuração', 'médio', 2, 0, 'Arma simples · munição: flechas', 'Arco comum de tiro ao alvo.');
OW('besta', 'Besta', 'ranged', 2, 'crossbow', '#7a4f2a', '1d8', '19', 'perfuração', 'médio', 2, 0, 'Arma simples · munição: flechas', 'Recarregar é uma ação de movimento por disparo.');
OW('estilingue', 'Estilingue', 'ranged', 2, 'sling', '#a8743c', '1d4', 'x2', 'impacto', 'curto', 1, 0, 'Arma simples (SaH)', SAH, 'funda');
OW('pregador', 'Pregador Pneumático', 'ranged', 1, 'nailgun', '#c9a227', '1d4', 'x4', 'perfuração', 'curto', 1, 0, 'Arma simples (SaH)', SAH, 'pistola de pregos');
OW('fuzil_cacada', 'Fuzil de caça', 'ranged', 2, 'rifle', '#7a4f2a', '2d8', '19/x3', 'balístico', 'médio', 2, 1, 'Arma simples · munição: balas longas', 'Popular entre fazendeiros, caçadores e atiradores esportivos.');
OW('pistola', 'Pistola', 'ranged', 'L', 'pistol', '#6f7788', '1d12', '18', 'balístico', 'curto', 1, 1, 'Arma simples · munição: balas curtas', 'Arma de mão comum entre policiais e militares.');
OW('revolver', 'Revólver', 'ranged', 'L', 'revolver', '#6f7788', '2d6', '19/x3', 'balístico', 'curto', 1, 1, 'Arma simples · munição: balas curtas', 'A arma de fogo mais comum e confiável.');
OW('revolver_compacto', 'Revólver Compacto', 'ranged', 'L', 'revolver', '#8a8f9c', '2d4', '19/x3', 'balístico', 'curto', 1, 1, 'Arma simples (SaH) · balas curtas', SAH);
/* armas táticas — corpo a corpo */
OW('acha', 'Acha', 'weapon', 2, 'greataxe', '#8a8f9c', '1d12', 'x3', 'corte', '', 2, 1, 'Arma tática', 'Machado grande e pesado, usado para cortar árvores largas.', 'machado grande');
OW('corrente', 'Corrente', 'weapon', 1, 'chain', '#a9b0bf', '1d8', 'x2', 'impacto', '', 1, 0, 'Arma tática', '+2 em testes para desarmar e derrubar.');
OW('espada', 'Espada', 'weapon', 1, 'sword', '#dfe6f2', '1d8 (1d10 com 2 mãos)', '19', 'corte', '', 1, 1, 'Arma tática', 'Espada longa europeia ou cimitarra.', 'espada longa cimitarra');
OW('florete', 'Florete', 'weapon', 1, 'rapier', '#dfe6f2', '1d6', '18', 'perfuração*', '', 1, 1, 'Arma tática', 'Ágil; usado por esgrimistas. (*A transcrição consultada marca “impacto”; confira no livro.)');
OW('gadanho', 'Gadanho', 'weapon', 2, 'scythe', '#8a8f9c', '2d4', 'x4', 'corte', '', 2, 1, 'Arma tática', 'Versão grande da foice, usada com as duas mãos.', 'foice');
OW('katana', 'Katana', 'weapon', 2, 'sword', '#dfe6f2', '1d10', '19', 'corte', '', 2, 1, 'Arma tática', 'Ágil. Um veterano em Luta pode empunhá-la com uma só mão.');
OW('machadinha', 'Machadinha', 'weapon', 'L', 'hatchet', '#9aa0ad', '1d6', 'x3', 'corte', 'curto', 1, 0, 'Arma tática', 'Arremessável.');
OW('machado', 'Machado', 'weapon', 1, 'axe', '#8a8f9c', '1d8', 'x3', 'corte', '', 1, 1, 'Arma tática', 'Ferramenta de lenhadores e bombeiros.');
OW('marreta', 'Marreta', 'weapon', 2, 'sledge', '#8a8f9c', '3d4', 'x2', 'impacto', '', 2, 1, 'Arma tática', 'Serve também para outras ferramentas de construção civil.');
OW('maca', 'Maça', 'weapon', 1, 'mace', '#9aa0ad', '2d4', 'x2', 'impacto', '', 1, 1, 'Arma tática', 'Bastão com cabeça metálica cheia de protuberâncias.');
OW('montante', 'Montante', 'weapon', 2, 'greatsword', '#dfe6f2', '2d6', '19', 'corte', '', 2, 1, 'Arma tática', 'Espada de 1,5 m.');
OW('motosserra', 'Motosserra', 'weapon', 2, 'chainsaw', '#d9a62e', '3d6', 'x2', 'corte', '', 2, 1, 'Arma tática', 'Cada 6 rolado nos dados de dano gera 1 dado extra. Desajeitada: −1d20 nos ataques. Ligar é uma ação de movimento.', 'motoserra serra elétrica');
OW('nunchaku', 'Nunchaku', 'weapon', 'L', 'nunchaku', '#7a4f2a', '1d8', 'x2', 'impacto', '', 1, 0, 'Arma tática', 'Ágil.');
OW('baioneta', 'Baioneta', 'weapon', 'L', 'dagger', '#a9b0bf', '1d4', '19', 'perfuração', '', 1, 0, 'Arma tática (SaH)', SAH);
OW('bastao_policial', 'Bastão Policial', 'weapon', 1, 'club', '#3a3f4a', '1d6', 'x2', 'impacto', 'curto', 1, 1, 'Arma tática (SaH)', SAH + 'Ágil.', 'cassetete tonfa');
OW('gancho_carne', 'Gancho de Carne', 'weapon', 'L', 'hook', '#a9b0bf', '1d4', 'x4', 'perfuração', '', 1, 0, 'Arma tática (SaH)', SAH);
OW('picareta', 'Picareta', 'weapon', 1, 'pickaxe', '#8a8f9c', '1d6', 'x4', 'perfuração', '', 1, 0, 'Arma tática (SaH)', SAH);
OW('faca_tatica', 'Faca Tática', 'weapon', 1, 'dagger', '#4a5a3a', '1d6', '19', 'corte', 'curto', 1, 1, 'Arma tática (SaH)', SAH + 'Ágil e arremessável.');
OW('shuriken', 'Shuriken', 'ranged', 1, 'shuriken', '#a9b0bf', '1d4', 'x2', 'perfuração', 'curto', 0.5, 1, 'Arma tática (SaH)', SAH + 'Arremessável.', 'estrela ninja');
/* armas táticas — disparo e fogo */
OW('arco_composto', 'Arco composto', 'ranged', 2, 'bow', '#a8743c', '1d10', 'x3', 'perfuração', 'médio', 2, 1, 'Arma tática · munição: flechas', 'Permite somar Força ao dano.');
OW('balestra', 'Balestra', 'ranged', 2, 'crossbow', '#5a3a1c', '1d12', '19', 'perfuração', 'médio', 2, 1, 'Arma tática · munição: flechas', 'Besta pesada. Recarregar é uma ação de movimento por disparo.');
OW('espingarda', 'Espingarda', 'ranged', 2, 'shotgun', '#7a4f2a', '4d6', 'x3', 'balístico', 'curto', 2, 1, 'Arma tática · munição: cartuchos', 'Dano pela metade em alcance médio ou maior.', 'escopeta shotgun');
OW('espingarda_dupla', 'Espingarda de Cano Duplo', 'ranged', 2, 'shotgun', '#5a3a1c', '4d6', 'x3', 'balístico', 'curto', 2, 2, 'Arma tática (SaH) · cartuchos', SAH, 'escopeta cano duplo');
OW('submetralhadora', 'Submetralhadora', 'ranged', 1, 'smg', '#6f7788', '2d6', '19/x3', 'balístico', 'curto', 1, 1, 'Arma tática · balas curtas', 'Automática; pode ser empunhada com uma mão.', 'smg');
OW('fuzil_assalto', 'Fuzil de assalto', 'ranged', 2, 'rifle', '#4a5a3a', '2d10', '19/x3', 'balístico', 'médio', 2, 2, 'Arma tática · balas longas', 'Arma automática.');
OW('fuzil_precisao', 'Fuzil de precisão', 'ranged', 2, 'rifle', '#3a3f4a', '2d10', '19/x3', 'balístico', 'longo', 2, 3, 'Arma tática · balas longas', 'Veterano em Pontaria que mira com ele recebe +5 na margem de ameaça.', 'sniper');
OW('pistola_pesada', 'Pistola Pesada', 'ranged', 1, 'pistol', '#3a3f4a', '2d8', '18', 'balístico', 'curto', 1, 1, 'Arma tática (SaH) · balas curtas', SAH);
/* armas pesadas */
OW('bazuca', 'Bazuca', 'ranged', 2, 'bazooka', '#5f6e3f', '10d8', 'x2', 'impacto', 'médio', 2, 3, 'Arma pesada · munição: foguetes', 'Dano em raio de 3 m; Reflexos (DT Agi) reduz à metade nos seres ao redor (não no alvo direto). Pode mirar um ponto. Recarga: ação de movimento.', 'lança-foguetes');
OW('lanca_chamas', 'Lança-chamas', 'ranged', 2, 'flamethrower', '#c9552a', '6d6', 'x2', 'fogo', 'curto', 2, 3, 'Arma pesada · munição: combustível', 'Linha de 1,5 m de largura; um único ataque contra a Defesa de todos na área; os alvos ficam em chamas.', 'lança chamas');
OW('metralhadora', 'Metralhadora', 'ranged', 2, 'mg', '#4a5a3a', '2d12', '19/x3', 'balístico', 'médio', 2, 2, 'Arma pesada · balas longas', 'Automática. Exige Força 4+ ou ação de movimento para apoiar no tripé; senão −5 no ataque.');

/* proteções */
OP('prot_leve', 'Proteção leve', 'armor', 'body', 'vest', '#5a6173', 'Defesa +5 · Cat. I · 2 esp', 'Jaqueta de couro pesada ou colete de kevlar, típica de seguranças e policiais.');
OP('prot_pesada', 'Proteção pesada', 'armor', 'body', 'armor', '#6f7788', 'Defesa +10 · RD 2 (balístico/corte/impacto/perfuração) · −5 em perícias com carga · Cat. II · 5 esp', 'Capacete, ombreiras, joelheiras, caneleiras e colete de kevlar em várias camadas.');
OP('escudo', 'Escudo', 'shield', 'off', 'shield', '#5a6173', 'Defesa +2 · acumula com a proteção · Cat. I · 1 esp', 'Conta como proteção pesada para proficiência.', { alias: 'escudo antitumulto' });
OI('hazmat', 'Traje Hazmat', 'armor', 'body', 'hazmat', '#f2d34c', 1, 2, '+5 em resistência a efeitos ambientais · resistência a químico 10', 'Proteção contra contaminação química e biológica.');
OI('bracadeira', 'Braçadeira Reforçada', 'armor', 'acc', 'gauntlet', '#6f7788', 1, 1, '', SAH);
OI('traje_mergulho', 'Traje de Mergulho', 'wear', 'body', 'hazmat', '#3a6aa0', 1, 2, '', SAH);
OI('traje_espacial', 'Traje Espacial', 'wear', 'body', 'hazmat', '#e9edf5', 2, 5, '', SAH);

/* explosivos */
OI('granada_atordoamento', 'Granada de Atordoamento', 'consumable', null, 'flashbang', '#ffe58a', 0, 1, 'Atordoa por 1 rodada · raio 6 m · Fort (DT Agi) reduz a ofuscado e surdo', 'Também chamada de flash-bang. Ação padrão para arremessar em alcance médio.', { alias: 'granada de luz flash flashbang' });
OI('granada_fumaca', 'Granada de Fumaça', 'consumable', null, 'smoke', '#9aa0ad', 0, 1, 'Cega e dá camuflagem total · raio 6 m · dura 2 rodadas', 'Ação padrão para arremessar em alcance médio.');
OI('granada_frag', 'Granada de Fragmentação', 'consumable', null, 'grenade', '#6b7a45', 1, 1, '8d6 perfuração · raio 6 m · Reflexos (DT Agi) metade', 'Arremessada em alcance médio (ação padrão).');
OI('granada_incendiaria', 'Granada Incendiária', 'consumable', null, 'molotov', '#e0552a', 1, 1, '6d6 fogo + em chamas · raio 6 m · Reflexos (DT Agi) metade e evita', 'Arremessada em alcance médio (ação padrão).', { alias: 'molotov' });
OI('mina', 'Mina Antipessoal', 'consumable', null, 'mine', '#6b7a45', 1, 1, '12d6 perfuração · cone 6 m · Reflexos (DT Int) metade', 'Detonada por controle remoto em alcance longo. Instalar: ação completa + Tática (DT 15).');
OI('dinamite', 'Dinamite', 'consumable', null, 'dynamite', '#d11d2a', 1, 1, '', SAH);
OI('explosivo_plastico', 'Explosivo Plástico', 'consumable', null, 'box', '#d8c79c', 1, 1, '', SAH, { alias: 'c4 plástico' });
OI('galao_vermelho', 'Galão Vermelho', 'consumable', null, 'gallon', '#d11d2a', 0, 2, '', SAH);
OI('granada_sonifero', 'Granada de Gás Sonífero', 'consumable', null, 'smoke', '#6fb27a', 1, 1, '', SAH);
OI('granada_pem', 'Granada de PEM', 'consumable', null, 'grenade', '#5aa0e8', 1, 1, '', SAH, { alias: 'pulso eletromagnético' });

/* munições */
OI('balas_curtas', 'Balas Curtas', 'consumable', null, 'bullets', '#d9a62e', 0, 1, 'Pistolas, revólveres e submetralhadoras · dura 2 cenas', '');
OI('balas_longas', 'Balas Longas', 'consumable', null, 'bullets', '#c98a2a', 1, 0.05, 'Fuzis e metralhadoras · dura 1 cena', '(Espaços: a transcrição consultada traz 0,05; confira no livro.)');
OI('cartuchos', 'Cartuchos', 'consumable', null, 'shells', '#c1121f', 1, 1, 'Espingardas · dura 1 cena', '');
OI('combustivel', 'Combustível', 'consumable', null, 'gallon', '#e0a02a', 1, 1, 'Lança-chamas', '');
OI('flechas', 'Flechas', 'consumable', null, 'arrows', '#a8743c', 0, 1, 'Arcos e bestas · reaproveitáveis · dura a missão', '');
OI('foguetes', 'Foguetes', 'consumable', null, 'box', '#6b7a45', 0, 1, 'Bazuca · 1 foguete = 1 disparo', '');

/* acessórios e itens operacionais */
OI('kit_pericia', 'Kit de perícia', 'tool', null, 'tools', '#b9c0cb', 0, 1, 'Sem o kit, −5 no teste da perícia', 'Ferramentas de uma perícia (ex.: Ladinagem, Mecânica, Medicina). Existe um kit por perícia que exige item.', { alias: 'kit de medicina ferramentas' });
OI('utensilio', 'Utensílio', 'tool', null, 'gear', '#b9c0cb', 1, 1, '', 'Objeto útil que ajuda numa perícia (efeito definido pelo mestre).');
OI('vestimenta', 'Vestimenta', 'wear', 'acc', 'shirt', '#5a6173', 1, 1, '+2 em uma perícia (exceto Luta e Pontaria) · máx. 2 vestimentas', 'Vestir/despir: ação completa. O benefício é aprovado pelo mestre.');
OI('algemas', 'Algemas', 'tool', null, 'cuffs', '#a9b0bf', 0, 1, 'Pulsos presos: −5 em testes manuais e sem conjurar · escapar: Acrobacia DT 30', '');
OI('arpeu', 'Arpéu', 'tool', null, 'grapple', '#a9b0bf', 0, 1, 'Fixar: Pontaria DT 15 · +5 em Atletismo para subir', 'Gancho preso a uma corda.');
OI('bandoleira', 'Bandoleira', 'tool', 'acc', 'bag', '#7a4f2a', 1, 1, '1x/rodada sacar ou guardar um item como ação livre', '');
OI('binoculos', 'Binóculos', 'tool', null, 'binoculars', '#4a4f5c', 0, 1, '+5 em Percepção para coisas distantes', '');
OI('bloqueador', 'Bloqueador de Sinal', 'tool', null, 'radio', '#3a3d49', 1, 1, 'Impede celulares em alcance médio de se conectar', '');
OI('corda', 'Corda', 'tool', null, 'rope', '#d4b878', 0, 1, '10 m · +5 em Atletismo (descer)', 'Para escalar, descer ou prender.');
OI('equip_sobrevivencia', 'Equipamento de Sobrevivência', 'tool', null, 'tent', '#6b7a45', 0, 2, '+5 em Sobrevivência (acampar/orientar-se) · permite o teste sem treino', 'Mochila de camping com GPS.');
OI('lanterna_tatica', 'Lanterna Tática', 'tool', 'light', 'flashlight', '#ffd24d', 1, 1, 'Ação de movimento: ofusca um ser em alcance curto por 1 rodada', 'Fonte de luz portátil.', { light: [6, '#fff1cf', false], alias: 'lanterna' });
OI('mascara_gas', 'Máscara de Gás', 'wear', 'head', 'gasmask', '#3a3d49', 0, 1, '+10 em Fortitude contra efeitos de respiração', '', { alias: 'máscara de gás' });
OI('mochila_militar', 'Mochila Militar', 'tool', 'back', 'bag', '#4a5a3a', 1, 0, 'Não ocupa espaço · +2 de capacidade de carga', '');
OI('oculos_termico', 'Óculos de Visão Térmica', 'wear', 'head', 'goggles', '#c9552a', 1, 1, 'Elimina a penalidade por camuflagem', '');
OI('pe_cabra', 'Pé de Cabra', 'tool', 'main', 'crowbar', '#6f7788', 0, 1, '+5 em Força para arrombar · pode ser usado como bastão', '');
OI('pistola_dardos', 'Pistola de Dardos', 'ranged', 'main', 'pistol', '#5a8a6a', 1, 1, 'Dardo sonífero: inconsciente até o fim da cena (Fort DT Agi reduz) · 2 dardos', 'Caixa extra de 2 dardos: Cat. 0, 1 esp.');
OI('pistola_sinalizadora', 'Pistola Sinalizadora', 'ranged', 'main', 'pistol', '#e0552a', 0, 1, '2d6 fogo · alcance curto · 2 cargas', 'Arma de disparo leve. Caixa extra de 2 cargas: Cat. 0, 1 esp.');
OI('soqueira', 'Soqueira', 'weapon', 'main', 'knuckles', '#a9b0bf', 0, 1, '+1 de dano desarmado', 'Aceita modificações e maldições de armas corpo a corpo.');
OI('spray_pimenta', 'Spray de Pimenta', 'consumable', null, 'spray', '#d11d2a', 1, 1, 'Adjacente: cego 1d4 rodadas (Fort DT Agi evita) · 2 usos', '');
OI('taser', 'Taser', 'weapon', 'main', 'taser', '#ffe58a', 1, 1, 'Adjacente: 1d6 eletricidade + atordoado 1 rodada (Fort DT Agi evita) · 2 usos', '');
OI('cicatrizante', 'Cicatrizante', 'consumable', null, 'spray', '#3ec06e', 1, 1, 'Ação padrão: cura 2d8+2 PV em você ou num ser adjacente', 'Spray cicatrizante.');
/* Sobrevivendo ao Horror */
OI('amuleto_sagrado', 'Amuleto Sagrado', 'wear', 'acc', 'amulet', '#e2b53a', 0, 1, '', SAH);
OI('celular', 'Celular', 'tool', null, 'phone', '#262930', 0, 1, '', SAH);
OI('chave_fenda', 'Chave de Fenda Universal', 'tool', null, 'tools', '#b9c0cb', 0, 1, '', SAH);
OI('chaves', 'Chaves', 'tool', null, 'key', '#e2b53a', 0, 1, '', SAH);
OI('documentos_falsos', 'Documentos Falsos', 'tool', null, 'scroll', '#d8c79c', 1, 1, '', SAH);
OI('manual_operacional', 'Manual Operacional', 'tool', null, 'book', '#4a5a3a', 1, 1, '', SAH);
OI('notebook', 'Notebook', 'tool', null, 'laptop', '#4a4f5c', 0, 2, '', SAH, { alias: 'laptop computador' });
OI('alarme_movimento', 'Alarme de Movimento', 'tool', null, 'radio', '#c1121f', 0, 1, '', SAH);
OI('alimento_energetico', 'Alimento Energético', 'consumable', null, 'food', '#c78b4a', 2, 1, '', SAH);
OI('aplicador', 'Aplicador de Medicamentos', 'tool', null, 'pills', '#3ec06e', 0, 1, '', SAH);
OI('cao_adestrado', 'Cão Adestrado', 'misc', null, 'paw', '#a8743c', 1, 0, '', SAH + 'Não ocupa espaço.');
OI('coldre', 'Coldre Saque Rápido', 'tool', 'acc', 'bag', '#2f3038', 1, 1, '', SAH);
OI('oculos_noturno', 'Óculos de Visão Noturna', 'wear', 'head', 'goggles', '#3fb06a', 1, 1, '', SAH);
OI('oculos_escuros', 'Óculos Escuros', 'wear', 'head', 'goggles', '#262930', 0, 1, '', SAH);
OI('escuta', 'Equipamento de Escuta', 'tool', null, 'radio', '#262930', 1, 1, '', SAH);
OI('estrepes', 'Estrepes (saco)', 'tool', null, 'caltrops', '#a9b0bf', 0, 1, '', SAH);
OI('faixa_pregos', 'Faixa de Pregos', 'tool', null, 'caltrops', '#6f7788', 1, 2, '', SAH);
OI('isqueiro', 'Isqueiro', 'tool', null, 'lighter', '#a9b0bf', 0, 0.5, '', SAH);
OI('pa', 'Pá', 'tool', null, 'shovel', '#7a4f2a', 0, 2, '', SAH);
OI('paraquedas', 'Paraquedas', 'tool', 'back', 'parachute', '#e0552a', 1, 2, '', SAH);
/* medicamentos (SaH) */
for (const [id, n] of [['antidoto', 'Antídoto'], ['antiinflamatorio', 'Anti-inflamatório'], ['antibiotico', 'Antibiótico'], ['antiemetico', 'Antiemético'], ['antihistaminico', 'Antihistamínico'], ['antitermico', 'Antitérmico'], ['broncodilatador', 'Broncodilatador'], ['coagulante', 'Coagulante']])
  OI(id, n, 'consumable', null, 'pills', '#e08a2a', 1, 0.5, 'Medicamento', SAH);
/* itens paranormais */
OI('ligacao_infernal', 'Ligação Direta Infernal', 'magic', null, 'bolt', '#a455e8', 2, 1, '', SAH, { elem: 'energia' });
OI('medidor_membrana', 'Medidor de Estabilidade da Membrana', 'magic', null, 'gear', '#5aa0e8', 2, 1, '', SAH);
OI('pe_morto', 'Pé de Morto', 'magic', 'acc', 'boots', '#9aa0ad', 2, 1, '', SAH, { elem: 'morte' });
OI('pen_drive', 'Pen Drive Selado', 'magic', null, 'gem', '#5aa0e8', 2, 0.5, '', SAH);
OI('valete', 'Valete da Salvação', 'magic', null, 'cards', '#e2b53a', 1, 0.5, '', SAH);
OI('camera_aura', 'Câmera de Aura Paranormal', 'magic', null, 'eye', '#e2b53a', 2, 1, '', 'Livro Base — efeito: veja o livro.', { elem: 'conhecimento' });
OI('emissor_pulsos', 'Emissor de Pulsos Paranormais', 'magic', null, 'radio', '#a455e8', 2, 1, '', 'Livro Base — efeito: veja o livro.');
OI('escuta_paranormal', 'Escuta de Ruídos Paranormais', 'magic', null, 'radio', '#e8e8ee', 2, 1, '', 'Livro Base — efeito: veja o livro.');
OI('scanner', 'Scanner de Manifestação Paranormal', 'magic', null, 'gear', '#3fd0bd', 2, 1, '', 'Livro Base — existe um por elemento; efeito: veja o livro.');
OI('medidor_vertebral', 'Medidor de Condição Vertebral', 'magic', 'acc', 'vest', '#c1121f', 2, 1, '+2 em Fortitude · +5 em Medicina para auxiliar o usuário', 'Indica a saúde por luzes. Conectar: ação completa (deixa atordoado 1 rodada).');
const EL4 = [['sangue', 'Sangue', '#c1121f'], ['morte', 'Morte', '#9aa0ad'], ['conhecimento', 'Conhecimento', '#e2b53a'], ['energia', 'Energia', '#a455e8']];
for (const [ek, en, ec] of EL4) {
  OI('amarras_' + ek, 'Amarras de ' + en, 'magic', null, 'chain', ec, 2, 1, '', 'Livro Base — efeito: veja o livro.', { elem: ek });
  OI('componente_' + ek, 'Componente Ritualístico de ' + en, 'misc', null, 'ritual', ec, 0, 1, 'Necessário para conjurar rituais de ' + en, '', { elem: ek });
  for (const ct of ['Ampliador', 'Perturbador', 'Potencializador', 'Prolongador'])
    OI('cat_' + ct.toLowerCase() + '_' + ek, ct + ' de ' + en, 'magic', null, 'catalyst', ec, 1, 0.5, 'Catalisador ritualístico', SAH, { elem: ek });
}
/* exemplos paranormais do app (itens de mesa) */
OP('adaga_sangue', 'Adaga Rubra', 'magic', 'main', 'dagger', '#c1121f', '1d4+1 · 19 · corte · Sangue', MESA + 'Exemplo amaldiçoado: o cabo pulsa como um batimento.', { elem: 'sangue' });
OP('calice', 'Cálice Carmesim', 'magic', null, 'drop', '#c1121f', 'Sangue', MESA + 'Objeto ritualístico ligado ao Sangue.', { elem: 'sangue' });
OP('mascara_morte', 'Máscara Mortuária', 'magic', 'head', 'mask', '#aab0bd', 'Morte', MESA + 'Um rosto de gesso frio ao toque.', { elem: 'morte' });
OP('cranio', 'Crânio Sussurrante', 'magic', null, 'skull', '#e9e2cf', 'Morte', MESA + 'Sussurra nomes de quem já se foi.', { elem: 'morte' });
OP('grimorio', 'Grimório Proibido', 'magic', null, 'book', '#d9a82a', 'Conhecimento', MESA + 'Páginas que mudam de texto.', { elem: 'conhecimento' });
OP('olho_vidro', 'Olho de Vidro', 'magic', 'acc', 'eye', '#e2b53a', 'Conhecimento', MESA + 'Enxerga o que está oculto.', { elem: 'conhecimento' });
OP('bobina', 'Bobina Instável', 'magic', null, 'bolt', '#a455e8', 'Energia', MESA + 'Faísca roxa sem fonte de energia.', { elem: 'energia' });
OP('cristal', 'Cristal Pulsante', 'magic', 'acc', 'gem', '#a455e8', 'Energia', MESA + 'Vibra perto de rituais.', { elem: 'energia', light: [3, '#c9a0ff', false] });
OP('vela_negra', 'Vela Negra', 'magic', 'light', 'candle', '#e8e8ee', 'Medo', MESA + 'A chama não projeta sombra.', { elem: 'medo', light: [3, '#d8d8ff', true] });
OP('mascara_medo', 'Máscara do Pavor', 'magic', 'head', 'mask', '#e8e8ee', 'Medo', MESA + 'O rosto parece mudar quando ninguém olha.', { elem: 'medo' });
/* conveniências do app (não estão no livro) */
OP('capacete', 'Capacete', 'wear', 'head', 'helm', '#4a5a3a', 'Proteção na cabeça', MESA + 'No livro, o capacete já faz parte da Proteção Pesada.');
OP('lampiao', 'Lampião', 'tool', 'light', 'lantern', '#ffb347', 'Ilumina ~7,5 m', MESA + 'Luz quente e tremulante.', { light: [5, '#ffb347', true] });
OP('kit_medicina', 'Kit de medicina', 'consumable', null, 'medkit', '#d11d2a', 'Cura / estabiliza', MESA + 'Bandagens, antissépticos e suturas. No livro, veja Cicatrizante e o Kit de perícia (Medicina).');
OP('mochila', 'Mochila', 'tool', 'back', 'bag', '#7a4f2a', 'Carga +', MESA + 'No livro, veja a Mochila Militar.');
OP('radio', 'Rádio comunicador', 'tool', null, 'radio', '#5a6173', 'Alcance médio', MESA + 'Comunicação com a equipe.');
OP('lanterna', 'Lanterna', 'tool', 'light', 'flashlight', '#ffd24d', 'Ilumina ~9 m', MESA + 'Fonte de luz portátil. No livro, veja a Lanterna Tática.', { light: [6, '#fff1cf', false] });
OP('chave_misteriosa', 'Chave misteriosa', 'misc', null, 'key', '#e2b53a', '—', MESA + 'Abre algo que ainda não foi encontrado.');

/* ---------- D&D 5e (SRD 5.1) ---------- */
function DW(id, name, cat, grip, glyph, color, stats, custo, lb, desc, extra) {
  DN(id, name, cat, grip === 2 ? 'two' : 'main', glyph, color, stats, 'Custo ' + custo + (lb ? ' · ' + kg(lb) : '') + (desc ? ' · ' + desc : ''), extra);
}
function DG(id, name, cat, slot, glyph, color, stats, custo, lb, desc, extra) {
  DN(id, name, cat, slot, glyph, color, stats, (custo ? 'Custo ' + custo : '') + (lb ? ' · ' + kg(lb) : '') + (desc ? ' · ' + desc : ''), extra);
}
/* simples — corpo a corpo */
DW('club', 'Clava', 'weapon', 1, 'club', '#8a5a2c', '1d4 contundente · leve', '1 pp', 2);
DW('dagger', 'Adaga', 'weapon', 1, 'dagger', '#b9c0cb', '1d4 perfurante · acuidade, leve, arremesso (6/18 m)', '2 po', 1);
DW('greatclub', 'Clava grande', 'weapon', 2, 'club', '#7a4f2a', '1d8 contundente · duas mãos', '2 pp', 10);
DW('handaxe', 'Machadinha', 'weapon', 1, 'hatchet', '#9aa0ad', '1d6 cortante · leve, arremesso (6/18 m)', '5 po', 2);
DW('javelin', 'Azagaia', 'weapon', 1, 'spear', '#9aa0ad', '1d6 perfurante · arremesso (9/36 m)', '5 pp', 2);
DW('lighthammer', 'Martelo leve', 'weapon', 1, 'hammer', '#8a8f9c', '1d4 contundente · leve, arremesso (6/18 m)', '2 po', 2);
DW('mace', 'Maça', 'weapon', 1, 'mace', '#9aa0ad', '1d6 contundente', '5 po', 4);
DW('quarterstaff', 'Bordão', 'weapon', 1, 'staff', '#7a4f2a', '1d6 contundente · versátil (1d8)', '2 pp', 4);
DW('sickle', 'Foice', 'weapon', 1, 'sickle', '#a9b0bf', '1d4 cortante · leve', '1 po', 2);
DW('spear', 'Lança', 'weapon', 1, 'spear', '#9aa0ad', '1d6 perfurante · arremesso (6/18 m), versátil (1d8)', '1 po', 3);
/* simples — distância */
DW('lightcrossbow', 'Besta leve', 'ranged', 2, 'crossbow', '#7a4f2a', '1d8 perfurante · 24/96 m · recarga, duas mãos', '25 po', 5);
DW('dart', 'Dardo', 'ranged', 1, 'dart', '#a9b0bf', '1d4 perfurante · acuidade, arremesso (6/18 m)', '5 pc', 0.25);
DW('shortbow', 'Arco curto', 'ranged', 2, 'bow', '#7a4f2a', '1d6 perfurante · 24/96 m · duas mãos', '25 po', 2);
DW('sling', 'Funda', 'ranged', 1, 'sling', '#a8743c', '1d4 contundente · 9/36 m', '1 pp', 0);
/* marciais — corpo a corpo */
DW('battleaxe', 'Machado de batalha', 'weapon', 1, 'axe', '#9aa0ad', '1d8 cortante · versátil (1d10)', '10 po', 4);
DW('flail', 'Mangual', 'weapon', 1, 'flail', '#9aa0ad', '1d8 contundente', '10 po', 2);
DW('glaive', 'Glaive', 'weapon', 2, 'halberd', '#a9b0bf', '1d10 cortante · pesada, alcance 3 m, duas mãos', '20 po', 6);
DW('greataxe', 'Machado grande', 'weapon', 2, 'greataxe', '#8a8f9c', '1d12 cortante · pesada, duas mãos', '30 po', 7, '', { alias: 'acha' });
DW('greatsword', 'Montante', 'weapon', 2, 'greatsword', '#dfe6f2', '2d6 cortante · pesada, duas mãos', '50 po', 6);
DW('halberd', 'Alabarda', 'weapon', 2, 'halberd', '#a9b0bf', '1d10 cortante · pesada, alcance 3 m, duas mãos', '20 po', 6);
DW('lance', 'Lança de montaria', 'weapon', 1, 'spear', '#c9a227', '1d12 perfurante · alcance 3 m, especial', '10 po', 6, 'Desvantagem contra alvos a menos de 1,5 m; uma mão se montado.', { alias: 'lança de cavalaria' });
DW('longsword', 'Espada longa', 'weapon', 1, 'sword', '#dfe6f2', '1d8 cortante · versátil (1d10)', '15 po', 3);
DW('maul', 'Malho', 'weapon', 2, 'sledge', '#8a8f9c', '2d6 contundente · pesada, duas mãos', '10 po', 10, '', { alias: 'marreta' });
DW('morningstar', 'Maça estrela', 'weapon', 1, 'mace', '#a9b0bf', '1d8 perfurante', '15 po', 4);
DW('pike', 'Pique', 'weapon', 2, 'spear', '#9aa0ad', '1d10 perfurante · pesada, alcance 3 m, duas mãos', '5 po', 18);
DW('rapier', 'Rapieira', 'weapon', 1, 'rapier', '#dfe6f2', '1d8 perfurante · acuidade', '25 po', 2);
DW('scimitar', 'Cimitarra', 'weapon', 1, 'sword', '#c9d0dc', '1d6 cortante · acuidade, leve', '25 po', 3);
DW('shortsword', 'Espada curta', 'weapon', 1, 'sword', '#b9c0cb', '1d6 perfurante · acuidade, leve', '10 po', 2);
DW('trident', 'Tridente', 'weapon', 1, 'trident', '#5aa0c8', '1d6 perfurante · arremesso (6/18 m), versátil (1d8)', '5 po', 4);
DW('warpick', 'Picareta de guerra', 'weapon', 1, 'pickaxe', '#8a8f9c', '1d8 perfurante', '5 po', 2);
DW('warhammer', 'Martelo de guerra', 'weapon', 1, 'hammer', '#8a8f9c', '1d8 contundente · versátil (1d10)', '15 po', 2);
DW('whip', 'Chicote', 'weapon', 1, 'whip', '#a8743c', '1d4 cortante · acuidade, alcance 3 m', '2 po', 3);
/* marciais — distância */
DW('blowgun', 'Zarabatana', 'ranged', 1, 'blowgun', '#7a4f2a', '1 perfurante · 7,5/30 m · munição, recarga', '10 po', 1);
DW('handcrossbow', 'Besta de mão', 'ranged', 1, 'crossbow', '#7a4f2a', '1d6 perfurante · 9/36 m · leve, recarga', '75 po', 3);
DW('heavycrossbow', 'Besta pesada', 'ranged', 2, 'crossbow', '#5a3a1c', '1d10 perfurante · 30/120 m · pesada, recarga, duas mãos', '50 po', 18);
DW('longbow', 'Arco longo', 'ranged', 2, 'bow', '#8a5a2a', '1d8 perfurante · 45/180 m · pesada, duas mãos', '50 po', 2);
DW('net', 'Rede', 'ranged', 1, 'net', '#d4b878', 'Sem dano · 1,5/4,5 m · arremesso, especial', '1 po', 3, 'Prende uma criatura Grande ou menor.');
/* munição */
DG('arrows', 'Flechas (20)', 'consumable', null, 'arrows', '#a8743c', 'Munição de arco', '1 po', 1);
DG('bolts', 'Virotes de besta (20)', 'consumable', null, 'arrows', '#7a4f2a', 'Munição de besta', '1 po', 1.5);
DG('needles', 'Agulhas de zarabatana (50)', 'consumable', null, 'dart', '#a9b0bf', 'Munição de zarabatana', '1 po', 1);
DG('bullets', 'Balas de funda (20)', 'consumable', null, 'bullets', '#8a8f9c', 'Munição de funda', '4 pc', 1.5);
/* armaduras e escudo */
DG('padded', 'Armadura acolchoada', 'armor', 'body', 'vest', '#c9b88a', 'CA 11 + Des · desv. furtividade', '5 po', 8, 'Armadura leve.');
DG('leather', 'Armadura de couro', 'armor', 'body', 'vest', '#8a5a2a', 'CA 11 + Des', '10 po', 10, 'Armadura leve.');
DG('studded', 'Couro batido', 'armor', 'body', 'vest', '#6b4423', 'CA 12 + Des', '45 po', 13, 'Armadura leve.');
DG('hide', 'Gibão de peles', 'armor', 'body', 'vest', '#a8743c', 'CA 12 + Des (máx. 2)', '10 po', 12, 'Armadura média.');
DG('chainshirt', 'Camisão de malha', 'armor', 'body', 'armor', '#9aa0ad', 'CA 13 + Des (máx. 2)', '50 po', 20, 'Armadura média.');
DG('scale', 'Brunea', 'armor', 'body', 'armor', '#8a8f9c', 'CA 14 + Des (máx. 2) · desv. furtividade', '50 po', 45, 'Armadura média.');
DG('breastplate', 'Peitoral', 'armor', 'body', 'breastplate', '#c3c9d4', 'CA 14 + Des (máx. 2)', '400 po', 20, 'Armadura média.');
DG('halfplate', 'Meia-armadura', 'armor', 'body', 'armor', '#a9b0bf', 'CA 15 + Des (máx. 2) · desv. furtividade', '750 po', 40, 'Armadura média.');
DG('ringmail', 'Cota de anéis', 'armor', 'body', 'armor', '#7a8090', 'CA 14 · desv. furtividade', '30 po', 40, 'Armadura pesada.');
DG('chainmail', 'Cota de malha', 'armor', 'body', 'armor', '#9aa0ad', 'CA 16 · For 13 · desv. furtividade', '75 po', 55, 'Armadura pesada.');
DG('splint', 'Cota de talas', 'armor', 'body', 'armor', '#8a8f9c', 'CA 17 · For 15 · desv. furtividade', '200 po', 60, 'Armadura pesada.');
DG('plate', 'Armadura de placas', 'armor', 'body', 'armor', '#c3c9d4', 'CA 18 · For 15 · desv. furtividade', '1.500 po', 65, 'Armadura pesada.');
DG('shield', 'Escudo', 'shield', 'off', 'shield', '#b8352a', '+2 CA', '10 po', 6);
DN('helm', 'Elmo', 'wear', 'head', 'helm', '#9aa0ad', 'Item de ambientação', 'Não é equipamento do SRD.');
/* equipamento de aventura */
DG('torch', 'Tocha', 'tool', 'light', 'torch', '#ff9a3a', 'Luz plena 6 m · penumbra +6 m', '1 pc', 1, 'Queima por 1 hora.', { light: [4, '#ff9a3a', true] });
DG('lamp', 'Lamparina', 'tool', 'light', 'lantern', '#ffcf7a', 'Luz plena 4,5 m · penumbra +9 m', '5 pp', 1, 'Queima por 6 horas por frasco de óleo.', { light: [3, '#ffcf7a', true] });
DG('hoodedlantern', 'Lanterna coberta', 'tool', 'light', 'lantern', '#ffb347', 'Luz plena 9 m · penumbra +9 m', '5 po', 2, 'Queima por 6 horas por frasco de óleo.', { light: [6, '#ffcf7a', true] });
DG('bullseye', 'Lanterna de foco', 'tool', 'light', 'lantern', '#ffe1a0', 'Cone de 18 m (luz plena) + 18 m (penumbra)', '10 po', 2, 'Queima por 6 horas por frasco de óleo.', { light: [9, '#ffe1a0', false] });
DG('candle', 'Vela', 'tool', 'light', 'candle', '#f2e6c4', 'Luz plena 1,5 m · penumbra +1,5 m', '1 pc', 0, 'Queima por 1 hora.', { light: [1, '#ffcf7a', true] });
DG('oil', 'Óleo (frasco)', 'consumable', null, 'jug', '#c9a227', 'Combustível ou arremesso (fogo)', '1 pp', 1);
DG('tinderbox', 'Pederneira', 'tool', null, 'lighter', '#a9b0bf', 'Acende fogo', '5 pp', 1);
DG('backpack', 'Mochila', 'tool', 'back', 'bag', '#7a4f2a', 'Cabe equipamento de aventura', '2 po', 5);
DG('sack', 'Saco', 'tool', null, 'bag', '#c9b88a', '', '1 pc', 0.5);
DG('pouch', 'Bolsa', 'tool', 'acc', 'bag', '#8a5a2a', 'Bolsa de cinto', '5 pp', 1);
DG('rope', 'Corda de cânhamo (15 m)', 'tool', null, 'rope', '#d4b878', '2 PV · CD 17 para arrebentar', '1 po', 10);
DG('ropesilk', 'Corda de seda (15 m)', 'tool', null, 'rope', '#e8e2d0', '', '10 po', 5);
DG('chain', 'Corrente (3 m)', 'tool', null, 'chain', '#a9b0bf', '10 PV · CD 20 para arrebentar', '5 po', 10);
DG('crowbar', 'Pé de cabra', 'tool', null, 'crowbar', '#6f7788', 'Vantagem em testes de Força para arrombar', '2 po', 5);
DG('hammer', 'Martelo', 'tool', null, 'hammer', '#8a8f9c', '', '1 po', 3);
DG('pitons', 'Pítons / cravos de ferro', 'tool', null, 'dart', '#a9b0bf', '', '5 pc', 0.25);
DG('shovel', 'Pá', 'tool', null, 'shovel', '#7a4f2a', '', '2 po', 5);
DG('climbers', 'Kit de escalada', 'tool', null, 'grapple', '#a9b0bf', 'Pítons, botas e luvas', '25 po', 12);
DG('grapple', 'Gancho de escalada', 'tool', null, 'grapple', '#a9b0bf', '', '2 po', 4);
DG('waterskin', 'Cantil', 'tool', null, 'waterskin', '#a8743c', '2 L', '2 pp', 5);
DG('rations', 'Rações (1 dia)', 'consumable', null, 'food', '#c78b4a', '', '5 pp', 2);
DG('bedroll', 'Saco de dormir', 'tool', null, 'bedroll', '#4a5a8a', '', '1 po', 7);
DG('tent', 'Tenda (duas pessoas)', 'tool', null, 'tent', '#6b7a45', '', '2 po', 20);
DG('manacles', 'Algemas', 'tool', null, 'cuffs', '#a9b0bf', 'CD 20 para se soltar ou arrebentar', '2 po', 6);
DG('magnifying', 'Lupa', 'tool', null, 'lens', '#e2b53a', 'Vantagem para examinar detalhes e acender fogo', '100 po', 0);
DG('lock', 'Cadeado', 'tool', null, 'lock', '#e2b53a', 'CD 15 para abrir com ferramentas de ladrão', '10 po', 1);
DG('caltrops', 'Abrolhos (20)', 'tool', null, 'caltrops', '#a9b0bf', 'Cobrem um quadrado de 1,5 m', '1 po', 2);
DG('spyglass', 'Luneta', 'tool', null, 'spyglass', '#e2b53a', 'Aumenta objetos distantes 2×', '1.000 po', 1);
DG('thieves', 'Ferramentas de ladrão', 'tool', null, 'tools', '#b9c0cb', 'Abrir fechaduras / desarmar armadilhas', '25 po', 1);
DG('healerskit', 'Kit de curandeiro', 'consumable', null, 'medkit', '#d11d2a', '10 usos · estabiliza sem teste de Medicina', '5 po', 3);
DG('antitoxin', 'Antitoxina (frasco)', 'consumable', null, 'potion', '#6fb27a', 'Vantagem contra veneno por 1 hora', '50 po', 0);
DG('acid', 'Ácido (frasco)', 'consumable', null, 'potion', '#9bd13a', 'Arremesso: 2d6 ácido', '25 po', 1);
DG('alchemistfire', 'Fogo do alquimista (frasco)', 'consumable', null, 'potion', '#ff7a1f', 'Arremesso: 1d4 fogo por turno', '50 po', 1);
DG('holywater', 'Água benta (frasco)', 'consumable', null, 'potion', '#aee4ff', 'Arremesso: 2d6 radiante em ínfero ou morto-vivo', '25 po', 1);
DG('poison', 'Veneno básico (frasco)', 'consumable', null, 'potion', '#5a8a3a', 'Reveste uma arma por 1 minuto', '100 po', 0);
/* pacotes */
DG('pack_burglar', 'Pacote de assaltante', 'tool', null, 'bag', '#2f3038', 'Mochila, esferas, barbante, sino, velas, pé de cabra, martelo, pítons, lanterna, óleo, rações, pederneira, cantil, corda', '16 po', 0);
DG('pack_diplomat', 'Pacote de diplomata', 'tool', null, 'bag', '#7a3aa0', 'Baú, estojos, roupas finas, tinta, pena, lamparina, óleo, papel, perfume, cera, sabão', '39 po', 0);
DG('pack_dungeon', 'Pacote de explorador de masmorras', 'tool', null, 'bag', '#5a6173', 'Mochila, pé de cabra, martelo, pítons, tochas, pederneira, rações, cantil, corda', '12 po', 0);
DG('pack_entertainer', 'Pacote de artista', 'tool', null, 'bag', '#ec5a98', 'Mochila, saco de dormir, fantasias, velas, rações, cantil, kit de disfarce', '40 po', 0);
DG('pack_explorer', 'Pacote de explorador', 'tool', null, 'bag', '#6b7a45', 'Mochila, saco de dormir, kit de refeição, pederneira, tochas, rações, cantil, corda', '10 po', 0);
DG('pack_priest', 'Pacote de sacerdote', 'tool', null, 'bag', '#e2b53a', 'Mochila, cobertor, velas, pederneira, caixa de esmolas, incenso, turíbulo, vestes, rações, cantil', '19 po', 0);
DG('pack_scholar', 'Pacote de estudioso', 'tool', null, 'bag', '#5a3aa0', 'Mochila, livro de conhecimento, tinta, pena, pergaminho, saquinho de areia, faca pequena', '40 po', 0);
/* focos */
DG('holy', 'Símbolo sagrado', 'tool', 'acc', 'cross', '#e2b53a', 'Foco para clérigos e paladinos', '5 po', 0);
DG('amulet_holy', 'Amuleto (símbolo sagrado)', 'tool', 'acc', 'amulet', '#e2b53a', 'Foco para clérigos e paladinos', '5 po', 1);
DG('reliquary', 'Relicário (símbolo sagrado)', 'tool', 'acc', 'box', '#e2b53a', 'Foco para clérigos e paladinos', '5 po', 2);
DG('focus', 'Foco arcano (orbe)', 'tool', 'main', 'orb', '#5aa0e8', 'Foco para feiticeiros, bruxos e magos', '20 po', 3);
DG('crystal', 'Foco arcano (cristal)', 'tool', 'main', 'gem', '#5aa0e8', 'Foco para feiticeiros, bruxos e magos', '10 po', 1);
DG('rodfocus', 'Foco arcano (bastão)', 'tool', 'main', 'rod', '#5aa0e8', 'Foco para feiticeiros, bruxos e magos', '10 po', 2);
DG('stafffocus', 'Foco arcano (cajado)', 'tool', 'two', 'staff', '#5aa0e8', 'Foco para feiticeiros, bruxos e magos', '5 po', 4);
DG('wandfocus', 'Foco arcano (varinha)', 'tool', 'main', 'wand', '#5aa0e8', 'Foco para feiticeiros, bruxos e magos', '10 po', 1);
DG('mistletoe', 'Ramo de visco', 'tool', 'acc', 'leaf', '#6cab3f', 'Foco druídico', '1 po', 0);
DG('totem', 'Totem', 'tool', 'acc', 'totem', '#a8743c', 'Foco druídico', '1 po', 0);
DG('woodstaff', 'Cajado de madeira', 'tool', 'two', 'staff', '#6cab3f', 'Foco druídico', '5 po', 4);
DG('yewwand', 'Varinha de teixo', 'tool', 'main', 'wand', '#6cab3f', 'Foco druídico', '10 po', 1);
DG('spellbook', 'Grimório', 'tool', null, 'book', '#5a3aa0', 'Magias de mago', '50 po', 3);
DG('pouch_comp', 'Bolsa de componentes', 'tool', 'acc', 'bag', '#8a5a2a', 'Componentes materiais', '25 po', 2);
DG('scroll', 'Pergaminho de magia', 'consumable', null, 'scroll', '#d8c79c', 'Conjura uma magia', '', 0);
/* ferramentas de ofício */
for (const [id, n, po, lb] of [['disguise', 'Kit de disfarce', 25, 3], ['forgery', 'Kit de falsificação', 15, 5], ['poisoner', 'Kit de envenenador', 50, 2], ['navigator', 'Ferramentas de navegador', 25, 2], ['herbalism', 'Kit de herbalismo', 5, 3],
  ['alchemist', 'Suprimentos de alquimista', 50, 8], ['brewer', 'Suprimentos de cervejeiro', 20, 9], ['calligrapher', 'Suprimentos de calígrafo', 10, 5], ['carpenter', 'Ferramentas de carpinteiro', 8, 6], ['cartographer', 'Ferramentas de cartógrafo', 15, 6],
  ['cobbler', 'Ferramentas de sapateiro', 5, 5], ['cook', 'Utensílios de cozinheiro', 1, 8], ['glassblower', 'Ferramentas de vidraceiro', 30, 5], ['jeweler', 'Ferramentas de joalheiro', 25, 2], ['leatherworker', 'Ferramentas de coureiro', 5, 5],
  ['mason', 'Ferramentas de pedreiro', 10, 8], ['painter', 'Suprimentos de pintor', 10, 5], ['potter', 'Ferramentas de oleiro', 10, 3], ['smith', 'Ferramentas de ferreiro', 20, 8], ['tinker', 'Ferramentas de funileiro', 50, 10], ['weaver', 'Ferramentas de tecelão', 1, 5], ['woodcarver', 'Ferramentas de entalhador', 1, 5]])
  DG('tool_' + id, n, 'tool', null, 'tools', '#b9c0cb', 'Proficiência de ferramenta', po + ' po', lb);
DG('dice', 'Conjunto de dados', 'misc', null, 'd20', '#b8352a', 'Jogo de azar', '1 pp', 0);
DG('cards_set', 'Baralho', 'misc', null, 'cards', '#eadfbf', 'Jogo de cartas', '5 pp', 0);
/* instrumentos musicais */
for (const [id, n, g, po, lb] of [['lute', 'Alaúde', 'lute', 35, 2], ['flute', 'Flauta', 'flute', 2, 1], ['panflute', 'Flauta de pã', 'flute', 12, 2], ['lyre', 'Lira', 'lute', 30, 2], ['horn', 'Trompa', 'horn', 3, 2],
  ['drum', 'Tambor', 'drum', 6, 3], ['bagpipes', 'Gaita de foles', 'horn', 30, 6], ['dulcimer', 'Saltério', 'lute', 25, 10], ['shawm', 'Charamela', 'flute', 2, 1], ['viol', 'Viela', 'lute', 30, 1]])
  DG('inst_' + id, n, 'tool', 'acc', g, '#c9884a', 'Instrumento musical', po + ' po', lb);
/* consumíveis mágicos */
DN('potion_heal', 'Poção de cura', 'consumable', null, 'potion', '#e0313a', 'Recupera 2d4 + 2 PV · comum', '');
DN('potion_greater', 'Poção de cura maior', 'consumable', null, 'potion', '#ff5a64', 'Recupera 4d4 + 4 PV · incomum', '');
DN('potion_superior', 'Poção de cura superior', 'consumable', null, 'potion', '#ff3a8a', 'Recupera 8d4 + 8 PV · rara', '');
DN('potion_supreme', 'Poção de cura suprema', 'consumable', null, 'potion', '#c13aff', 'Recupera 10d4 + 20 PV · muito rara', '');
/* itens mágicos (SRD) */
DN('wand_mm', 'Varinha de mísseis mágicos', 'magic', 'main', 'wand', '#5aa0e8', '7 cargas · 3 dardos de 1d4+1 · incomum', 'Recupera 1d6+1 cargas ao amanhecer.');
DN('sword_p1', 'Espada longa +1', 'magic', 'main', 'sword', '#5aa0e8', '+1 ataque e dano · 1d8 cortante · incomum', '');
DN('flametongue', 'Língua de chamas', 'magic', 'main', 'sword', '#ff7a1f', '+2d6 fogo ao acertar · luz 12 m · rara · sintonia', 'Ação bônus + palavra de comando acende a lâmina.', { light: [8, '#ff9a3a', true] });
DN('frostbrand', 'Lâmina de gelo', 'magic', 'main', 'sword', '#8fd8ff', '+1d6 frio · resistência a fogo · muito rara · sintonia', 'Em frio extremo emite luz fraca.', { alias: 'marca de gelo' });
DN('vorpal', 'Espada vorpal', 'magic', 'main', 'sword', '#e8e8ee', '+3 · ignora resist. cortante · decepa cabeça com 20 · lendária · sintonia', '', { alias: 'vorpal' });
DN('staff_power', 'Cajado do poder', 'magic', 'two', 'staff', '#a455e8', 'Bordão +2 · 20 cargas · muito raro · sintonia (arcano)', 'Bola de fogo, cone de frio, relâmpago, muralha de energia…');
DN('staff_heal', 'Cajado de cura', 'magic', 'two', 'staff', '#3ec06e', 'Magias de cura (10 cargas)', '');
DN('cloak_prot', 'Manto de proteção', 'magic', 'back', 'cloak', '#3a5aa0', '+1 CA e testes de resistência · incomum', 'Requer sintonização.');
DN('cloak_elven', 'Capa élfica', 'magic', 'back', 'cloak', '#3a7a4a', 'Desvantagem para perceberem você · vantagem em Furtividade · incomum', 'Requer sintonização.', { alias: 'capa de elfo' });
DN('cloak_displace', 'Capa de deslocamento', 'magic', 'back', 'cloak', '#5a6aa0', 'Ataques contra você com desvantagem · rara', 'Requer sintonização.', { alias: 'capa de distorção' });
DN('ring_prot', 'Anel de proteção', 'magic', 'acc', 'ring', '#e2b53a', '+1 CA e testes de resistência · rara', 'Requer sintonização.');
DN('boots_elven', 'Botas élficas', 'magic', 'acc', 'boots', '#3a7a4a', 'Passos silenciosos (vantagem em Furtividade)', '');
DN('boots_speed', 'Botas de velocidade', 'magic', 'acc', 'boots', '#ffd24d', 'Dobra o deslocamento · rara', 'Ação bônus + bater os calcanhares. Requer sintonização.');
DN('amulet_health', 'Amuleto de saúde', 'magic', 'acc', 'amulet', '#d83a3a', 'Constituição vira 19 · rara', 'Requer sintonização.');
DN('gauntlets_ogre', 'Manoplas de força de ogro', 'magic', 'acc', 'gauntlet', '#a8743c', 'Força vira 19 · incomum', 'Requer sintonização.', { alias: 'luvas' });
DN('headband_int', 'Bandana do intelecto', 'magic', 'head', 'circlet', '#5aa0e8', 'Inteligência vira 19 · incomum', 'Requer sintonização.', { alias: 'tiara' });
DN('immovable_rod', 'Bastão imóvel', 'magic', null, 'rod', '#9aa0ad', 'Fica fixo no ar · suporta 3.600 kg · incomum', '');
DN('rope_climbing', 'Corda de escalada', 'magic', null, 'rope', '#e8e2d0', '18 m · se move sob comando · incomum', '');
DN('decanter', 'Jarra de água infinita', 'magic', null, 'jug', '#7ab4e0', 'Fluxo, Fonte ou Gêiser · incomum', '', { alias: 'garrafa' });
DN('deck_many', 'Baralho das múltiplas coisas', 'magic', null, 'cards', '#e2b53a', 'Efeitos de cada carta no SRD · lendário', '');
DN('bag_holding', 'Bolsa dimensional', 'magic', null, 'bag', '#7a3aa0', 'Até 227 kg (500 lb) e 1,8 m³ · pesa 7 kg · incomum', 'Colocá-la em outro espaço extradimensional destrói ambos.', { alias: 'bolsa de carga' });
DN('sending_stones', 'Pedras de comunicação', 'magic', null, 'gem', '#3fd0bd', 'Par de pedras: conjura Mensagem · incomum', 'DMG, fora do SRD 5.1.');
/* ambientação (exemplos do app) */
DN('relic_sword', 'Lâmina rúnica (exemplo)', 'magic', 'main', 'legend_sword', '#5aa0e8', 'Arma lendária de exemplo · ajuste ao seu livro', 'Item de ambientação do Guerreiro; edite números e arte à vontade.');
DN('relic_staff', 'Cajado de cristal (exemplo)', 'magic', 'two', 'legend_staff', '#8a9bff', 'Foco arcano lendário de exemplo', 'Item de ambientação do Mago.');
DN('relic_mace', 'Maça solar (exemplo)', 'magic', 'main', 'legend_mace', '#ffd24d', 'Arma sagrada de exemplo', 'Item de ambientação do Clérigo.');
DN('relic_dagger', 'Adaga sombria (exemplo)', 'magic', 'main', 'legend_dagger', '#3fd0bd', 'Lâmina curva de exemplo', 'Item de ambientação do Ladino.');
DN('relic_sickle', 'Foice da floresta (exemplo)', 'magic', 'main', 'legend_sickle', '#6cab3f', 'Foco druídico de exemplo', 'Item de ambientação do Druida.');
DN('relic_lute', 'Alaúde encantado (exemplo)', 'magic', 'two', 'legend_lute', '#ec5a98', 'Instrumento lendário de exemplo', 'Item de ambientação do Bardo.');
DN('d20', 'Dado da sorte', 'misc', null, 'd20', '#b8352a', 'Um d20 especial', 'Item de ambientação.');
