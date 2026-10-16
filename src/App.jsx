import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, AuthProvider, useAuth } from './context/AppContext';
import Shell from './components/Shell';
import Login from './pages/Login';
import Home from './pages/Home';
import Cadastros from './pages/Cadastros';
import Precificacao from './pages/Precificacao';
import Equilibrio from './pages/Equilibrio';
import Simulacao from './pages/Simulacao';
import Relatorios from './pages/Relatorios';
import Parametros from './pages/Parametros';

function Private({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Private><Shell /></Private>}>
              <Route index element={<Home />} />
              <Route path="cadastros" element={<Cadastros />} />
              <Route path="precificacao" element={<Precificacao />} />
              <Route path="equilibrio" element={<Equilibrio />} />
              <Route path="simulacao" element={<Simulacao />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="parametros" element={<Parametros />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  );
}
