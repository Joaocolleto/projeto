import { useMemo, useState } from 'react';
import Drawer from './Drawer';
import { Segmented, SelectInput, TextInput } from './Field';
import { TrashIcon, PlusIcon } from './Icons';
import { useApp } from '../context/AppContext';
import { computeModel, costPerBase } from '../lib/calc';
import { brl, num, toNumber, uid } from '../lib/format';
import { UNITS, UNIT_KEYS, compatibleUnits } from '../lib/units';

const CATEGORIAS = ['Frito', 'Assado', 'Doce', 'Outro'];
const UNIT_OPTIONS = UNIT_KEYS.map((k) => [k, UNITS[k].name]);

/* ========================= SALGADO ========================= */
export function SalgadoDrawer({ item, onClose }) {
  const { state, dispatch, toast } = useApp();
  const [f, setF] = useState(() => ({
    nome: item?.nome ?? '',
    categoria: item?.categoria ?? 'Frito',
    rendimento: String(item?.rendimento ?? ''),
    preco: item ? String(item.preco).replace('.', ',') : '',
    volumeMensal: String(item?.volumeMensal ?? ''),
    tempoPreparo: String(item?.tempoPreparo ?? ''),
    ficha: (item?.ficha ?? []).map((l) => ({ ...l, key: uid(), quantidade: String(l.quantidade) })),
  }));
  const [err, setErr] = useState({});
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const ingOptions = [['', 'Selecione…'], ...state.ingredientes.map((i) => [i.id, i.nome])];
  const ingById = (id) => state.ingredientes.find((i) => i.id === id);

  const setLine = (key, patch) =>
    setF((p) => ({ ...p, ficha: p.ficha.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  const pickIngredient = (key, id) => {
    const ing = ingById(id);
    setLine(key, { ingredienteId: id, unidade: ing ? (ing.unidade === 'kg' ? 'g' : ing.unidade === 'l' ? 'ml' : ing.unidade) : 'g' });
  };

  const build = () => ({
    id: item?.id ?? uid(),
    nome: f.nome.trim(),
    categoria: f.categoria,
    rendimento: toNumber(f.rendimento),
    preco: toNumber(f.preco),
    volumeMensal: toNumber(f.volumeMensal),
    tempoPreparo: toNumber(f.tempoPreparo),
    ficha: f.ficha
      .filter((l) => l.ingredienteId)
      .map((l) => ({ ingredienteId: l.ingredienteId, quantidade: toNumber(l.quantidade), unidade: l.unidade })),
  });

  // Prévia em tempo real do custo (usa o mesmo motor de cálculo das telas de análise)
  const preview = useMemo(() => {
    const draft = build();
    const others = state.salgados.filter((s) => s.id !== draft.id);
    const { products } = computeModel({ ...state, salgados: [...others, draft] });
    return products.find((p) => p.id === draft.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, state]);

  const submit = () => {
    const e = {};
    const v = build();
    if (!v.nome) e.nome = 'Informe o nome do salgado.';
    if (!(v.rendimento > 0)) e.rendimento = 'Informe quantas unidades o lote rende.';
    if (!(v.preco > 0)) e.preco = 'Informe o preço unitário.';
    if (f.ficha.some((l) => l.ingredienteId && !(toNumber(l.quantidade) > 0))) e.ficha = 'Toda linha da ficha precisa de quantidade.';
    setErr(e);
    if (Object.keys(e).length) return;
    dispatch({ type: 'SAVE_SALGADO', value: v });
    toast(item ? 'Salgado atualizado' : 'Salgado cadastrado');
    onClose();
  };

  const remove = () => {
    if (window.confirm(`Excluir "${item.nome}"?`)) {
      dispatch({ type: 'DELETE_SALGADO', id: item.id });
      toast('Salgado excluído');
      onClose();
    }
  };

  return (
    <Drawer title={item ? 'Editar salgado' : 'Salgado novo'} onClose={onClose} onSubmit={submit} onDelete={item && remove}>
      <TextInput label="Nome do salgado" value={f.nome} onChange={set('nome')} error={err.nome} />
      <div className="grid-2">
        <SelectInput label="Categoria" value={f.categoria} onChange={set('categoria')} options={CATEGORIAS.map((c) => [c, c])} />
        <TextInput label="Rendimento do lote" value={f.rendimento} onChange={set('rendimento')} inputMode="numeric" error={err.rendimento} hint="Unidades por lote" />
      </div>
      <TextInput label="Preço unitário (R$)" value={f.preco} onChange={set('preco')} inputMode="decimal" error={err.preco} hint="Preço praticado hoje" />

      <h3 className="section-title">Ficha técnica (por lote)</h3>
      {f.ficha.map((l) => {
        const ing = ingById(l.ingredienteId);
        return (
          <div className="ficha-line" key={l.key}>
            <select className="select" aria-label="Ingrediente" value={l.ingredienteId} onChange={(e) => pickIngredient(l.key, e.target.value)}>
              {ingOptions.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
            <input className="input" aria-label="Quantidade" inputMode="decimal" value={l.quantidade} onChange={(e) => setLine(l.key, { quantidade: e.target.value })} />
            <select className="select" aria-label="Unidade" value={l.unidade} onChange={(e) => setLine(l.key, { unidade: e.target.value })}>
              {(ing ? compatibleUnits(ing.unidade) : UNIT_KEYS).map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <button type="button" className="icon-btn" aria-label="Remover ingrediente" onClick={() => setF((p) => ({ ...p, ficha: p.ficha.filter((x) => x.key !== l.key) }))}>
              <TrashIcon />
            </button>
          </div>
        );
      })}
      {err.ficha && <span className="error">{err.ficha}</span>}
      <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}
        onClick={() => setF((p) => ({ ...p, ficha: [...p.ficha, { key: uid(), ingredienteId: '', quantidade: '', unidade: 'g' }] }))}>
        <PlusIcon /> Adicionar ingrediente
      </button>

      <h3 className="section-title">Produção</h3>
      <div className="grid-2">
        <TextInput label="Tempo de preparo (min/lote)" value={f.tempoPreparo} onChange={set('tempoPreparo')} inputMode="numeric" hint="Mão de obra direta" />
        <TextInput label="Vendas por mês (un)" value={f.volumeMensal} onChange={set('volumeMensal')} inputMode="numeric" hint="Base do rateio e do equilíbrio" />
      </div>

      {preview && (
        <div className="preview" aria-live="polite">
          <div className="line"><span>Ingredientes por unidade</span><b>{brl(preview.ingUnit)}</b></div>
          <div className="line"><span>Mão de obra por unidade</span><b>{brl(preview.mdoUnit)}</b></div>
          <div className="line"><span>Custo total por unidade</span><b>{brl(preview.custoTotal)}</b></div>
          <div className="line"><span>Preço sugerido ({num(state.params.margemDesejada)}% de margem)</span><b>{brl(preview.precoSugerido)}</b></div>
        </div>
      )}
    </Drawer>
  );
}

/* ========================= INGREDIENTE ========================= */
export function IngredienteDrawer({ item, onClose }) {
  const { state, dispatch, toast } = useApp();
  const [f, setF] = useState(() => ({
    nome: item?.nome ?? '',
    unidade: item?.unidade ?? 'kg',
    quantidade: String(item?.quantidade ?? ''),
    custo: item ? String(item.custo).replace('.', ',') : '',
    fornecedor: item?.fornecedor ?? '',
  }));
  const [err, setErr] = useState({});
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const perBase = costPerBase({ unidade: f.unidade, quantidade: f.quantidade, custo: f.custo });

  const submit = () => {
    const e = {};
    if (!f.nome.trim()) e.nome = 'Informe o nome do ingrediente.';
    if (!(toNumber(f.quantidade) > 0)) e.quantidade = 'Informe a quantidade da embalagem.';
    if (!(toNumber(f.custo) > 0)) e.custo = 'Informe o custo.';
    setErr(e);
    if (Object.keys(e).length) return;
    dispatch({
      type: 'SAVE_INGREDIENTE',
      value: {
        id: item?.id ?? uid(),
        nome: f.nome.trim(),
        unidade: f.unidade,
        quantidade: toNumber(f.quantidade),
        custo: toNumber(f.custo),
        fornecedor: f.fornecedor.trim(),
        atualizadoEm: item?.atualizadoEm,
      },
    });
    toast(item ? 'Ingrediente atualizado — receitas recalculadas' : 'Ingrediente cadastrado');
    onClose();
  };

  const remove = () => {
    const used = state.salgados.filter((s) => s.ficha.some((l) => l.ingredienteId === item.id)).length;
    const msg = used
      ? `"${item.nome}" é usado em ${used} ficha(s) técnica(s) e será removido delas. Excluir?`
      : `Excluir "${item.nome}"?`;
    if (window.confirm(msg)) {
      dispatch({ type: 'DELETE_INGREDIENTE', id: item.id });
      toast('Ingrediente excluído');
      onClose();
    }
  };

  return (
    <Drawer title={item ? 'Editar ingrediente' : 'Ingrediente novo'} onClose={onClose} onSubmit={submit} onDelete={item && remove}>
      <TextInput label="Nome do ingrediente" value={f.nome} onChange={set('nome')} error={err.nome} />
      <div className="grid-2">
        <SelectInput label="Unidade de medida" value={f.unidade} onChange={set('unidade')} options={UNIT_OPTIONS} />
        <TextInput label="Quantidade na embalagem" value={f.quantidade} onChange={set('quantidade')} inputMode="decimal" error={err.quantidade} />
      </div>
      <TextInput
        label="Custo unitário (R$ da embalagem)"
        value={f.custo}
        onChange={set('custo')}
        inputMode="decimal"
        error={err.custo}
        hint={perBase > 0 ? `Equivale a ${brl(perBase * UNITS[f.unidade].toBase)} por ${f.unidade}` : undefined}
      />
      <TextInput label="Fornecedor" value={f.fornecedor} onChange={set('fornecedor')} />
    </Drawer>
  );
}

/* ========================= CUSTO ========================= */
export function CustoDrawer({ item, onClose }) {
  const { dispatch, toast } = useApp();
  const [f, setF] = useState(() => ({
    tipo: item?.tipo ?? '',
    natureza: item?.natureza ?? 'fixo',
    modoValor: item?.modoValor ?? 'valor',
    valor: item ? String(item.valor).replace('.', ',') : '',
    diaVencimento: String(item?.diaVencimento ?? ''),
  }));
  const [err, setErr] = useState({});
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const percent = f.natureza === 'variavel' && f.modoValor === 'percentual';

  const submit = () => {
    const e = {};
    const dia = toNumber(f.diaVencimento);
    if (!f.tipo.trim()) e.tipo = 'Informe o tipo de custo.';
    if (!(toNumber(f.valor) > 0)) e.valor = 'Informe o valor.';
    if (percent && toNumber(f.valor) >= 100) e.valor = 'O percentual deve ser menor que 100.';
    if (f.diaVencimento && (dia < 1 || dia > 31)) e.diaVencimento = 'Use um dia entre 1 e 31.';
    setErr(e);
    if (Object.keys(e).length) return;
    dispatch({
      type: 'SAVE_CUSTO',
      value: {
        id: item?.id ?? uid(),
        tipo: f.tipo.trim(),
        natureza: f.natureza,
        modoValor: f.natureza === 'fixo' ? 'valor' : f.modoValor,
        valor: toNumber(f.valor),
        diaVencimento: dia || 1,
      },
    });
    toast(item ? 'Custo atualizado' : 'Custo cadastrado');
    onClose();
  };

  const remove = () => {
    if (window.confirm(`Excluir "${item.tipo}"?`)) {
      dispatch({ type: 'DELETE_CUSTO', id: item.id });
      toast('Custo excluído');
      onClose();
    }
  };

  return (
    <Drawer title={item ? 'Editar custo' : 'Custo novo'} onClose={onClose} onSubmit={submit} onDelete={item && remove}>
      <TextInput label="Tipo de custo" value={f.tipo} onChange={set('tipo')} error={err.tipo} placeholder="Ex.: Aluguel, embalagens, comissão" />
      <Segmented label="Natureza" value={f.natureza} onChange={set('natureza')} options={[['fixo', 'Fixo'], ['variavel', 'Variável']]} />
      {f.natureza === 'variavel' && (
        <Segmented label="Como é cobrado" value={f.modoValor} onChange={set('modoValor')} options={[['valor', 'R$ por mês'], ['percentual', '% do faturamento']]} />
      )}
      <TextInput label={percent ? 'Percentual (%)' : 'Valor mensal (R$)'} value={f.valor} onChange={set('valor')} inputMode="decimal" error={err.valor} />
      <TextInput label="Dia de vencimento" value={f.diaVencimento} onChange={set('diaVencimento')} inputMode="numeric" error={err.diaVencimento} />
    </Drawer>
  );
}
