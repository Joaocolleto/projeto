import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp, useAuth } from '../context/AppContext';
import { BackIcon } from './Icons';

const NAV = [
  ['/', 'Início', true],
  ['/cadastros', 'Cadastros'],
  ['/precificacao', 'Precificação'],
  ['/equilibrio', 'Ponto de equilíbrio'],
  ['/simulacao', 'Simulação'],
  ['/relatorios', 'Relatórios'],
  ['/parametros', 'Parâmetros'],
];

export default function Shell() {
  const { logout, user } = useAuth();
  const { toastMsg } = useApp();
  const nav = useNavigate();
  const { pathname } = useLocation();

  const nomeUsuario = typeof user === 'string' ? user : user?.nome || 'Usuário';

  return (
    <>
      <header className="topbar">
        <span className="brand">Casa do Salgado</span>
        <nav className="topnav" aria-label="Principal">
          {NAV.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }} title={`Perfil: ${user?.cargo || 'GESTOR'}`}>
            {nomeUsuario}
          </span>
          <button className="logout" onClick={logout}>Sair</button>
        </div>
      </header>

      <Outlet />

      {pathname !== '/' && (
        <button className="back-fab" onClick={() => nav('/')} aria-label="Voltar ao início">
          <BackIcon />
        </button>
      )}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </>
  );
}
