import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { computeModel } from '../lib/calc';
import { brl, dateBR, downloadCSV, pct } from '../lib/format';

const TABS = [['custo', 'Custo por produto'], ['categoria', 'Margem por categoria'], ['historico', 'Histórico de variações']];

export default function Relatorios() {
  const { state } = useApp();
  const [aba, setAba] = useState('custo');
  const { products } = useMemo(() => computeModel(state), [state]);

  const categorias = useMemo(() => {
    const m = new Map();
    for (const p of products) {
      const c = m.get(p.categoria) || { categoria: p.categoria, produtos: 0, receita: 0, mc: 0, vol: 0 };
      c.produtos += 1; c.receita += p.receita; c.mc += p.mcTotal; c.vol += p.vol;
      m.set(p.categoria, c);
    }
    return [...m.values()];
  }, [products]);

  const variacao = (de, para) => (de > 0 ? (para - de) / de : 0);

  const exportCSV = () => {
    if (aba === 'custo')
      downloadCSV('custo-por-produto.csv', [
        ['Salgado', 'Ingredientes', 'Mão de obra', 'Rateio fixos', 'Variáveis', 'Custo total', 'Preço', 'Margem'],
        ...products.map((p) => [p.nome, p.ingUnit.toFixed(2), p.mdoUnit.toFixed(2), p.fixoUnit.toFixed(2), p.varUnit.toFixed(2), p.custoTotal.toFixed(2), p.preco.toFixed(2), (p.margemAtual * 100).toFixed(1) + '%']),
      ]);
    if (aba === 'categoria')
      downloadCSV('margem-por-categoria.csv', [
        ['Categoria', 'Produtos', 'Vendas/mês', 'Receita', 'Margem de contribuição', 'MC %'],
        ...categorias.map((c) => [c.categoria, c.produtos, c.vol, c.receita.toFixed(2), c.mc.toFixed(2), c.receita ? ((c.mc / c.receita) * 100).toFixed(1) + '%' : '0%']),
      ]);
    if (aba === 'historico')
      downloadCSV('historico-variacoes.csv', [
        ['Data', 'Tipo', 'Item', 'De', 'Para', 'Variação'],
        ...state.historico.map((h) => [dateBR(h.data), h.tipo === 'preco' ? 'Preço de venda' : 'Custo de ingrediente', h.nome, h.de.toFixed(2), h.para.toFixed(2), (variacao(h.de, h.para) * 100).toFixed(1) + '%']),
      ]);
  };

  return (
    <main className="page">
      <div className="page-head">
        <h1>Relatórios</h1>
        <p className="page-sub">Custos, margens e histórico de variações de custos e preços</p>
      </div>

      <div className="tabs-row">
        <div className="tabs" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" className="tab" aria-selected={aba === id} onClick={() => setAba(id)}>{label}</button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Exportar CSV</button>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="table-wrap">
          {aba === 'custo' && (
            <table className="data">
              <thead><tr><th>Salgado</th><th className="r">Ingredientes</th><th className="r">Mão de obra</th><th className="r">Rateio fixos</th><th className="r">Variáveis</th><th className="r">Custo total</th><th className="r">Preço</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="name">{p.nome}</td>
                    <td className="r">{brl(p.ingUnit)}</td><td className="r">{brl(p.mdoUnit)}</td>
                    <td className="r">{brl(p.fixoUnit)}</td><td className="r">{brl(p.varUnit)}</td>
                    <td className="r"><b>{brl(p.custoTotal)}</b></td><td className="r">{brl(p.preco)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aba === 'categoria' && (
            <table className="data">
              <thead><tr><th>Categoria</th><th className="r">Produtos</th><th className="r">Vendas/mês</th><th className="r">Receita</th><th className="r">Margem de contribuição</th><th className="r">MC %</th></tr></thead>
              <tbody>
                {categorias.map((c) => (
                  <tr key={c.categoria}>
                    <td className="name">{c.categoria}</td>
                    <td className="r">{c.produtos}</td><td className="r">{c.vol.toLocaleString('pt-BR')}</td>
                    <td className="r">{brl(c.receita)}</td><td className="r">{brl(c.mc)}</td>
                    <td className="r">{c.receita ? pct(c.mc / c.receita, 0) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aba === 'historico' && (
            state.historico.length === 0 ? (
              <p className="empty">Nenhuma variação registrada ainda. Ao alterar o custo de um ingrediente ou o preço de um salgado, ela aparece aqui.</p>
            ) : (
              <table className="data">
                <thead><tr><th>Data</th><th>Tipo</th><th>Item</th><th className="r">De</th><th className="r">Para</th><th className="r">Variação</th></tr></thead>
                <tbody>
                  {state.historico.map((h) => {
                    const v = variacao(h.de, h.para);
                    return (
                      <tr key={h.id}>
                        <td>{dateBR(h.data)}</td>
                        <td><span className="badge badge-neutral">{h.tipo === 'preco' ? 'Preço de venda' : 'Custo de ingrediente'}</span></td>
                        <td className="name">{h.nome}</td>
                        <td className="r">{brl(h.de)}</td><td className="r">{brl(h.para)}</td>
                        <td className={`r ${h.tipo === 'preco' ? (v >= 0 ? 'pos' : 'neg') : (v > 0 ? 'neg' : 'pos')}`}>{v > 0 ? '+' : ''}{pct(v)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </main>
  );
}
