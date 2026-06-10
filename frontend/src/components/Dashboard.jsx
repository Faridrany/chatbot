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
      .then((s) => {
        setStats(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categoryData = stats
    ? Object.entries(stats.kategori).map(([name, value]) => ({
        name: CAT_LABEL[name] ?? name.charAt(0) + name.slice(1).toLowerCase(),
        value,
        color: CATEGORY_COLORS[name] || "#ccc",
      }))
    : [];

  const weeklyData = stats ? stats.weeklyData.map((jumlah, i) => ({ week: `Minggu ${i + 1}`, jumlah })) : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1">
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
                  <InfoCard label="Total Pengaduan" value={stats?.total ?? "-"} sub="Semua data terdaftar" accent="#2E7D32" />
                  <InfoCard
                    label="Baru 3 Hari Terakhir"
                    value={stats?.baru3Hari ?? "-"}
                    sub="Berdasarkan timestamp"
                    accent="#4CAF50"
                  />
                  <InfoCard
                    label="Baru 7 Hari Terakhir"
                    value={stats?.baru7Hari ?? "-"}
                    sub="Berdasarkan timestamp"
                    accent="#81C784"
                  />
                  <InfoCard
                    label="Kategori Terbanyak"
                    value={stats?.kategoriTerbanyak ? (CAT_LABEL[stats.kategoriTerbanyak] ?? stats.kategoriTerbanyak) : "-"}
                    sub={stats?.kategoriTerbanyak ? `${stats.kategori[stats.kategoriTerbanyak] ?? 0} pengaduan` : ""}
                    accent="#A5D6A7"
                    small
                  />
                </div>
              </div>

              {/* ── Charts ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="font-semibold mb-4 text-gray-800">Distribusi Kategori</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="font-semibold mb-4 text-gray-800">Pengaduan per Minggu (4 Minggu Terakhir)</h3>
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
