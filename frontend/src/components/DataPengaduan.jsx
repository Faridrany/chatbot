import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Search, Filter, Eye } from 'lucide-react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface DataPengaduanProps {
  onLogout: () => void;
}

// Mock data pengaduan
const mockPengaduan = [
  {
    id: 1,
    tanggal: '2024-11-23',
    pengirim: 'Budi Santoso',
    deskripsi: 'Jalan berlubang di Jl. Raya Samboja yang menyebabkan kemacetan dan berbahaya bagi pengendara',
    kategori: 'Infrastruktur',
    status: 'Baru',
    confidence: 92.5,
    daysAgo: 0
  },
  {
    id: 2,
    tanggal: '2024-11-22',
    pengirim: 'Siti Aminah',
    deskripsi: 'Sampah menumpuk di pasar tradisional Samboja sudah 3 hari tidak diangkut',
    kategori: 'Lingkungan',
    status: 'Diproses',
    confidence: 88.3,
    daysAgo: 1
  },
  {
    id: 3,
    tanggal: '2024-11-21',
    pengirim: 'Ahmad Rifai',
    deskripsi: 'Lampu jalan mati di Jl. Veteran sejak minggu lalu, membuat area gelap dan rawan kejahatan',
    kategori: 'Infrastruktur',
    status: 'Baru',
    confidence: 95.8,
    daysAgo: 2
  },
  {
    id: 4,
    tanggal: '2024-11-20',
    pengirim: 'Dewi Kartika',
    deskripsi: 'Kebisingan dari pabrik di malam hari mengganggu warga sekitar',
    kategori: 'Keamanan',
    status: 'Selesai',
    confidence: 87.2,
    daysAgo: 3
  },
  {
    id: 5,
    tanggal: '2024-11-19',
    pengirim: 'Bambang Wijaya',
    deskripsi: 'Pelayanan administrasi di kantor kelurahan sangat lambat dan berbelit-belit',
    kategori: 'Pelayanan',
    status: 'Baru',
    confidence: 90.1,
    daysAgo: 4
  },
  {
    id: 6,
    tanggal: '2024-11-18',
    pengirim: 'Rina Susanti',
    deskripsi: 'Gorong-gorong tersumbat menyebabkan banjir saat hujan di perumahan',
    kategori: 'Infrastruktur',
    status: 'Diproses',
    confidence: 93.7,
    daysAgo: 5
  },
  {
    id: 7,
    tanggal: '2024-11-17',
    pengirim: 'Eko Prasetyo',
    deskripsi: 'Taman kota kotor dan tidak terawat, banyak sampah berserakan',
    kategori: 'Lingkungan',
    status: 'Baru',
    confidence: 89.4,
    daysAgo: 6
  },
  {
    id: 8,
    tanggal: '2024-11-16',
    pengirim: 'Lina Marlina',
    deskripsi: 'Pencurian motor di parkiran pasar, perlu penambahan keamanan',
    kategori: 'Keamanan',
    status: 'Selesai',
    confidence: 91.6,
    daysAgo: 7
  },
];

export default function DataPengaduan({ onLogout }: DataPengaduanProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter data
  const filteredData = mockPengaduan.filter(item => {
    const matchSearch = item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.pengirim.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'semua' || item.kategori === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getCategoryColor = (kategori: string) => {
    switch (kategori) {
      case 'Infrastruktur': return 'bg-[#2E7D32] text-white';
      case 'Lingkungan': return 'bg-[#4CAF50] text-white';
      case 'Keamanan': return 'bg-[#A5D6A7] text-gray-900';
      case 'Pelayanan': return 'bg-[#81C784] text-white';
      default: return 'bg-gray-200 text-gray-900';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Baru': return 'bg-blue-100 text-blue-700';
      case 'Diproses': return 'bg-yellow-100 text-yellow-700';
      case 'Selesai': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDaysBadge = (days: number) => {
    if (days <= 3) {
      return <Badge className="bg-green-500 text-white">Baru {days}h</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-yellow-500 text-white">Dalam 7h</Badge>;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header />
        
        <main className="p-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl text-gray-900 mb-2">Data Pengaduan Warga</h2>
              <p className="text-gray-500">Kelola dan klasifikasi pengaduan menggunakan Machine Learning</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari berdasarkan deskripsi atau pengirim..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-12 border-gray-200 rounded-xl"
                />
              </div>

              {/* Category Filter */}
              <div className="w-full md:w-64">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                    <Filter className="w-5 h-5 mr-2" />
                    <SelectValue placeholder="Filter Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua Kategori</SelectItem>
                    <SelectItem value="Infrastruktur">Infrastruktur</SelectItem>
                    <SelectItem value="Lingkungan">Lingkungan</SelectItem>
                    <SelectItem value="Keamanan">Keamanan</SelectItem>
                    <SelectItem value="Pelayanan">Pelayanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead className="bg-[#A5D6A7]">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-900">Tanggal</th>
                    <th className="px-6 py-4 text-left text-gray-900">Nama Pengirim</th>
                    <th className="px-6 py-4 text-left text-gray-900">Deskripsi Pengaduan</th>
                    <th className="px-6 py-4 text-left text-gray-900">Kategori ML</th>
                    <th className="px-6 py-4 text-left text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-gray-900">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedData.map((item, index) => (
                    <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-900">{item.tanggal}</span>
                          {getDaysBadge(item.daysAgo)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{item.pengirim}</td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 line-clamp-2">{item.deskripsi}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getCategoryColor(item.kategori)} px-3 py-1`}>
                          {item.kategori}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{item.confidence}% confidence</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getStatusColor(item.status)} px-3 py-1`}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => navigate(`/detail-pengaduan/${item.id}`)}
                          size="sm"
                          className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-lg"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} data
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="rounded-lg"
                >
                  Sebelumnya
                </Button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      className={`w-10 h-10 rounded-lg ${currentPage === i + 1 ? 'bg-[#2E7D32] hover:bg-[#1B5E20]' : ''}`}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="rounded-lg"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
