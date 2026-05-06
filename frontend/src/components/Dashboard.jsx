import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CATEGORY_COLORS = {
  INFRASTRUKTUR: "#2E7D32",
  LINGKUNGAN: "#4CAF50",
  KEAMANAN: "#A5D6A7",
  PELAYANAN: "#81C784",
};

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal fetch stats:", err);
        setLoading(false);
      });
  }, []);

  const categoryData = stats
    ? Object.entries(stats.kategori).map(([name, value]) => ({
        name: name.charAt(0) + name.slice(1).toLowerCase(),
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

        <main className="p-8">
          {loading ? (
            <p className="text-gray-500">Memuat data...</p>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="text-sm text-gray-500 mb-1">Total Pengaduan</h3>
                  <p className="text-3xl font-bold">{stats?.total ?? "-"}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="text-sm text-gray-500 mb-1">Baru 3 Hari</h3>
                  <p className="text-3xl font-bold">{stats?.baru3Hari ?? "-"}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="text-sm text-gray-500 mb-1">Baru 7 Hari</h3>
                  <p className="text-3xl font-bold">{stats?.baru7Hari ?? "-"}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="text-sm text-gray-500 mb-1">Kategori Terbanyak</h3>
                  <p className="text-lg font-semibold capitalize">
                    {stats?.kategoriTerbanyak?.charAt(0) + stats?.kategoriTerbanyak?.slice(1).toLowerCase() ?? "-"}
                  </p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="font-semibold mb-4">Distribusi Kategori</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="font-semibold mb-4">Pengaduan per Minggu (4 Minggu Terakhir)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="jumlah" fill="#2E7D32" />
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
