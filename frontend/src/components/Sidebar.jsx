import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, BarChart3, Cpu, LogOut, Users,
  FlaskConical, TreeDeciduous, Activity, ChevronDown, ChevronRight,
  PieChart, Hash, SlidersHorizontal, Star, Shuffle, GitBranch, ShieldCheck, Target,
  TrendingUp, Grid3x3, AlertCircle, CheckCircle2,
} from "lucide-react";

const EKSTRASI_SUBS = [
  { icon: Hash,              label: "Term & Tokenisasi",             path: "/ekstraksi/term-tokenisasi" },
  { icon: SlidersHorizontal, label: "Filtering (Min DF & Max DF)",       path: "/ekstraksi/filtering" },
  { icon: Star,              label: "Seleksi Fitur & Metode",            path: "/ekstraksi/seleksi-fitur" },
  { icon: Grid3x3,           label: "Output Matriks TF-IDF",             path: "/ekstraksi/matriks-tfidf" },
  { icon: CheckCircle2,      label: "Penerapan TF-IDF pada Pengaduan",   path: "/ekstraksi/final-processed" },
];

const RF_SUBS = [
  { icon: Shuffle,     label: "Bootstrap Sampling",        path: "/random-forest/bootstrap" },
  { icon: GitBranch,   label: "Gini Impurity & Splitting", path: "/random-forest/gini" },
  { icon: ShieldCheck, label: "OOB Score & Validasi",      path: "/random-forest/oob" },
  { icon: Target,      label: "Majority Voting & Prediksi", path: "/random-forest/voting" },
  { icon: Star,        label: "Feature Importance",        path: "/random-forest/feature-importance" },
];

const EVAL_SUBS = [
  { icon: Grid3x3,      label: "Confusion Matrix & Analisis", path: "/evaluasi/confusion-matrix" },
  { icon: CheckCircle2, label: "Metrik Akurasi & Performa",  path: "/evaluasi/metrik" },
  { icon: TrendingUp,   label: "Cross-Validation 5-Fold",    path: "/evaluasi/cross-validation" },
  { icon: AlertCircle,  label: "Error Analysis & Insights",  path: "/evaluasi/error-analysis" },
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();

  const isEkstrasiActive = EKSTRASI_SUBS.some((s) => location.pathname.startsWith("/ekstraksi"));
  const isRfActive       = RF_SUBS.some((s) => location.pathname.startsWith("/random-forest"));
  const isEvalActive     = EVAL_SUBS.some((s) => location.pathname.startsWith("/evaluasi"));

  const [ekstrasiOpen, setEkstrasiOpen] = useState(isEkstrasiActive);
  const [rfOpen, setRfOpen]             = useState(isRfActive);
  const [evalOpen, setEvalOpen]         = useState(isEvalActive);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard",      path: "/dashboard" },
    { icon: FileText,        label: "Data Pengaduan", path: "/data-pengaduan" },
    { icon: FlaskConical,    label: "Preprocessing",  path: "/preprocessing" },
  ];

  const menuItemsAfter = [
    { icon: Cpu, label: "Klasifikasi", path: "/klasifikasi" },
  ];

  const NavLink = ({ item }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <li key={item.path}>
        <Link
          to={item.path}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive
              ? "bg-white text-[#2E7D32] shadow-lg font-semibold"
              : "text-green-100 hover:bg-green-700 hover:text-white"
          }`}
        >
          <Icon className="w-5 h-5" />
          <span>{item.label}</span>
        </Link>
      </li>
    );
  };

  const SubMenu = ({ subs, isOpen }) => (
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
      <ul className="ml-3 pl-3 border-l-2 border-green-600 space-y-1">
        {subs.map((sub) => {
          const SubIcon = sub.icon;
          const isSubActive = location.pathname === sub.path;
          return (
            <li key={sub.path}>
              <Link
                to={sub.path}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm ${
                  isSubActive
                    ? "bg-white/20 text-white font-semibold shadow-inner"
                    : "text-green-200 hover:bg-green-700 hover:text-white"
                }`}
              >
                <SubIcon className="w-4 h-4 shrink-0" />
                <span className="leading-tight">{sub.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="w-64 bg-[#2E7D32] min-h-screen flex flex-col shadow-xl fixed left-0 top-0 bottom-0 z-50 overflow-y-auto">
      {/* Logo Header */}
      <div className="p-6 border-b border-green-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-[#2E7D32]" />
          </div>
          <div>
            <h2 className="text-white font-bold">Samboja</h2>
            <p className="text-xs text-green-200">Sistem Pengaduan</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {/* Top items */}
          {menuItems.map((item) => <NavLink key={item.path} item={item} />)}

          {/* ── Ekstraksi Fitur dropdown ── */}
          <li>
            <button
              onClick={() => setEkstrasiOpen((o) => !o)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isEkstrasiActive
                  ? "bg-white text-[#2E7D32] shadow-lg font-semibold"
                  : "text-green-100 hover:bg-green-700 hover:text-white"
              }`}
            >
              <FlaskConical className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">Ekstraksi Fitur</span>
              {ekstrasiOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            </button>
            <SubMenu subs={EKSTRASI_SUBS} isOpen={ekstrasiOpen} />
          </li>

          {/* ── Random Forest dropdown ── */}
          <li>
            <button
              onClick={() => setRfOpen((o) => !o)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isRfActive
                  ? "bg-white text-[#2E7D32] shadow-lg font-semibold"
                  : "text-green-100 hover:bg-green-700 hover:text-white"
              }`}
            >
              <TreeDeciduous className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">Random Forest</span>
              {rfOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            </button>
            <SubMenu subs={RF_SUBS} isOpen={rfOpen} />
          </li>

          {/* ── Evaluasi Model dropdown ── */}
          <li>
            <button
              onClick={() => setEvalOpen((o) => !o)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isEvalActive
                  ? "bg-white text-[#2E7D32] shadow-lg font-semibold"
                  : "text-green-100 hover:bg-green-700 hover:text-white"
              }`}
            >
              <Activity className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">Evaluasi Model</span>
              {evalOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            </button>
            <SubMenu subs={EVAL_SUBS} isOpen={evalOpen} />
          </li>

          {/* Bottom items */}
          {menuItemsAfter.map((item) => <NavLink key={item.path} item={item} />)}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-green-700">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-green-100 hover:bg-red-600 hover:text-white transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
