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
  const { logout } = useAuth();
  const { toastMsg } = useApp();
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <>
      <header className="topbar">
        <span className="brand">Casa do Salgado</span>
        <nav className="topnav" aria-label="Principal">
          {NAV.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
        </nav>
        <button className="logout" onClick={logout}>Sair</button>
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
