import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { seedData } from './seed';
import { toNumber, uid } from '../lib/format';
import {
  api,
  ApiError,
  getToken,
  ingredienteToBack,
  ingredienteToFront,
  produtoToBack,
  produtoToFront,
  setToken,
} from '../lib/api';

const KEY = 'casa-do-salgado:v1';
const AUTH_KEY = 'casa-do-salgado:auth';
const META_KEY = 'casa-do-salgado:meta:v1';

const loadMeta = () => {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignora */
  }
  return { ingredientes: {}, salgados: {} };
};

const saveMeta = (meta) => {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignora */
  }
};

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
    case 'SYNC_FROM_API': {
      const { ingredientes, salgados } = action;
      return {
        ...state,
        ...(ingredientes ? { ingredientes } : {}),
        ...(salgados ? { salgados } : {}),
      };
    }

    case 'SAVE_SALGADO': {
      const s = action.value;
      const prev = state.salgados.find((x) => String(x.id) === String(s.id));
      let next = {
        ...state,
        salgados: prev ? state.salgados.map((x) => (String(x.id) === String(s.id) ? s : x)) : [...state.salgados, s],
      };
      if (prev && toNumber(prev.preco) !== toNumber(s.preco)) {
        next = log(next, { tipo: 'preco', nome: s.nome, de: toNumber(prev.preco), para: toNumber(s.preco) });
      }
      return next;
    }

    case 'DELETE_SALGADO':
      return { ...state, salgados: state.salgados.filter((x) => String(x.id) !== String(action.id)) };

    case 'APPLY_PRICE': {
      const prev = state.salgados.find((x) => String(x.id) === String(action.id));
      if (!prev) return state;
      const next = {
        ...state,
        salgados: state.salgados.map((x) => (String(x.id) === String(action.id) ? { ...x, preco: action.preco } : x)),
      };
      return log(next, { tipo: 'preco', nome: prev.nome, de: toNumber(prev.preco), para: action.preco });
    }

    case 'SAVE_INGREDIENTE': {
      const ing = action.value;
      const prev = state.ingredientes.find((x) => String(x.id) === String(ing.id));
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
        ingredientes: prev ? next.ingredientes.map((x) => (String(x.id) === String(ing.id) ? saved : x)) : [...next.ingredientes, saved],
      };
    }

    case 'DELETE_INGREDIENTE':
      return {
        ...state,
        ingredientes: state.ingredientes.filter((x) => String(x.id) !== String(action.id)),
        salgados: state.salgados.map((s) => ({
          ...s,
          ficha: s.ficha.filter((l) => String(l.ingredienteId) !== String(action.id)),
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
  const [carregandoApi, setCarregandoApi] = useState(false);
  const [conectadoApi, setConectadoApi] = useState(false);
  const timer = useRef();

  // Persiste estado local para redundância e dados locais (custos fixos, parâmetros)
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

  // Sincroniza dados da API do backend
  const carregarDadosApi = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setCarregandoApi(true);
    const meta = loadMeta();
    let loadedIngs = null;
    let loadedProds = null;

    try {
      const apiIngredientes = await api.ingredientes.listar();
      if (Array.isArray(apiIngredientes)) {
        loadedIngs = apiIngredientes.map((i) => ingredienteToFront(i, meta.ingredientes[i.id]));
      }
    } catch (err) {
      console.warn('Não foi possível carregar ingredientes da API:', err.message);
    }

    try {
      const apiProdutos = await api.produtos.listar(true);
      if (Array.isArray(apiProdutos)) {
        loadedProds = apiProdutos.map((p) => produtoToFront(p, meta.salgados[p.id]));
      }
    } catch (err) {
      console.warn('Não foi possível carregar produtos da API:', err.message);
    }

    if (loadedIngs || loadedProds) {
      setConectadoApi(true);
      dispatch({
        type: 'SYNC_FROM_API',
        ingredientes: loadedIngs,
        salgados: loadedProds,
      });
    } else {
      setConectadoApi(false);
    }
    setCarregandoApi(false);
  }, []);

  // Chama carregarDadosApi na montagem inicial se houver token
  useEffect(() => {
    if (getToken()) {
      carregarDadosApi();
    }
  }, [carregarDadosApi]);

  // Ações integradas com a API para Ingredientes
  const saveIngrediente = useCallback(async (ing) => {
    const meta = loadMeta();
    meta.ingredientes[ing.id] = {
      quantidade: ing.quantidade,
      fornecedor: ing.fornecedor,
    };
    saveMeta(meta);

    const isNumericId = /^\d+$/.test(String(ing.id));
    const payload = ingredienteToBack(ing);

    try {
      if (isNumericId) {
        const atualizado = await api.ingredientes.atualizar(Number(ing.id), payload);
        const itemFront = ingredienteToFront(atualizado, {
          quantidade: ing.quantidade,
          fornecedor: ing.fornecedor,
        });
        dispatch({ type: 'SAVE_INGREDIENTE', value: itemFront });
        return itemFront;
      } else {
        const criado = await api.ingredientes.criar(payload);
        const itemFront = ingredienteToFront(criado, {
          quantidade: ing.quantidade,
          fornecedor: ing.fornecedor,
        });
        // Atualiza chave de metadados para o id retornado pelo banco
        meta.ingredientes[itemFront.id] = meta.ingredientes[ing.id];
        saveMeta(meta);
        dispatch({ type: 'SAVE_INGREDIENTE', value: itemFront });
        return itemFront;
      }
    } catch (err) {
      // Se a API falhou mas temos modo offline/fallback local
      if (err instanceof ApiError && err.codigo !== 'OFFLINE') {
        throw err;
      }
      // Se offline, salva no reducer localmente
      dispatch({ type: 'SAVE_INGREDIENTE', value: ing });
      return ing;
    }
  }, []);

  const deleteIngrediente = useCallback(async (id) => {
    const isNumericId = /^\d+$/.test(String(id));
    if (isNumericId) {
      try {
        await api.ingredientes.remover(Number(id));
      } catch (err) {
        if (err instanceof ApiError && err.codigo !== 'OFFLINE') {
          throw err;
        }
      }
    }
    dispatch({ type: 'DELETE_INGREDIENTE', id });
  }, []);

  // Ações integradas com a API para Produtos (Salgados)
  const saveSalgado = useCallback(async (salgado) => {
    const meta = loadMeta();
    meta.salgados[salgado.id] = {
      categoria: salgado.categoria,
      volumeMensal: salgado.volumeMensal,
      tempoPreparo: salgado.tempoPreparo,
    };
    saveMeta(meta);

    const isNumericId = /^\d+$/.test(String(salgado.id));
    const payload = produtoToBack(salgado);

    try {
      if (isNumericId) {
        const atualizado = await api.produtos.atualizar(Number(salgado.id), payload);
        const itemFront = produtoToFront(atualizado, {
          categoria: salgado.categoria,
          volumeMensal: salgado.volumeMensal,
          tempoPreparo: salgado.tempoPreparo,
        });
        dispatch({ type: 'SAVE_SALGADO', value: itemFront });
        return itemFront;
      } else {
        const criado = await api.produtos.criar(payload);
        const itemFront = produtoToFront(criado, {
          categoria: salgado.categoria,
          volumeMensal: salgado.volumeMensal,
          tempoPreparo: salgado.tempoPreparo,
        });
        meta.salgados[itemFront.id] = meta.salgados[salgado.id];
        saveMeta(meta);
        dispatch({ type: 'SAVE_SALGADO', value: itemFront });
        return itemFront;
      }
    } catch (err) {
      if (err instanceof ApiError && err.codigo !== 'OFFLINE') {
        throw err;
      }
      dispatch({ type: 'SAVE_SALGADO', value: salgado });
      return salgado;
    }
  }, []);

  const deleteSalgado = useCallback(async (id) => {
    const isNumericId = /^\d+$/.test(String(id));
    if (isNumericId) {
      try {
        await api.produtos.remover(Number(id));
      } catch (err) {
        if (err instanceof ApiError && err.codigo !== 'OFFLINE') {
          throw err;
        }
      }
    }
    dispatch({ type: 'DELETE_SALGADO', id });
  }, []);

  const applyPrice = useCallback(async (id, preco) => {
    const isNumericId = /^\d+$/.test(String(id));
    if (isNumericId) {
      try {
        await api.produtos.atualizar(Number(id), { precoVenda: toNumber(preco) });
      } catch (err) {
        console.warn('Erro ao atualizar preço na API:', err.message);
      }
    }
    dispatch({ type: 'APPLY_PRICE', id, preco });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      toast,
      toastMsg,
      carregarDadosApi,
      carregandoApi,
      conectadoApi,
      saveIngrediente,
      deleteIngrediente,
      saveSalgado,
      deleteSalgado,
      applyPrice,
    }),
    [
      state,
      toast,
      toastMsg,
      carregarDadosApi,
      carregandoApi,
      conectadoApi,
      saveIngrediente,
      deleteIngrediente,
      saveSalgado,
      deleteSalgado,
      applyPrice,
    ]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);

/* ---------- Autenticação com JWT Real da API ---------- */
export const DEMO_USER = { usuario: 'admin', senha: 'salgado123' };

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return { nome: saved, cargo: 'GESTOR' };
    }
  });
  const [autenticando, setAutenticando] = useState(false);

  // Valida a sessão com o endpoint GET /api/auth/eu se houver token
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    api.auth
      .eu()
      .then((dadosUsuario) => {
        setUser(dadosUsuario);
        localStorage.setItem(AUTH_KEY, JSON.stringify(dadosUsuario));
      })
      .catch((err) => {
        // Se a sessão expirou ou token inválido, desloga
        if (err.status === 401 || err.status === 404) {
          logout();
        }
      });
  }, []);

  const login = async (usuario, senha) => {
    setAutenticando(true);
    const nomeTrim = usuario.trim();

    try {
      const res = await api.auth.login(nomeTrim, senha);
      const userObj = res.usuario || { nome: nomeTrim, cargo: 'GESTOR' };
      localStorage.setItem(AUTH_KEY, JSON.stringify(userObj));
      setUser(userObj);
      setAutenticando(false);
      return { ok: true, usuario: userObj };
    } catch (err) {
      // Se backend offline ou credenciais batem com demo, permite entrar em modo demonstração
      if (
        nomeTrim.toLowerCase() === DEMO_USER.usuario.toLowerCase() &&
        senha === DEMO_USER.senha
      ) {
        const demoUser = { id: 0, nome: DEMO_USER.usuario, cargo: 'GESTOR', demo: true };
        localStorage.setItem(AUTH_KEY, JSON.stringify(demoUser));
        setUser(demoUser);
        setAutenticando(false);
        return { ok: true, usuario: demoUser, demo: true };
      }

      setAutenticando(false);
      return {
        ok: false,
        erro: err.message || 'Nome ou senha incorretos.',
        codigo: err.codigo,
      };
    }
  };

  const logout = () => {
    api.auth.logout();
    localStorage.removeItem(AUTH_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, autenticando }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
