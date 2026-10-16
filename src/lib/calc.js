import { UNITS, sameFamily } from './units';
import { toNumber } from './format';

/** Custo por unidade-base (g, ml ou un) de um ingrediente. */
export function costPerBase(ing) {
  const u = UNITS[ing.unidade];
  const qtyBase = toNumber(ing.quantidade) * (u?.toBase || 1);
  return qtyBase > 0 ? toNumber(ing.custo) / qtyBase : 0;
}

/**
 * Motor de cálculo. Recebe os dados cadastrados e (opcionalmente) um cenário de simulação:
 *  sim = { reajusteInsumos: %, margemDesejada: %, volumes: { [salgadoId]: unidades/mês } }
 */
export function computeModel(data, sim = {}) {
  const { salgados, ingredientes, custos, params } = data;
  const reaj = 1 + (sim.reajusteInsumos || 0) / 100;
  const margemAlvo = toNumber(sim.margemDesejada ?? params.margemDesejada) / 100;
  const margemMin = toNumber(params.margemMinima) / 100;
  const custoHora = toNumber(params.custoHoraMdo);
  const ingMap = new Map(ingredientes.map((i) => [i.id, i]));

  const volOf = (s) => Math.max(0, toNumber(sim.volumes?.[s.id] ?? s.volumeMensal));
  const totalVol = salgados.reduce((a, s) => a + volOf(s), 0);

  const fixos = custos
    .filter((c) => c.natureza === 'fixo')
    .reduce((a, c) => a + toNumber(c.valor), 0);
  const varMensal = custos
    .filter((c) => c.natureza === 'variavel' && c.modoValor !== 'percentual')
    .reduce((a, c) => a + toNumber(c.valor), 0);
  const varPct =
    custos
      .filter((c) => c.natureza === 'variavel' && c.modoValor === 'percentual')
      .reduce((a, c) => a + toNumber(c.valor), 0) / 100;

  const fixoUnit = totalVol > 0 ? fixos / totalVol : 0;
  const varMensalUnit = totalVol > 0 ? varMensal / totalVol : 0;

  const products = salgados.map((s) => {
    const rend = Math.max(1, toNumber(s.rendimento));
    const vol = volOf(s);

    let custoIngLote = 0;
    for (const line of s.ficha || []) {
      const ing = ingMap.get(line.ingredienteId);
      if (!ing || !sameFamily(line.unidade, ing.unidade)) continue;
      const qtyBase = toNumber(line.quantidade) * UNITS[line.unidade].toBase;
      custoIngLote += qtyBase * costPerBase(ing) * reaj;
    }
    const custoMdoLote = (toNumber(s.tempoPreparo) / 60) * custoHora;

    const ingUnit = custoIngLote / rend;
    const mdoUnit = custoMdoLote / rend;
    const direto = ingUnit + mdoUnit;

    const base = direto + fixoUnit + varMensalUnit; // custo sem a parte % do preço
    const denom = 1 - varPct - margemAlvo;
    const precoSugerido = denom > 0 ? base / denom : 0;
    const markup = base > 0 && precoSugerido > 0 ? precoSugerido / base - 1 : 0;

    const preco = toNumber(s.preco);
    const custoTotal = base + varPct * preco;
    const lucroUnit = preco - custoTotal;
    const margemAtual = preco > 0 ? lucroUnit / preco : 0;

    const mcUnit = preco - direto - varMensalUnit - varPct * preco;
    const mcTotal = mcUnit * vol;
    const receita = preco * vol;

    const share = totalVol > 0 ? vol / totalVol : 0;
    const peUn = mcUnit > 0 ? (fixos * share) / mcUnit : Infinity;

    return {
      id: s.id,
      nome: s.nome,
      categoria: s.categoria,
      vol,
      share,
      ingUnit,
      mdoUnit,
      direto,
      fixoUnit,
      varUnit: varMensalUnit + varPct * preco,
      custoTotal,
      preco,
      precoSugerido,
      markup,
      lucroUnit,
      margemAtual,
      abaixoMinimo: margemAtual < margemMin,
      mcUnit,
      mcTotal,
      mcPct: preco > 0 ? mcUnit / preco : 0,
      receita,
      peUn,
    };
  });

  const receita = products.reduce((a, p) => a + p.receita, 0);
  const mcTotal = products.reduce((a, p) => a + p.mcTotal, 0);
  const ticket = totalVol > 0 ? receita / totalVol : 0;
  const mcMedia = totalVol > 0 ? mcTotal / totalVol : 0;
  const peUn = mcMedia > 0 ? fixos / mcMedia : Infinity;
  const peFat = peUn * ticket;

  return {
    products,
    totals: {
      totalVol,
      fixos,
      varMensal,
      varPct,
      receita,
      mcTotal,
      lucro: mcTotal - fixos,
      ticket,
      mcMedia,
      peUn,
      peFat,
      margemSeguranca: receita > 0 && Number.isFinite(peFat) ? (receita - peFat) / receita : 0,
      cvUnit: ticket - mcMedia,
    },
  };
}

/** Pontos para o gráfico de ponto de equilíbrio (receita x custo total por volume). */
export function breakevenSeries(totals, steps = 24) {
  const { fixos, ticket, cvUnit, peUn, totalVol } = totals;
  const maxQ = Math.max(Number.isFinite(peUn) ? peUn * 1.8 : 0, totalVol * 1.4, 10);
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const q = Math.round((maxQ * i) / steps);
    out.push({ q, receita: ticket * q, custo: fixos + cvUnit * q });
  }
  return out;
}
