import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CustoDrawer, IngredienteDrawer, SalgadoDrawer } from '../components/CadastroDrawers';
import { EditIcon, PlusIcon } from '../components/Icons';
import { ageLabel, ageTone, brl, daysSince, num, pct, toNumber } from '../lib/format';

const TABS = [
  ['salgados', 'Salgados', 'Novo salgado'],
  ['ingredientes', 'Ingredientes', 'Novo ingrediente'],
  ['custos', 'Custos fixos', 'Novo custo'],
];

function Row({ title, sub, badge, price, onEdit, editLabel }) {
  return (
    <li className="row">
      <div className="row-main">
        <div className="row-title">{title}</div>
        <div className="row-sub">{sub}</div>
      </div>
      {badge}
      {price}
      <button className="icon-btn" onClick={onEdit} aria-label={editLabel}><EditIcon /></button>
    </li>
  );
}

/** Preço do ingrediente editável direto na lista (atualização rápida de custo). */
function QuickPrice({ ing }) {
  const { dispatch, toast } = useApp();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');

  const save = () => {
    const n = toNumber(val);
    setEditing(false);
    if (n > 0 && n !== ing.custo) {
      dispatch({ type: 'SAVE_INGREDIENTE', value: { ...ing, custo: n } });
      toast(`${ing.nome} atualizado — receitas recalculadas`);
    }
  };

  if (editing) {
    return (
      <input
        className="input row-price-input"
        autoFocus
        inputMode="decimal"
        aria-label={`Novo custo de ${ing.nome}`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') { setVal(String(ing.custo)); setEditing(false); }
        }}
      />
    );
  }
  return (
    <button
      className="row-price"
      title="Clique para atualizar o custo"
      onClick={() => { setVal(String(ing.custo).replace('.', ',')); setEditing(true); }}
    >
      {brl(ing.custo)}
    </button>
  );
}

export default function Cadastros() {
  const { state } = useApp();
  const [params, setParams] = useSearchParams();
  const aba = TABS.some((t) => t[0] === params.get('aba')) ? params.get('aba') : 'salgados';
  const [editing, setEditing] = useState(null); // { item } — item null = novo
  const close = () => setEditing(null);

  const counts = { salgados: state.salgados.length, ingredientes: state.ingredientes.length, custos: state.custos.length };
  const tab = TABS.find((t) => t[0] === aba);

  return (
    <main className="page">
      <div className="page-head">
        <h1>Cadastros</h1>
        <p className="page-sub">Gerencie os itens que alimentam o cálculo de custo e precificação</p>
      </div>

      <div className="tabs-row">
        <div className="tabs" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" className="tab" aria-selected={aba === id} onClick={() => setParams({ aba: id })}>
              {label} <span className="count">{counts[id]}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ item: null })}>
          <PlusIcon /> {tab[2]}
        </button>
      </div>

      <ul className="list-card" style={{ listStyle: 'none', padding: 0 }}>
        {counts[aba] === 0 && (
          <li className="empty">
            Nada cadastrado aqui ainda.
            <div><button className="btn btn-primary" onClick={() => setEditing({ item: null })}>{tab[2]}</button></div>
          </li>
        )}

        {aba === 'salgados' && state.salgados.map((s) => (
          <Row
            key={s.id}
            title={s.nome}
            sub={`${s.categoria} · rendeu ${num(s.rendimento)} unidades`}
            price={<span className="row-price">{brl(s.preco)}</span>}
            onEdit={() => setEditing({ item: s })}
            editLabel={`Editar ${s.nome}`}
          />
        ))}

        {aba === 'ingredientes' && state.ingredientes.map((i) => {
          const d = daysSince(i.atualizadoEm);
          return (
            <Row
              key={i.id}
              title={i.nome}
              sub={`${num(i.quantidade)} ${i.unidade} · ${i.fornecedor || 'sem fornecedor'}`}
              badge={<span className={`badge badge-${ageTone(d)}`} title="Última atualização do preço">{ageLabel(d)}</span>}
              price={<QuickPrice ing={i} />}
              onEdit={() => setEditing({ item: i })}
              editLabel={`Editar ${i.nome}`}
            />
          );
        })}

        {aba === 'custos' && state.custos.map((c) => (
          <Row
            key={c.id}
            title={c.tipo}
            sub={`Mensal · vence dia ${c.diaVencimento}`}
            badge={<span className="badge badge-neutral">{c.natureza === 'fixo' ? 'Fixo' : 'Variável'}</span>}
            price={<span className="row-price">{c.modoValor === 'percentual' ? pct(c.valor / 100, 1) : brl(c.valor)}</span>}
            onEdit={() => setEditing({ item: c })}
            editLabel={`Editar ${c.tipo}`}
          />
        ))}
      </ul>

      {editing && aba === 'salgados' && <SalgadoDrawer item={editing.item} onClose={close} />}
      {editing && aba === 'ingredientes' && <IngredienteDrawer item={editing.item} onClose={close} />}
      {editing && aba === 'custos' && <CustoDrawer item={editing.item} onClose={close} />}
    </main>
  );
}
