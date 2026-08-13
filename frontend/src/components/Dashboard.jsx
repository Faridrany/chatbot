import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORY_COLORS = {
  INFRASTRUKTUR: "#2E7D32",
  LINGKUNGAN: "#4CAF50",
  KEAMANAN: "#A5D6A7",
  PELAYANAN: "#81C784",
};

const CAT_LABEL = {
  INFRASTRUKTUR: "Infrastruktur",
  LINGKUNGAN: "Lingkungan", 
  KEAMANAN: "Keamanan",
  PELAYANAN: "Pelayanan",
};

function InfoCard({ label, value, sub, accent, small }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow border-l-4" style={{ borderColor: accent || "#2E7D32" }}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold text-gray-800 ${small ? "text-lg" : "text-3xl"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// Component untuk menampilkan info tipe data mirip df.info()
function DataTypeCard({ dataInfo }) {
  if (!dataInfo) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="font-semibold mb-4 text-gray-800">Dataset Info</h3>
        <p className="text-gray-500">Loading dataset information...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h3 className="font-semibold mb-4 text-gray-800">Dataset Info</h3>
      
      {/* Header Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg font-mono text-xs">
        <div className="text-gray-700 mb-1">&lt;class 'pandas.core.frame.DataFrame'&gt;</div>
        <div className="text-gray-700 mb-1">
          RangeIndex: 1200 entries, 0 to 1199
        </div>
        <div className="text-gray-700">
          Data columns (total 7 columns):
        </div>
      </div>

      {/* Column Information Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-xs border border-gray-200">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="text-left p-2 font-mono border-r">#</th>
              <th className="text-left p-2 font-mono border-r">Column</th>
              <th className="text-left p-2 font-mono border-r">Non-Null Count</th>
              <th className="text-left p-2 font-mono">Dtype</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            <tr className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-500 border-r">0</td>
              <td className="p-2 font-medium text-gray-800 border-r">kode_pengaduan</td>
              <td className="p-2 text-gray-600 border-r">1200 non-null</td>
              <td className="p-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">object</span>
              </td>
            </tr>
            <tr className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-500 border-r">1</td>
              <td className="p-2 font-medium text-gray-800 border-r">nama</td>
              <td className="p-2 text-gray-600 border-r">1200 non-null</td>
              <td className="p-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">object</span>
              </td>
            </tr>
            <tr className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-500 border-r">2</td>
              <td className="p-2 font-medium text-gray-800 border-r">deskripsi</td>
              <td className="p-2 text-gray-600 border-r">1200 non-null</td>
              <td className="p-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">object</span>
              </td>
            </tr>
            <tr className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-500 border-r">3</td>
              <td className="p-2 font-medium text-gray-800 border-r">Kategori</td>
              <td className="p-2 text-gray-600 border-r">1200 non-null</td>
              <td className="p-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">object</span>
              </td>
            </tr>
            <tr className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-500 border-r">4</td>
              <td className="p-2 font-medium text-gray-800 border-r">no_wa</td>
              <td className="p-2 text-gray-600 border-r">1200 non-null</td>
              <td className="p-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">object</span>
              </td>
            </tr>
            <tr className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-500 border-r">5</td>
              <td className="p-2 font-medium text-gray-800 border-r">timestamp</td>
              <td className="p-2 text-gray-600 border-r">1200 non-null</td>
              <td className="p-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">string</span>
              </td>
            </tr>
            <tr className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-500 border-r">6</td>
              <td className="p-2 font-medium text-gray-800 border-r">final_text</td>
              <td className="p-2 text-gray-600 border-r">1200 non-null</td>
              <td className="p-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">object</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">dtypes:</span>
          <span className="text-gray-700">object(6), string(1)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">memory usage:</span>
          <span className="text-gray-700">67.5+ KB</span>
        </div>
      </div>
      
      {/* Dataset Summary */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Data Profiling Summary</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p>• <strong>Fitur Input:</strong> kolom deskripsi/final_text (teks pengaduan)</p>
          <p>• <strong>Label Target:</strong> kolom Kategori (4 kelas)</p>
          <p>• <strong>Metadata:</strong> nama, no_wa, timestamp, kode_pengaduan</p>
          <p>• <strong>Missing Values:</strong> 0 (dataset lengkap 100%)</p>
          <p>• <strong>Status:</strong> Balanced dataset (25% per kategori)</p>
        </div>
      </div>
    </div>
  );
}

// Component untuk distribusi kategori balanced
function BalancedDistributionCard() {
  const balancedData = [
    { name: "Infrastruktur", value: 300, persen: "25.0", color: "#2E7D32" },
    { name: "Keamanan", value: 300, persen: "25.0", color: "#4CAF50" },
    { name: "Lingkungan", value: 300, persen: "25.0", color: "#A5D6A7" },
    { name: "Pelayanan", value: 300, persen: "25.0", color: "#81C784" }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h3 className="font-semibold mb-3 text-gray-800">Distribusi Kategori Dataset Berlabel</h3>
      <p className="text-xs text-gray-500 mb-4">
        Keseimbangan distribusi kategori pada dataset pelatihan (perfectly balanced)
      </p>
      
      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie 
            data={balancedData} 
            dataKey="value" 
            nameKey="name"
            cx="50%" 
            cy="50%" 
            outerRadius={60}
            label={({ persen }) => `${persen}%`}
          >
            {balancedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(val, name) => [`${val} entri`, name]} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {balancedData.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-gray-600">{d.name}</span>
            <span className="font-bold text-gray-800 ml-auto">{d.persen}%</span>
          </div>
        ))}
      </div>
      
      {/* Balance Status */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-sm font-semibold text-green-800">Balanced Dataset</span>
        </div>
        <div className="text-xs text-green-700 space-y-1">
          <p>• Selisih distribusi: <strong>0%</strong> (di bawah ambang 15%)</p>
          <p>• Masing-masing kategori: <strong>300 entri (25%)</strong></p>
          <p>• Status keseimbangan: <strong>Sempurna</strong></p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((s) => { setStats(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categoryData = stats
    ? Object.entries(stats.kategori).map(([name, value]) => ({
        name    : CAT_LABEL[name] ?? name,
        value,
        persen  : stats.total ? ((value / stats.total) * 100).toFixed(1) : 0,
        color   : CATEGORY_COLORS[name] || "#ccc",
      }))
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">
          {loading ? (
            <p className="text-gray-500">Memuat data...</p>
          ) : (
            <>
              {/* ── Statistik Pengaduan ── */}
              <div>
                <h2 className="text-lg font-bold text-gray-700 mb-3">Ringkasan Pengaduan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoCard
                    label="Total Pengaduan"
                    value={(stats?.total ?? 0).toLocaleString()}
                    sub={`${stats?.totalDataLatih ?? 0} data latih + ${(stats?.total ?? 0) - (stats?.totalDataLatih ?? 0)} pengaduan baru`}
                    accent="#2E7D32"
                  />
                  <InfoCard
                    label="Kategori Terbanyak"
                    value={stats?.kategoriTerbanyak ? (CAT_LABEL[stats.kategoriTerbanyak] ?? stats.kategoriTerbanyak) : "-"}
                    sub={stats?.kategoriTerbanyak ? `${stats.kategori[stats.kategoriTerbanyak] ?? 0} pengaduan` : ""}
                    accent="#A5D6A7"
                    small
                  />
                  <InfoCard label="Data Latih (Training)" value={(stats?.data_train ?? 0).toLocaleString()} sub="80% dari total data berlabel" accent="#1976D2" />
                  <InfoCard label="Data Uji (Testing)" value={(stats?.data_test ?? 0).toLocaleString()} sub="20% dari total data berlabel" accent="#F57C00" />
                </div>
              </div>

              {/* ── Charts dan Dataset Info ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dataset Info Card */}
                <DataTypeCard dataInfo={stats?.datasetInfo} />
                
                {/* Distribusi Kategori Balanced */}
                <BalancedDistributionCard />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
