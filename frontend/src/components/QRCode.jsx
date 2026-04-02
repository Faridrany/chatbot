import { useState } from "react";
import { RefreshCw, MessageSquare, Check } from "lucide-react";
import { Button } from "./ui/button";

export default function QRCode({ onConnect }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-green-50 to-green-100">
      <div className="w-full max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-2xl p-12 border border-green-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-linear-to-br from-[#2E7D32] to-[#4CAF50] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl text-gray-900 mb-3">Hubungkan WhatsApp Chatbot</h1>
            <p className="text-gray-600 max-w-md mx-auto">
              Scan QR Code di bawah ini dengan WhatsApp untuk mengaktifkan bot pengaduan warga otomatis
            </p>
          </div>

          {/* QR Code Container */}
          <div className="bg-linear-to-br from-green-50 to-white rounded-2xl p-8 mb-8 border-2 border-dashed border-[#A5D6A7]">
            <div className="w-64 h-64 mx-auto bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-200">
              {/* Mock QR Code Pattern */}
              <div className="grid grid-cols-8 gap-1 p-4">
                {[...Array(64)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${Math.random() > 0.5 ? "bg-gray-900" : "bg-white"}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-green-50 rounded-xl p-6 mb-8 border border-green-200">
            <h3 className="text-gray-900 mb-3">Cara Menghubungkan:</h3>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 bg-[#2E7D32] text-white rounded-full flex items-center justify-center text-sm">
                  1
                </span>
                <span>Buka aplikasi WhatsApp di ponsel Anda</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 bg-[#2E7D32] text-white rounded-full flex items-center justify-center text-sm">
                  2
                </span>
                <span>Pilih menu "Perangkat Tertaut" atau "Linked Devices"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 bg-[#2E7D32] text-white rounded-full flex items-center justify-center text-sm">
                  3
                </span>
                <span>Scan QR Code yang ditampilkan di atas</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 bg-[#2E7D32] text-white rounded-full flex items-center justify-center text-sm">
                  4
                </span>
                <span>Tunggu hingga proses koneksi selesai</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl shadow-sm"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh QR Code
            </Button>

            <Button
              onClick={onConnect}
              className="flex-1 h-12 bg-[#4CAF50] hover:bg-[#2E7D32] text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Check className="w-5 h-5 mr-2" />
              Sudah Terhubung
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>QR Code akan diperbarui secara otomatis setiap 60 detik</p>
          </div>
        </div>
      </div>
    </div>
  );
}
