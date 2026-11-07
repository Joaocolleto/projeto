/**
 * Cliente HTTP e integrações com o backend da Casa do Salgado.
 */

const TOKEN_KEY = 'casa-do-salgado:token';
const API_BASE = import.meta.env.VITE_API_URL || '';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  constructor(mensagem, { status, codigo, detalhes } = {}) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

/**
 * Wrapper sobre fetch para padronizar headers, autorização e tratamento de erro.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getToken();

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.', {
      status: 0,
      codigo: 'OFFLINE',
      detalhes: err.message,
    });
  }

  if (res.status === 204) {
    return null;
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const msg = data?.erro || data?.message || `Erro na requisição (${res.status})`;
    throw new ApiError(msg, {
      status: res.status,
      codigo: data?.codigo,
      detalhes: data?.detalhes,
    });
  }

  return data;
}

/* =====================================================================
 * Módulos da API
 * ===================================================================== */

export const api = {
  auth: {
    async login(nome, senha) {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { nome, senha },
      });
      if (data?.token) setToken(data.token);
      return data;
    },
    async eu() {
      return apiFetch('/api/auth/eu');
    },
    logout() {
      setToken(null);
    },
  },

  ingredientes: {
    async listar() {
      return apiFetch('/api/ingredientes');
    },
    async buscar(id) {
      return apiFetch(`/api/ingredientes/${id}`);
    },
    async criar(dados) {
      return apiFetch('/api/ingredientes', {
        method: 'POST',
        body: dados,
      });
    },
    async atualizar(id, dados) {
      return apiFetch(`/api/ingredientes/${id}`, {
        method: 'PUT',
        body: dados,
      });
    },
    async remover(id) {
      return apiFetch(`/api/ingredientes/${id}`, {
        method: 'DELETE',
      });
    },
  },

  produtos: {
    async listar(todos = true) {
      return apiFetch(`/api/produtos${todos ? '?todos=true' : ''}`);
    },
    async buscar(id) {
      return apiFetch(`/api/produtos/${id}`);
    },
    async criar(dados) {
      return apiFetch('/api/produtos', {
        method: 'POST',
        body: dados,
      });
    },
    async atualizar(id, dados) {
      return apiFetch(`/api/produtos/${id}`, {
        method: 'PUT',
        body: dados,
      });
    },
    async alternarAtivo(id, ativo) {
      return apiFetch(`/api/produtos/${id}/ativo`, {
        method: 'PATCH',
        body: { ativo },
      });
    },
    async remover(id) {
      return apiFetch(`/api/produtos/${id}`, {
        method: 'DELETE',
      });
    },
  },
};

/* =====================================================================
 * Conversores de formato: Backend (API) <-> Frontend (UI / Cálculos)
 * ===================================================================== */

/**
 * Converte um ingrediente retornado pelo backend para o formato usado na UI/cálculos do front.
 */
export function ingredienteToFront(apiIng, localMeta = {}) {
  const meta = localMeta || {};
  const quantidade = Number(meta.quantidade) > 0 ? Number(meta.quantidade) : 1;
  const custoUnitario = Number(apiIng.custoUnitario || 0);

  return {
    id: String(apiIng.id),
    nome: apiIng.nome,
    unidade: (apiIng.unidade || 'kg').toLowerCase(),
    quantidade,
    // No front, o campo custo representa o valor do pacote com a quantidade informada
    custo: custoUnitario * quantidade,
    fornecedor: meta.fornecedor || '',
    atualizadoEm: apiIng.atualizadoEm || new Date().toISOString(),
  };
}

/**
 * Converte um ingrediente do front para o payload esperado pela API do backend.
 */
export function ingredienteToBack(frontIng) {
  const qtd = Number(frontIng.quantidade) > 0 ? Number(frontIng.quantidade) : 1;
  const custoTotal = Number(frontIng.custo) || 0;
  const custoUnitario = custoTotal / qtd;

  return {
    nome: String(frontIng.nome || '').trim(),
    unidade: String(frontIng.unidade || 'kg').toUpperCase(),
    custoUnitario: Number(custoUnitario.toFixed(4)),
  };
}

/**
 * Converte um produto retornado pelo backend para o formato usado na UI/cálculos do front.
 */
export function produtoToFront(apiProd, localMeta = {}) {
  const meta = localMeta || {};
  return {
    id: String(apiProd.id),
    nome: apiProd.nome,
    categoria: meta.categoria || 'Frito',
    rendimento: Number(apiProd.rendimento || 1),
    preco: Number(apiProd.precoVenda || 0),
    volumeMensal: Number(meta.volumeMensal) > 0 ? Number(meta.volumeMensal) : 500,
    tempoPreparo: Number(meta.tempoPreparo) > 0 ? Number(meta.tempoPreparo) : 60,
    ativo: apiProd.ativo ?? true,
    ficha: (apiProd.ingredientes || []).map((item) => ({
      ingredienteId: String(item.ingredienteId),
      quantidade: Number(item.quantidade),
      unidade: String(item.unidadeReceita || 'g').toLowerCase(),
    })),
  };
}

/**
 * Converte um produto do front para o payload esperado pela API do backend.
 */
export function produtoToBack(frontProd) {
  return {
    nome: String(frontProd.nome || '').trim(),
    rendimento: Number(frontProd.rendimento) > 0 ? Number(frontProd.rendimento) : 1,
    precoVenda: Number(frontProd.preco) >= 0 ? Number(frontProd.preco) : 0,
    ativo: frontProd.ativo ?? true,
    ingredientes: (frontProd.ficha || [])
      .filter((l) => l.ingredienteId && Number(l.quantidade) > 0)
      .map((l) => ({
        ingredienteId: Number(l.ingredienteId),
        quantidade: Number(l.quantidade),
        unidadeReceita: String(l.unidade || 'g').toUpperCase(),
      })),
  };
}
