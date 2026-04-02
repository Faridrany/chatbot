import { Bell, User } from 'lucide-react';
import { Badge } from './ui/badge';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">Dashboard Klasifikasi Pengaduan Warga Samboja</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem berbasis Machine Learning Random Forest</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification */}
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="w-6 h-6 text-gray-600" />
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 text-xs rounded-full border-2 border-white">
              5
            </Badge>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm text-gray-900">Admin Samboja</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] rounded-xl flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
