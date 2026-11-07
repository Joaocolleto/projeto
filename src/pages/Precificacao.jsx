import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { computeModel } from '../lib/calc';
import { brl, num, pct } from '../lib/format';

export default function Precificacao() {
  const { state, applyPrice, toast } = useApp();
  const { products } = useMemo(() => computeModel(state), [state]);
  const baixos = products.filter((p) => p.abaixoMinimo);
  const round = (n) => Math.ceil(n * 20) / 20; // arredonda p/ cima em múltiplos de R$ 0,05

  const apply = async (p) => {
    const novoPreco = round(p.precoSugerido);
    await applyPrice(p.id, novoPreco);
    toast(`Preço de ${p.nome} atualizado para ${brl(novoPreco)}`);
  };

  return (
    <main className="page">
      <div className="page-head">
        <h1>Precificação</h1>
        <p className="page-sub">
          Custo total por unidade = ingredientes + mão de obra + rateio dos custos fixos e variáveis. Margem desejada:{' '}
          {num(state.params.margemDesejada)}% · mínima: {num(state.params.margemMinima)}% (<Link to="/parametros">alterar</Link>)
        </p>
      </div>

      {baixos.length > 0 && (
        <div className="alert" role="alert">
          {baixos.length === 1 ? '1 produto está' : `${baixos.length} produtos estão`} com margem abaixo do mínimo.
        </div>
      )}

      <div className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Salgado</th>
                <th className="r">Custo unitário</th>
                <th className="r">Preço atual</th>
                <th className="r">Preço sugerido</th>
                <th className="r">Markup</th>
                <th className="r">Margem atual</th>
                <th><span className="sr-only">Ação</span></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const diff = p.precoSugerido - p.preco;
                return (
                  <tr key={p.id}>
                    <td className="name">
                      {p.nome}
                      <span className="sub">
                        Ingr. {brl(p.ingUnit)} · M.O. {brl(p.mdoUnit)} · Rateio {brl(p.fixoUnit + p.varUnit)}
                      </span>
                    </td>
                    <td className="r">{brl(p.custoTotal)}</td>
                    <td className="r">{brl(p.preco)}</td>
                    <td className="r"><b>{brl(p.precoSugerido)}</b></td>
                    <td className="r">{pct(p.markup, 0)}</td>
                    <td className="r">
                      <span className={`badge ${p.abaixoMinimo ? 'badge-late' : 'badge-ok'}`}>{pct(p.margemAtual)}</span>
                    </td>
                    <td className="r">
                      {diff > 0.005 ? (
                        <button className="btn btn-primary btn-sm" onClick={() => apply(p)}>Aplicar {brl(round(p.precoSugerido))}</button>
                      ) : (
                        <span className="hint">Preço adequado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          O preço sugerido garante a margem desejada depois de descontar custos e a taxa percentual (ex.: cartão). Ao aplicar, o valor é arredondado para cima em R$ 0,05.
        </p>
      </div>
    </main>
  );
}
