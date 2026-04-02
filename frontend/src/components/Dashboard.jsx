import Sidebar from "./Sidebar";
import Header from "./Header";
import { FileText, Clock, Calendar, PieChart as PieChartIcon, TrendingUp, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Mock data
const categoryData = [
  { name: "Infrastruktur", value: 45, color: "#2E7D32" },
  { name: "Lingkungan", value: 30, color: "#4CAF50" },
  { name: "Keamanan", value: 15, color: "#A5D6A7" },
  { name: "Pelayanan", value: 10, color: "#81C784" },
];

const weeklyData = [
  { week: "Minggu 1", jumlah: 25 },
  { week: "Minggu 2", jumlah: 35 },
  { week: "Minggu 3", jumlah: 28 },
  { week: "Minggu 4", jumlah: 42 },
];

export default function Dashboard({ onLogout }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1">
        <Header />

        <main className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3>Total Pengaduan</h3>
              <p className="text-3xl">130</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3>Baru 3 Hari</h3>
              <p className="text-3xl">24</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3>Baru 7 Hari</h3>
              <p className="text-3xl">42</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <h3>Kategori Terbanyak</h3>
              <p>Infrastruktur</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie */}
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3>Distribusi Kategori</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar */}
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3>Pengaduan per Minggu</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <Bar dataKey="jumlah" fill="#2E7D32" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
