import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import { breakevenSeries, computeModel } from '../lib/calc';
import { brl, pct, units } from '../lib/format';

export default function Equilibrio() {
  const { state } = useApp();
  const { products, totals: t } = useMemo(() => computeModel(state), [state]);
  const series = useMemo(() => breakevenSeries(t), [t]);
  const finite = Number.isFinite(t.peUn);
  const peY = finite ? t.ticket * t.peUn : 0;

  const marginData = products.map((p) => ({ nome: p.nome, 'Margem de contribuição': Number(p.mcTotal.toFixed(2)) }));

  return (
    <main className="page">
      <div className="page-head">
        <h1>Ponto de equilíbrio</h1>
        <p className="page-sub">Quanto vender no mês para cobrir os custos fixos, considerando o mix atual de produtos</p>
      </div>

      {!finite && (
        <div className="alert" role="alert">
          A margem de contribuição média está negativa: vendendo mais, o prejuízo aumenta. Revise preços em Precificação.
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="v">{units(t.peUn)}</div><div className="l">Equilíbrio em unidades/mês</div></div>
        <div className="stat"><div className="v">{finite ? brl(t.peFat) : '—'}</div><div className="l">Equilíbrio em faturamento</div></div>
        <div className="stat"><div className="v">{pct(t.margemSeguranca, 0)}</div><div className="l">Margem de segurança</div></div>
        <div className={`stat ${t.lucro < 0 ? 'bad' : ''}`}><div className="v">{brl(t.lucro)}</div><div className="l">Resultado com {t.totalVol.toLocaleString('pt-BR')} un/mês</div></div>
      </div>

      <section className="panel" aria-labelledby="h-be">
        <div className="panel-head"><h2 id="h-be">Receita x custo total</h2><span className="hint">Custos fixos: {brl(t.fixos)}/mês</span></div>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={series} margin={{ top: 10, right: 16, left: 8, bottom: 18 }}>
              <CartesianGrid stroke="#eadfce" strokeDasharray="3 3" />
              <XAxis dataKey="q" type="number" domain={[0, 'dataMax']} tickFormatter={(v) => v.toLocaleString('pt-BR')} label={{ value: 'Unidades vendidas por mês', position: 'insideBottom', offset: -10, fill: '#7a6350' }} />
              <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} width={64} />
              <Tooltip formatter={(v) => brl(v)} labelFormatter={(l) => `${Number(l).toLocaleString('pt-BR')} unidades`} />
              <Legend verticalAlign="top" height={30} />
              <Line type="linear" dataKey="receita" name="Receita" stroke="#2f5a22" strokeWidth={2.5} dot={false} />
              <Line type="linear" dataKey="custo" name="Custo total" stroke="#c4452b" strokeWidth={2.5} dot={false} />
              {finite && <ReferenceDot x={Math.round(t.peUn)} y={peY} r={7} fill="#e8a444" stroke="#1b100b" strokeWidth={2} ifOverflow="extendDomain" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {finite && <p className="hint">O ponto laranja marca o equilíbrio: acima de {units(t.peUn)} o mês fecha no lucro.</p>}
      </section>

      <section className="panel" aria-labelledby="h-mc">
        <div className="panel-head"><h2 id="h-mc">Margem de contribuição por produto</h2><span className="hint">Quanto cada produto sobra para pagar os custos fixos</span></div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={marginData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#eadfce" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nome" />
              <YAxis tickFormatter={(v) => `R$ ${v}`} width={70} />
              <Tooltip formatter={(v) => brl(v)} />
              <Bar dataKey="Margem de contribuição" fill="#e8a444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel" aria-labelledby="h-prod">
        <div className="panel-head"><h2 id="h-prod">Equilíbrio por produto</h2><span className="hint">Custos fixos rateados pela participação nas vendas</span></div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Salgado</th><th className="r">Vendas/mês</th><th className="r">MC unitária</th><th className="r">MC %</th><th className="r">MC total</th><th className="r">Equilíbrio</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="name">{p.nome}<span className="sub">{p.categoria} · {pct(p.share, 0)} do mix</span></td>
                  <td className="r">{p.vol.toLocaleString('pt-BR')}</td>
                  <td className={`r ${p.mcUnit < 0 ? 'neg' : ''}`}>{brl(p.mcUnit)}</td>
                  <td className="r">{pct(p.mcPct, 0)}</td>
                  <td className="r">{brl(p.mcTotal)}</td>
                  <td className="r">{units(p.peUn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
