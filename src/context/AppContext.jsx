import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { seedData } from './seed';
import { toNumber, uid } from '../lib/format';

const KEY = 'casa-do-salgado:v1';
const AUTH_KEY = 'casa-do-salgado:auth';

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignora e usa os dados de exemplo */
  }
  return seedData();
};

const log = (state, entry) => ({
  ...state,
  historico: [{ id: uid(), data: new Date().toISOString(), ...entry }, ...state.historico],
});

function reducer(state, action) {
  switch (action.type) {
    case 'SAVE_SALGADO': {
      const s = action.value;
      const prev = state.salgados.find((x) => x.id === s.id);
      let next = {
        ...state,
        salgados: prev ? state.salgados.map((x) => (x.id === s.id ? s : x)) : [...state.salgados, s],
      };
      if (prev && toNumber(prev.preco) !== toNumber(s.preco)) {
        next = log(next, { tipo: 'preco', nome: s.nome, de: toNumber(prev.preco), para: toNumber(s.preco) });
      }
      return next;
    }
    case 'DELETE_SALGADO':
      return { ...state, salgados: state.salgados.filter((x) => x.id !== action.id) };

    case 'APPLY_PRICE': {
      const prev = state.salgados.find((x) => x.id === action.id);
      if (!prev) return state;
      const next = {
        ...state,
        salgados: state.salgados.map((x) => (x.id === action.id ? { ...x, preco: action.preco } : x)),
      };
      return log(next, { tipo: 'preco', nome: prev.nome, de: toNumber(prev.preco), para: action.preco });
    }

    case 'SAVE_INGREDIENTE': {
      const ing = action.value;
      const prev = state.ingredientes.find((x) => x.id === ing.id);
      let saved = { ...ing, atualizadoEm: ing.atualizadoEm };
      let next = state;
      if (!prev) {
        saved.atualizadoEm = new Date().toISOString();
      } else if (toNumber(prev.custo) !== toNumber(ing.custo)) {
        saved.atualizadoEm = new Date().toISOString();
        next = log(state, { tipo: 'ingrediente', nome: ing.nome, de: toNumber(prev.custo), para: toNumber(ing.custo) });
      }
      return {
        ...next,
        ingredientes: prev ? next.ingredientes.map((x) => (x.id === ing.id ? saved : x)) : [...next.ingredientes, saved],
      };
    }
    case 'DELETE_INGREDIENTE':
      return {
        ...state,
        ingredientes: state.ingredientes.filter((x) => x.id !== action.id),
        salgados: state.salgados.map((s) => ({
          ...s,
          ficha: s.ficha.filter((l) => l.ingredienteId !== action.id),
        })),
      };

    case 'SAVE_CUSTO': {
      const c = action.value;
      const exists = state.custos.some((x) => x.id === c.id);
      return { ...state, custos: exists ? state.custos.map((x) => (x.id === c.id ? c : x)) : [...state.custos, c] };
    }
    case 'DELETE_CUSTO':
      return { ...state, custos: state.custos.filter((x) => x.id !== action.id) };

    case 'SET_PARAMS':
      return { ...state, params: { ...state.params, ...action.value } };

    case 'RESET':
      return seedData();

    default:
      return state;
  }
}

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toastMsg, setToastMsg] = useState('');
  const timer = useRef();

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* armazenamento indisponível: segue só em memória */
    }
  }, [state]);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(''), 2600);
  }, []);

  const value = useMemo(() => ({ state, dispatch, toast, toastMsg }), [state, toast, toastMsg]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);

/* ---------- Autenticação (local, apenas para demonstração) ---------- */
// Troque por uma chamada à sua API quando houver back-end.
export const DEMO_USER = { usuario: 'admin', senha: 'salgado123' };

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => localStorage.getItem(AUTH_KEY));

  const login = (usuario, senha) => {
    if (usuario.trim().toLowerCase() === DEMO_USER.usuario && senha === DEMO_USER.senha) {
      localStorage.setItem(AUTH_KEY, usuario.trim());
      setUser(usuario.trim());
      return true;
    }
    return false;
  };
  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
