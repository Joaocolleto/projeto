import { useState } from 'react';
import { TextInput } from '../components/Field';
import { useApp } from '../context/AppContext';
import { toNumber } from '../lib/format';

export default function Parametros() {
  const { state, dispatch, toast } = useApp();
  const p = state.params;
  const [f, setF] = useState({
    margemDesejada: String(p.margemDesejada),
    margemMinima: String(p.margemMinima),
    custoHoraMdo: String(p.custoHoraMdo).replace('.', ','),
  });
  const [err, setErr] = useState({});
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const save = (e) => {
    e.preventDefault();
    const er = {};
    const d = toNumber(f.margemDesejada), m = toNumber(f.margemMinima), h = toNumber(f.custoHoraMdo);
    if (!(d > 0 && d < 100)) er.margemDesejada = 'Use um valor entre 1 e 99.';
    if (!(m >= 0 && m < 100)) er.margemMinima = 'Use um valor entre 0 e 99.';
    if (m > d) er.margemMinima = 'A margem mínima não pode passar da desejada.';
    if (h < 0) er.custoHoraMdo = 'Use um valor positivo.';
    setErr(er);
    if (Object.keys(er).length) return;
    dispatch({ type: 'SET_PARAMS', value: { margemDesejada: d, margemMinima: m, custoHoraMdo: h } });
    toast('Parâmetros salvos — tudo foi recalculado');
  };

  const reset = () => {
    if (window.confirm('Isso apaga seus cadastros e volta aos dados de exemplo. Continuar?')) {
      dispatch({ type: 'RESET' });
      toast('Dados de exemplo restaurados');
    }
  };

  return (
    <main className="page">
      <div className="page-head">
        <h1>Parâmetros</h1>
        <p className="page-sub">Regras de precificação usadas em todos os cálculos</p>
      </div>
      <form className="panel stack" style={{ maxWidth: 520 }} onSubmit={save} noValidate>
        <TextInput label="Margem desejada (%)" value={f.margemDesejada} onChange={set('margemDesejada')} inputMode="decimal" error={err.margemDesejada} hint="Lucro líquido que você quer ter sobre o preço de venda" />
        <TextInput label="Margem mínima (%)" value={f.margemMinima} onChange={set('margemMinima')} inputMode="decimal" error={err.margemMinima} hint="Abaixo disso o produto entra em alerta" />
        <TextInput label="Custo da mão de obra (R$/hora)" value={f.custoHoraMdo} onChange={set('custoHoraMdo')} inputMode="decimal" error={err.custoHoraMdo} />
        <div><button className="btn btn-primary" type="submit">Salvar parâmetros</button></div>
      </form>
      <p style={{ marginTop: 28 }}>
        <button className="btn-danger-link" onClick={reset} style={{ padding: 0 }}>Restaurar dados de exemplo</button>
      </p>
    </main>
  );
}
