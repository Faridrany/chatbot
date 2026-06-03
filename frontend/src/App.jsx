import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login';
import QRCode from './components/QRCode';
import Dashboard from './components/Dashboard';
import DataPengaduan from './components/DataPengaduan';
import DetailPengaduan from './components/DetailPengaduan';
import Statistik from './components/Statistik';
import Klasifikasi from './components/Klasifikasi';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin  = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  // Guard: hanya butuh login, QR opsional
  const auth = (element) =>
    isAuthenticated ? element : <Navigate to="/login" replace />;

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated
              ? <Login onLogin={handleLogin} />
              : <Navigate to="/qr-code" replace />
          }
        />
        <Route
          path="/qr-code"
          element={auth(<QRCode onConnect={() => {}} />)}
        />
        <Route path="/dashboard"            element={auth(<Dashboard    onLogout={handleLogout} />)} />
        <Route path="/data-pengaduan"       element={auth(<DataPengaduan onLogout={handleLogout} />)} />
        <Route path="/detail-pengaduan/:id" element={auth(<DetailPengaduan onLogout={handleLogout} />)} />
        <Route path="/statistik"            element={auth(<Statistik    onLogout={handleLogout} />)} />
        <Route path="/klasifikasi"          element={auth(<Klasifikasi  onLogout={handleLogout} />)} />
        <Route path="/"                     element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
