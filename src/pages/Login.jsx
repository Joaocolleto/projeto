import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';

export default function Login() {
  const { user, login, autenticando } = useAuth();
  const nav = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [esqueci, setEsqueci] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErro('');
    if (!usuario.trim() || !senha) return setErro('Informe usuário e senha.');

    const res = await login(usuario, senha);
    if (res.ok) {
      nav('/', { replace: true });
    } else {
      setErro(res.erro || 'Usuário ou senha incorretos.');
    }
  };

  return (
    <main className="login">
      <form className="login-card stack" onSubmit={submit} noValidate>
        <div>
          <p className="welcome">Bem-vindo de volta</p>
          <h1>Entrar</h1>
        </div>
        <div className="field">
          <label htmlFor="usuario">Usuário</label>
          <input
            id="usuario"
            className="input"
            autoComplete="username"
            autoFocus
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            disabled={autenticando}
          />
        </div>
        <div className="field">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            className="input"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={autenticando}
          />
          <button type="button" className="link" onClick={() => setEsqueci((v) => !v)}>
            Esqueci a senha
          </button>
        </div>
        {esqueci && (
          <p className="hint">Peça ao gestor da Casa do Salgado para redefinir seu acesso no backend.</p>
        )}
        {erro && <p className="error" role="alert">{erro}</p>}
        <button className="btn btn-primary" type="submit" disabled={autenticando}>
          {autenticando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
