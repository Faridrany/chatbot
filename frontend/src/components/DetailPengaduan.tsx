import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { ArrowLeft, User, Calendar, Tag, BarChart2, FileText, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface DetailPengaduanProps {
  onLogout: () => void;
}

// Mock detail data
const mockDetailData: { [key: string]: any } = {
  '1': {
    id: 1,
    tanggal: '2024-11-23 14:30',
    pengirim: 'Budi Santoso',
    telepon: '0812-3456-7890',
    alamat: 'Jl. Raya Samboja No. 45, Samboja Kuala',
    deskripsi: 'Jalan berlubang di Jl. Raya Samboja yang menyebabkan kemacetan dan berbahaya bagi pengendara. Lubang berdiameter sekitar 2 meter dengan kedalaman 30cm. Sudah terjadi beberapa kecelakaan minor karena pengendara menghindari lubang tersebut. Mohon segera diperbaiki karena jalur ini merupakan akses utama menuju pasar dan sekolah.',
    kategori: 'Infrastruktur',
    status: 'Baru',
    confidence: 92.5,
    mlDetails: {
      model: 'Random Forest Classifier',
      features: ['jalan', 'lubang', 'berbahaya', 'kecelakaan', 'diperbaiki'],
      predictions: [
        { kategori: 'Infrastruktur', confidence: 92.5 },
        { kategori: 'Lingkungan', confidence: 5.2 },
        { kategori: 'Keamanan', confidence: 2.1 },
        { kategori: 'Pelayanan', confidence: 0.2 },
      ]
    },
    catatan: '',
    lampiran: ['foto-jalan-rusak-1.jpg', 'foto-jalan-rusak-2.jpg']
  },
  '2': {
    id: 2,
    tanggal: '2024-11-22 09:15',
    pengirim: 'Siti Aminah',
    telepon: '0813-9876-5432',
    alamat: 'Pasar Samboja Blok C No. 12',
    deskripsi: 'Sampah menumpuk di pasar tradisional Samboja sudah 3 hari tidak diangkut. Bau tidak sedap mulai tercium dan mengganggu aktivitas pedagang. Khawatir akan menimbulkan masalah kesehatan dan menurunkan kenyamanan pembeli.',
    kategori: 'Lingkungan',
    status: 'Diproses',
    confidence: 88.3,
    mlDetails: {
      model: 'Random Forest Classifier',
      features: ['sampah', 'menumpuk', 'bau', 'kesehatan', 'diangkut'],
      predictions: [
        { kategori: 'Lingkungan', confidence: 88.3 },
        { kategori: 'Infrastruktur', confidence: 7.5 },
        { kategori: 'Pelayanan', confidence: 3.8 },
        { kategori: 'Keamanan', confidence: 0.4 },
      ]
    },
    catatan: 'Sudah diteruskan ke Dinas Kebersihan',
    lampiran: ['sampah-pasar.jpg']
  }
};

export default function DetailPengaduan({ onLogout }: DetailPengaduanProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = mockDetailData[id || '1'] || mockDetailData['1'];
  
  const [status, setStatus] = useState(data.status);
  const [catatan, setCatatan] = useState(data.catatan);

  const getCategoryColor = (kategori: string) => {
    switch (kategori) {
      case 'Infrastruktur': return 'bg-[#2E7D32] text-white';
      case 'Lingkungan': return 'bg-[#4CAF50] text-white';
      case 'Keamanan': return 'bg-[#A5D6A7] text-gray-900';
      case 'Pelayanan': return 'bg-[#81C784] text-white';
      default: return 'bg-gray-200 text-gray-900';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSave = () => {
    alert('Data berhasil disimpan!');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header />
        
        <main className="p-8">
          {/* Back Button */}
          <Button
            onClick={() => navigate('/data-pengaduan')}
            variant="outline"
            className="mb-6 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Data Pengaduan
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl text-gray-900 mb-2">Detail Pengaduan #{data.id}</h1>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getCategoryColor(data.kategori)} px-3 py-1`}>
                        {data.kategori}
                      </Badge>
                      <Badge className={status === 'Baru' ? 'bg-blue-100 text-blue-700' : status === 'Diproses' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}>
                        {status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      {data.tanggal}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informasi Pengirim */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#2E7D32]" />
                  Informasi Pengirim
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Nama Lengkap</p>
                    <p className="text-gray-900">{data.pengirim}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Nomor Telepon</p>
                    <p className="text-gray-900">{data.telepon}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Alamat</p>
                    <p className="text-gray-900">{data.alamat}</p>
                  </div>
                </div>
              </div>

              {/* Deskripsi Pengaduan */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#2E7D32]" />
                  Deskripsi Pengaduan
                </h3>
                <p className="text-gray-700 leading-relaxed">{data.deskripsi}</p>
              </div>

              {/* Lampiran */}
              {data.lampiran && data.lampiran.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#2E7D32]" />
                    Lampiran
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {data.lampiran.map((file: string, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="w-full h-40 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-700 truncate">{file}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan & Status Update */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-gray-900 mb-4">Update Status & Catatan</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Ubah Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baru">Baru</SelectItem>
                        <SelectItem value="Diproses">Diproses</SelectItem>
                        <SelectItem value="Selesai">Selesai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Catatan Tindak Lanjut</label>
                    <Textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Tambahkan catatan tindak lanjut..."
                      className="min-h-32 border-gray-200 rounded-xl"
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    className="w-full h-12 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar - ML Analysis */}
            <div className="space-y-6">
              {/* ML Classification Result */}
              <div className="bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] rounded-2xl shadow-lg p-6 text-white">
                <h3 className="mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5" />
                  Hasil Klasifikasi ML
                </h3>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <p className="text-sm text-green-100 mb-2">Model</p>
                  <p className="text-white">{data.mlDetails.model}</p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <p className="text-sm text-green-100 mb-2">Kategori Prediksi</p>
                  <p className="text-2xl text-white mb-2">{data.kategori}</p>
                  <p className={`text-xl ${getConfidenceColor(data.confidence)} bg-white px-3 py-1 rounded-lg inline-block`}>
                    {data.confidence}% Confidence
                  </p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-sm text-green-100 mb-3">Kata Kunci Terdeteksi</p>
                  <div className="flex flex-wrap gap-2">
                    {data.mlDetails.features.map((feature: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-white/30 rounded-lg text-sm text-white">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* All Predictions */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#2E7D32]" />
                  Semua Prediksi
                </h3>
                
                <div className="space-y-3">
                  {data.mlDetails.predictions.map((pred: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{pred.kategori}</span>
                        <span className="text-sm text-gray-900">{pred.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] h-2 rounded-full transition-all"
                          style={{ width: `${pred.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                <h4 className="text-blue-900 mb-2">Informasi</h4>
                <p className="text-sm text-blue-700">
                  Hasil klasifikasi menggunakan algoritma Random Forest dengan akurasi model 94.3%. Sistem menganalisis kata kunci dan konteks untuk menentukan kategori pengaduan.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
