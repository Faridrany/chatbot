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

  // Weekly dari timestamp — stats.weeklyData sudah dihitung server dari timestamp nyata
  const weeklyData = stats
    ? stats.weeklyData.map((jumlah, i) => ({ week: `Minggu ${i + 1}`, jumlah }))
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
                  <InfoCard label="Baru 3 Hari Terakhir" value={stats?.baru3Hari ?? "-"} sub="Berdasarkan timestamp" accent="#4CAF50" />
                  <InfoCard label="Baru 7 Hari Terakhir" value={stats?.baru7Hari ?? "-"} sub="Berdasarkan timestamp" accent="#81C784" />
                  <InfoCard
                    label="Kategori Terbanyak"
                    value={stats?.kategoriTerbanyak ? (CAT_LABEL[stats.kategoriTerbanyak] ?? stats.kategoriTerbanyak) : "-"}
                    sub={stats?.kategoriTerbanyak ? `${stats.kategori[stats.kategoriTerbanyak] ?? 0} pengaduan` : ""}
                    accent="#A5D6A7"
                    small
                  />
                </div>
              </div>

              {/* ── Card data latih & uji ── */}
              <div>
                <h2 className="text-lg font-bold text-gray-700 mb-3">Detail Data Training Model</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoCard label="Data Latih (Training)" value={(stats?.data_train ?? 0).toLocaleString()} sub="80% dari total data berlabel" accent="#1976D2" />
                  <InfoCard label="Data Uji (Testing)" value={(stats?.data_test ?? 0).toLocaleString()} sub="20% dari total data berlabel" accent="#F57C00" />
                  <InfoCard label="Total Data Berlabel" value={(stats?.totalDataLatih ?? 0).toLocaleString()} sub="Dataset untuk training model" accent="#388E3C" />
                </div>
              </div>

              {/* ── Charts ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribusi kategori dengan persentase */}
                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="font-semibold mb-1 text-gray-800">Distribusi Kategori</h3>
                  <p className="text-xs text-gray-400 mb-4">Persentase tiap kategori dari seluruh data pengaduan</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name"
                        label={({ name, persen }) => `${name} ${persen}%`} labelLine={false}>
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(val, name) => [val, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legenda manual dengan persentase */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {categoryData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-gray-600">{d.name}</span>
                        <span className="font-bold text-gray-800 ml-auto">{d.persen}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pengaduan per minggu dari timestamp nyata */}
                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="font-semibold mb-1 text-gray-800">Pengaduan per Minggu</h3>
                  <p className="text-xs text-gray-400 mb-4">4 minggu terakhir berdasarkan timestamp database</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="jumlah" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
