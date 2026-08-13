import { useEffect, useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Brain, CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const LIMIT = 10;

const CATEGORIES = [
  { value: "INFRASTRUKTUR", label: "Infrastruktur", color: "bg-[#2E7D32] text-white" },
  { value: "LINGKUNGAN", label: "Lingkungan", color: "bg-[#4CAF50] text-white" },
  { value: "KEAMANAN", label: "Keamanan", color: "bg-[#A5D6A7] text-gray-900" },
  { value: "PELAYANAN", label: "Pelayanan", color: "bg-[#81C784] text-white" }
];

export default function KlasifikasiPengaduan({ onLogout }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Classification state
  const [classifyingId, setClassifyingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [confidence, setConfidence] = useState("85");

  const fetchData = useCallback((page, search) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: LIMIT.toString(),
      ...(search && { search }),
    });

    fetch(`/api/pending-complaints?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleClassify = async (complaintId) => {
    if (!selectedCategory || !confidence) {
      alert('Pilih kategori dan masukkan confidence score!');
      return;
    }

    setClassifyingId(complaintId);
    
    try {
      const response = await fetch('/api/classify-complaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaintId: complaintId,
          kategori: selectedCategory,
          confidence: parseFloat(confidence)
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Pengaduan berhasil diklasifikasi dan akan muncul di halaman Data Pengaduan!');
        fetchData(currentPage, searchTerm); // Refresh data
        setSelectedCategory("");
        setConfidence("85");
      } else {
        alert('Gagal mengklasifikasi: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setClassifyingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Klasifikasi Pengaduan Baru</h1>
              <p className="text-sm text-gray-500 mt-1">
                Klasifikasi pengaduan yang masuk dari ChatBot WhatsApp sebelum masuk ke Data Pengaduan
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-400">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500">Menunggu Klasifikasi</p>
                  <p className="text-2xl font-bold text-gray-800">{total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-400">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Model Akurasi</p>
                  <p className="text-2xl font-bold text-gray-800">92.5%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-400">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Terklasifikasi Hari Ini</p>
                  <p className="text-2xl font-bold text-gray-800">0</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-400">
              <div>
                <p className="text-sm text-gray-500">Rata-rata Confidence</p>
                <p className="text-2xl font-bold text-gray-800">87.3%</p>
              </div>
            </div>
          </div>
          {/* Classification Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Panel Klasifikasi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori Klasifikasi
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Score (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  placeholder="85.0"
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  disabled={!selectedCategory || !confidence}
                  className="w-full"
                  variant="outline"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Siap Klasifikasi
                </Button>
              </div>
            </div>
            
            {selectedCategory && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Akan mengklasifikasi sebagai:</strong> {CATEGORIES.find(c => c.value === selectedCategory)?.label} 
                  dengan confidence {confidence}%
                </p>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cari berdasarkan nama atau deskripsi pengaduan..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button variant="outline" className="px-4">
                <Search className="w-4 h-4 mr-2" />
                Cari
              </Button>
            </div>
          </div>

          {/* Complaints Table */}
          <div className="bg-white rounded-xl shadow-lg border-t-4 border-t-blue-500">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Pengaduan Baru dari WhatsApp Bot</h2>
                  <p className="text-xs text-gray-500">Data pengaduan yang belum terklasifikasi, setelah diklasifikasi akan masuk ke halaman Data Pengaduan</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Memuat data pengaduan...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Tidak ada pengaduan menunggu klasifikasi</p>
                  <p className="text-sm text-gray-400">Semua pengaduan sudah terklasifikasi</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-50 text-blue-900">
                        <tr>
                          <th className="p-4 text-left font-semibold w-8">#</th>
                          <th className="p-4 text-left font-semibold">Kode</th>
                          <th className="p-4 text-left font-semibold">Pengadu</th>
                          <th className="p-4 text-left font-semibold">Deskripsi Pengaduan</th>
                          <th className="p-4 text-left font-semibold">Waktu</th>
                          <th className="p-4 text-left font-semibold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={item._id} className="border-t hover:bg-gray-50 transition-colors">
                            <td className="p-4 text-gray-500">{(currentPage - 1) * LIMIT + idx + 1}</td>
                            <td className="p-4">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {item.kode_pengaduan}
                              </span>
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-gray-900">{item.nama}</p>
                                <p className="text-xs text-gray-500">{item.no_wa}</p>
                              </div>
                            </td>
                            <td className="p-4 max-w-md">
                              <p className="text-gray-700 line-clamp-3" title={item.deskripsi}>
                                {item.deskripsi}
                              </p>
                            </td>
                            <td className="p-4">
                              <span className="text-xs text-gray-500">
                                {new Date(item.timestamp).toLocaleString('id-ID')}
                              </span>
                            </td>
                            <td className="p-4">
                              <Button
                                onClick={() => handleClassify(item._id)}
                                disabled={!selectedCategory || !confidence || classifyingId === item._id}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {classifyingId === item._id ? (
                                  <>
                                    <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                    Memproses...
                                  </>
                                ) : (
                                  <>
                                    <Brain className="w-3 h-3 mr-1" />
                                    Klasifikasi
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-500">
                        Menampilkan {(currentPage - 1) * LIMIT + 1} - {Math.min(currentPage * LIMIT, total)} dari {total} pengaduan
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Sebelumnya
                        </Button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Selanjutnya
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}