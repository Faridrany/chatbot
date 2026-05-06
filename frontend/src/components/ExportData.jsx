import Sidebar from "./Sidebar";
import Header from "./Header";

export default function ExportData({ onLogout }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1">
        <Header />
        <main className="p-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Export Data</h2>
          <p className="text-gray-500">Halaman export data akan segera tersedia.</p>
        </main>
      </div>
    </div>
  );
}
