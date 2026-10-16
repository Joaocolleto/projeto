import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { computeModel } from '../lib/calc';
import { brl, daysSince, pct } from '../lib/format';

const MODULES = [
  ['/cadastros', 'Cadastros', 'Salgados, ingredientes e custos fixos e variáveis.'],
  ['/precificacao', 'Precificação', 'Custo por unidade, preço sugerido e margem de cada salgado.'],
  ['/equilibrio', 'Ponto de equilíbrio', 'Quantos salgados vender por mês para cobrir os custos.'],
  ['/simulacao', 'Simulação', 'Teste inflação de insumos, margem e mix sem mexer nos dados.'],
  ['/relatorios', 'Relatórios', 'Custo, margem por categoria e histórico de variações.'],
  ['/parametros', 'Parâmetros', 'Margem desejada, margem mínima e custo da mão de obra.'],
];

export default function Home() {
  const { state } = useApp();
  const { products, totals } = useMemo(() => computeModel(state), [state]);
  const baixos = products.filter((p) => p.abaixoMinimo);
  const velhos = state.ingredientes.filter((i) => daysSince(i.atualizadoEm) > 60);

  return (
    <main className="page">
      <div className="page-head">
        <h1>Painel da Casa do Salgado</h1>
        <p className="page-sub">Resumo do mês com base nos cadastros atuais</p>
      </div>

      <div className="stats">
        <div className="stat"><div className="v">{brl(totals.receita)}</div><div className="l">Faturamento estimado</div></div>
        <div className={`stat ${totals.lucro < 0 ? 'bad' : ''}`}><div className="v">{brl(totals.lucro)}</div><div className="l">Resultado do mês</div></div>
        <div className="stat"><div className="v">{Number.isFinite(totals.peUn) ? Math.ceil(totals.peUn).toLocaleString('pt-BR') : '—'}</div><div className="l">Salgados para empatar</div></div>
        <div className="stat"><div className="v">{pct(totals.margemSeguranca, 0)}</div><div className="l">Margem de segurança</div></div>
      </div>

      {baixos.length > 0 && (
        <div className="alert" role="alert">
          <span>
            {baixos.length === 1 ? '1 salgado está' : `${baixos.length} salgados estão`} abaixo da margem mínima de {state.params.margemMinima}%:{' '}
            {baixos.map((p) => p.nome).join(', ')}. <Link to="/precificacao">Ver preços</Link>
          </span>
        </div>
      )}
      {velhos.length > 0 && (
        <div className="alert warn">
          <span>
            {velhos.length === 1 ? '1 ingrediente está' : `${velhos.length} ingredientes estão`} com preço sem atualização há mais de 60 dias.{' '}
            <Link to="/cadastros?aba=ingredientes">Atualizar custos</Link>
          </span>
        </div>
      )}

      <div className="home-grid">
        {MODULES.map(([to, title, desc]) => (
          <Link key={to} to={to} className="module">
            <h3>{title}</h3>
            <p>{desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
