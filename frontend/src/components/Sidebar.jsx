import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart3, Download, Settings, LogOut, Users } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Data Pengaduan', path: '/data-pengaduan' },
    { icon: BarChart3, label: 'Statistik', path: '/statistik' },
    { icon: Download, label: 'Export Data', path: '/export' },
    { icon: Settings, label: 'Pengaturan', path: '/pengaturan' },
  ];

  return (
    <div className="w-64 bg-[#2E7D32] min-h-screen flex flex-col shadow-xl">
      {/* Logo Header */}
      <div className="p-6 border-b border-green-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-[#2E7D32]" />
          </div>
          <div>
            <h2 className="text-white">Samboja</h2>
            <p className="text-xs text-green-200">Sistem Pengaduan</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-[#2E7D32] shadow-lg'
                      : 'text-green-100 hover:bg-green-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
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
