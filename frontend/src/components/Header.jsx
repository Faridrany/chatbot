import { User } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">Dashboard Klasifikasi Pengaduan Warga Samboja</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem berbasis Machine Learning Random Forest</p>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-900">Admin Samboja</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <div className="w-10 h-10 bg-linear-to-br from-[#2E7D32] to-[#4CAF50] rounded-xl flex items-center justify-center shadow-md">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
