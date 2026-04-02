import Sidebar from './Sidebar';
import Header from './Header';
import { FileText, Clock, Calendar, PieChart as PieChartIcon, TrendingUp, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  onLogout: () => void;
}

// Mock data
const categoryData = [
  { name: 'Infrastruktur', value: 45, color: '#2E7D32' },
  { name: 'Lingkungan', value: 30, color: '#4CAF50' },
  { name: 'Keamanan', value: 15, color: '#A5D6A7' },
  { name: 'Pelayanan', value: 10, color: '#81C784' },
];

const weeklyData = [
  { week: 'Minggu 1', jumlah: 25 },
  { week: 'Minggu 2', jumlah: 35 },
  { week: 'Minggu 3', jumlah: 28 },
  { week: 'Minggu 4', jumlah: 42 },
];

export default function Dashboard({ onLogout }: DashboardProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header />
        
        <main className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Pengaduan */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Pengaduan</p>
                  <h3 className="text-3xl text-gray-900">130</h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600">+12%</span>
                <span className="text-gray-500">dari bulan lalu</span>
              </div>
            </div>

            {/* Pengaduan 3 Hari Terakhir */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Baru 3 Hari</p>
                  <h3 className="text-3xl text-gray-900">24</h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#4CAF50] to-[#66BB6A] rounded-xl flex items-center justify-center shadow-md">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-gray-500">Perlu tindak lanjut</span>
              </div>
            </div>

            {/* Pengaduan 7 Hari Terakhir */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Baru 7 Hari</p>
                  <h3 className="text-3xl text-gray-900">42</h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#66BB6A] to-[#81C784] rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600">+8%</span>
                <span className="text-gray-500">minggu ini</span>
              </div>
            </div>

            {/* Distribusi Kategori */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Kategori Terbanyak</p>
                  <h3 className="text-xl text-gray-900">Infrastruktur</h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#81C784] to-[#A5D6A7] rounded-xl flex items-center justify-center shadow-md">
                  <PieChartIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#2E7D32]">45%</span>
                <span className="text-gray-500">dari total pengaduan</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart - Distribusi Kategori */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-gray-900 mb-6">Distribusi Kategori Pengaduan</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart - Jumlah Pengaduan per Minggu */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-gray-900 mb-6">Jumlah Pengaduan per Minggu</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="week" stroke="#616161" />
                  <YAxis stroke="#616161" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="jumlah" fill="#2E7D32" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-gray-900 mb-6">Aktivitas Terbaru</h3>
            <div className="space-y-4">
              {[
                { time: '2 menit lalu', text: 'Pengaduan baru diterima: Jalan rusak di Desa Samboja Kuala', category: 'Infrastruktur', status: 'Baru' },
                { time: '15 menit lalu', text: 'Pengaduan diproses: Sampah menumpuk di pasar tradisional', category: 'Lingkungan', status: 'Diproses' },
                { time: '1 jam lalu', text: 'Pengaduan diselesaikan: Lampu jalan mati di Jl. Veteran', category: 'Infrastruktur', status: 'Selesai' },
                { time: '2 jam lalu', text: 'Pengaduan baru diterima: Kebisingan dari pabrik', category: 'Keamanan', status: 'Baru' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-2 h-2 bg-[#4CAF50] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.text}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">{activity.time}</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-[#2E7D32] rounded-lg">{activity.category}</span>
                      <span className={`text-xs px-2 py-1 rounded-lg ${
                        activity.status === 'Baru' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'Diproses' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{activity.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
