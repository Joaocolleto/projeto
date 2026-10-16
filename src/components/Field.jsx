import { useId } from 'react';

export function Field({ label, error, hint, children }) {
  const id = useId();
  const child = children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? id + '-e' : undefined });
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {child}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="error" id={id + '-e'}>{error}</span>}
    </div>
  );
}

export function TextInput({ label, value, onChange, error, hint, inputMode, placeholder }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(p) => (
        <input {...p} className="input" value={value} inputMode={inputMode} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

export function SelectInput({ label, value, onChange, options, error }) {
  return (
    <Field label={label} error={error}>
      {(p) => (
        <select {...p} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Segmented({ label, value, onChange, options }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
        ))}
      </div>
    </div>
  );
}
