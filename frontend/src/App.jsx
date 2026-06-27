import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./components/Login";
import QRCode from "./components/QRCode";
import Dashboard from "./components/Dashboard";
import DataPengaduan from "./components/DataPengaduan";
import DetailPengaduan from "./components/DetailPengaduan";
import DetailPengaduanBaru from "./components/DetailPengaduanBaru";
import Preprocessing from "./components/Preprocessing";
import Statistik from "./components/Statistik";
import Klasifikasi from "./components/Klasifikasi";
import TfidfDetail from "./components/TfidfDetail";
import RandomForestDetail from "./components/RandomForestDetail";
import EvaluasiModel from "./components/EvaluasiModel";
import EkstraksiStatistik from "./components/ekstraksi/EkstraksiStatistik";
import EkstraksiTermTokenisasi from "./components/ekstraksi/EkstraksiTermTokenisasi";
import EkstraksiFiltering from "./components/ekstraksi/EkstraksiFiltering";
import EkstraksiSeleksiFitur from "./components/ekstraksi/EkstraksiSeleksiFitur";
import EkstraksiMatriksTFIDF from "./components/ekstraksi/EkstraksiMatriksTFIDF";
import EkstraksiFinalProcessed from "./components/ekstraksi/EkstraksiFinalProcessed";
import RFBootstrap from "./components/rf/RFBootstrap";
import RFGini from "./components/rf/RFGini";
import RFOOB from "./components/rf/RFOOB";
import RFVoting from "./components/rf/RFVoting";
import RFFeatureImportance from "./components/rf/RFFeatureImportance";
import EvalMetrik from "./components/evaluasi/EvalMetrik";
import EvalConfusionMatrix from "./components/evaluasi/EvalConfusionMatrix";
import EvalCrossValidation from "./components/evaluasi/EvalCrossValidation";
import EvalErrorAnalysis from "./components/evaluasi/EvalErrorAnalysis";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  // Guard: hanya butuh login, QR opsional
  const auth = (element) => (isAuthenticated ? element : <Navigate to="/login" replace />);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/qr-code" replace />} />
        <Route path="/qr-code" element={auth(<QRCode onConnect={() => {}} />)} />
        <Route path="/dashboard" element={auth(<Dashboard onLogout={handleLogout} />)} />
        <Route path="/data-pengaduan" element={auth(<DataPengaduan onLogout={handleLogout} />)} />
        <Route path="/detail-pengaduan/:id" element={auth(<DetailPengaduan onLogout={handleLogout} />)} />
        <Route path="/detail-pengaduan-baru/:idx" element={auth(<DetailPengaduanBaru onLogout={handleLogout} />)} />
        <Route path="/preprocessing" element={auth(<Preprocessing onLogout={handleLogout} />)} />
        <Route path="/statistik" element={auth(<Statistik onLogout={handleLogout} />)} />
        <Route path="/klasifikasi" element={auth(<Klasifikasi onLogout={handleLogout} />)} />
        <Route path="/tfidf" element={auth(<TfidfDetail onLogout={handleLogout} />)} />

        {/* ── Sub-halaman Ekstraksi Fitur ── */}
        <Route path="/ekstraksi/statistik"        element={auth(<EkstraksiStatistik      onLogout={handleLogout} />)} />
        <Route path="/ekstraksi/term-tokenisasi"  element={auth(<EkstraksiTermTokenisasi onLogout={handleLogout} />)} />
        <Route path="/ekstraksi/filtering"        element={auth(<EkstraksiFiltering      onLogout={handleLogout} />)} />
        <Route path="/ekstraksi/seleksi-fitur"    element={auth(<EkstraksiSeleksiFitur   onLogout={handleLogout} />)} />
        <Route path="/ekstraksi/matriks-tfidf"   element={auth(<EkstraksiMatriksTFIDF   onLogout={handleLogout} />)} />
        <Route path="/ekstraksi/final-processed"  element={auth(<EkstraksiFinalProcessed onLogout={handleLogout} />)} />
        <Route path="/ekstraksi" element={<Navigate to="/ekstraksi/statistik" replace />} />

        {/* ── Sub-halaman Random Forest ── */}
        <Route path="/random-forest/bootstrap"          element={auth(<RFBootstrap          onLogout={handleLogout} />)} />
        <Route path="/random-forest/gini"               element={auth(<RFGini               onLogout={handleLogout} />)} />
        <Route path="/random-forest/oob"                element={auth(<RFOOB                onLogout={handleLogout} />)} />
        <Route path="/random-forest/voting"             element={auth(<RFVoting             onLogout={handleLogout} />)} />
        <Route path="/random-forest/feature-importance" element={auth(<RFFeatureImportance  onLogout={handleLogout} />)} />
        <Route path="/random-forest" element={<Navigate to="/random-forest/bootstrap" replace />} />

        {/* ── Sub-halaman Evaluasi Model ── */}
        <Route path="/evaluasi/confusion-matrix"  element={auth(<EvalConfusionMatrix onLogout={handleLogout} />)} />        
        <Route path="/evaluasi/metrik"            element={auth(<EvalMetrik          onLogout={handleLogout} />)} />
        <Route path="/evaluasi/cross-validation"  element={auth(<EvalCrossValidation onLogout={handleLogout} />)} />
        <Route path="/evaluasi/error-analysis"    element={auth(<EvalErrorAnalysis   onLogout={handleLogout} />)} />
        <Route path="/evaluasi" element={<Navigate to="/evaluasi/metrik" replace />} />

        {/* Legacy routes untuk backward compatibility */}
        <Route path="/random-forest-detail" element={auth(<RandomForestDetail onLogout={handleLogout} />)} />
        <Route path="/evaluasi-model" element={auth(<EvaluasiModel onLogout={handleLogout} />)} />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
