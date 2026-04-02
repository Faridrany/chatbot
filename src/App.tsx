import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login';
import QRCode from './components/QRCode';
import Dashboard from './components/Dashboard';
import DataPengaduan from './components/DataPengaduan';
import DetailPengaduan from './components/DetailPengaduan';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [qrConnected, setQrConnected] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleQRConnect = () => {
    setQrConnected(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setQrConnected(false);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? (
              <Login onLogin={handleLogin} />
            ) : (
              <Navigate to="/qr-code" replace />
            )
          } 
        />
        <Route 
          path="/qr-code" 
          element={
            isAuthenticated && !qrConnected ? (
              <QRCode onConnect={handleQRConnect} />
            ) : isAuthenticated && qrConnected ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated && qrConnected ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/data-pengaduan" 
          element={
            isAuthenticated && qrConnected ? (
              <DataPengaduan onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/detail-pengaduan/:id" 
          element={
            isAuthenticated && qrConnected ? (
              <DetailPengaduan onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
