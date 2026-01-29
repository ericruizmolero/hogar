import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Property } from './pages/Property';
import { Compare } from './pages/Compare';
import { Reminders } from './pages/Reminders';
import { MapView } from './pages/MapView';
import { Settings } from './pages/Settings';
import { Simulator } from './pages/Simulator';
import { ToContact } from './pages/ToContact';
import { VisitChecklist } from './pages/VisitChecklist';

function PrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/property/:id" element={<Property />} />
            <Route path="/visita/:id" element={<VisitChecklist />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/simulador" element={<Simulator />} />
            <Route path="/contactar" element={<ToContact />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
