import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { computeModel } from '../lib/calc';
import { brl, pct, units } from '../lib/format';

function Range({ label, value, onChange, min, max, step = 1, suffix = '%' }) {
  const id = label.replace(/\s/g, '-');
  return (
    <div className="range-field">
      <div className="head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{value > 0 && suffix === '%' && min < 0 ? '+' : ''}{value}{suffix}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

const Delta = ({ a, b, money = true, invert = false }) => {
  const d = b - a;
  if (Math.abs(d) < 0.005) return <span className="hint">—</span>;
  const good = invert ? d < 0 : d > 0;
  return <span className={good ? 'pos' : 'neg'}>{d > 0 ? '+' : ''}{money ? brl(d) : d.toFixed(1)}</span>;
};

export default function Simulacao() {
  const { state } = useApp();
  const [reajuste, setReajuste] = useState(0);
  const [margem, setMargem] = useState(state.params.margemDesejada);
  const [mix, setMix] = useState({}); // % de variação de volume por produto

  const base = useMemo(() => computeModel(state), [state]);
  const volumes = useMemo(
    () => Object.fromEntries(state.salgados.map((s) => [s.id, Math.round(s.volumeMensal * (1 + (mix[s.id] || 0) / 100))])),
    [state.salgados, mix]
  );
  const sim = useMemo(
    () => computeModel(state, { reajusteInsumos: reajuste, margemDesejada: margem, volumes }),
    [state, reajuste, margem, volumes]
  );

  const reset = () => { setReajuste(0); setMargem(state.params.margemDesejada); setMix({}); };
  const changed = reajuste !== 0 || margem !== state.params.margemDesejada || Object.values(mix).some(Boolean);
  const T0 = base.totals, T1 = sim.totals;

  return (
    <main className="page">
      <div className="page-head">
        <h1>Simulação de cenários</h1>
        <p className="page-sub">Teste mudanças sem alterar os cadastros. Nada aqui é salvo.</p>
      </div>

      <div className="sim-layout">
        <aside className="panel stack" aria-label="Controles da simulação">
          <Range label="Reajuste dos insumos" value={reajuste} onChange={setReajuste} min={-20} max={60} />
          <Range label="Margem desejada" value={margem} onChange={setMargem} min={5} max={70} />
          <div className="stack" style={{ gap: 12 }}>
            <span className="field-label">Mix: variação nas vendas</span>
            {state.salgados.map((s) => (
              <Range key={s.id} label={s.nome} value={mix[s.id] || 0} onChange={(v) => setMix((m) => ({ ...m, [s.id]: v }))} min={-50} max={100} step={5} />
            ))}
          </div>
          <button className="btn btn-ghost" onClick={reset} disabled={!changed}>Limpar simulação</button>
        </aside>

        <div>
          <div className="stats" style={{ marginBottom: 20 }}>
            <div className="stat">
              <div className={`v ${T1.lucro < 0 ? '' : ''}`}>{brl(T1.lucro)}</div>
              <div className="l">Resultado do mês · hoje {brl(T0.lucro)}</div>
            </div>
            <div className="stat">
              <div className="v">{units(T1.peUn)}</div>
              <div className="l">Equilíbrio · hoje {units(T0.peUn)}</div>
            </div>
          </div>

          <div className="panel">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Salgado</th><th className="r">Custo hoje</th><th className="r">Custo simulado</th>
                    <th className="r">Preço sugerido</th><th className="r">Margem com preço atual</th>
                  </tr>
                </thead>
                <tbody>
                  {sim.products.map((p, i) => {
                    const b = base.products[i];
                    return (
                      <tr key={p.id}>
                        <td className="name">{p.nome}<span className="sub">{p.vol.toLocaleString('pt-BR')} un/mês</span></td>
                        <td className="r">{brl(b.custoTotal)}</td>
                        <td className="r">{brl(p.custoTotal)} <br /><Delta a={b.custoTotal} b={p.custoTotal} invert /></td>
                        <td className="r"><b>{brl(p.precoSugerido)}</b> <br /><span className="hint">hoje {brl(b.precoSugerido)}</span></td>
                        <td className="r"><span className={`badge ${p.abaixoMinimo ? 'badge-late' : 'badge-ok'}`}>{pct(p.margemAtual)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
