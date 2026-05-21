import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Wifi, Loader2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

// status: "idle" | "loading" | "scan" | "connected" | "offline"

export default function QRCode({ onConnect }) {
  const navigate        = useNavigate();
  const [qr, setQr]     = useState(null);
  const [status, setStatus] = useState("idle");

  // Fetch QR sekali — hanya saat user klik tombol
  const fetchQR = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/qr");
      if (!res.ok) { setStatus("offline"); return; }

      const data = await res.json();

      if (data.status === "connected") {
        setStatus("connected");
        setQr(null);
      } else if (data.status === "scan" && data.qr) {
        setStatus("scan");
        setQr(data.qr);
      } else if (data.status === "initializing") {
        setStatus("initializing");
        setQr(null);
      } else {
        setStatus("offline");
        setQr(null);
      }
    } catch {
      setStatus("offline");
      setQr(null);
    }
  };

  const handleSkip = () => navigate("/dashboard");

  const handleConnect = () => {
    onConnect();
    navigate("/dashboard");
  };

  const statusConfig = {
    idle:         { bg: "bg-gray-100",   text: "text-gray-500",   dot: "bg-gray-400",                label: "Belum dimuat"         },
    loading:      { bg: "bg-blue-100",   text: "text-blue-600",   dot: "bg-blue-400 animate-pulse",  label: "Memuat..."            },
    scan:         { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500",                label: "Menunggu Scan QR"     },
    connected:    { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500",               label: "WhatsApp Terhubung"   },
    initializing: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500 animate-pulse", label: "Bot sedang inisialisasi..." },
    offline:      { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500",                 label: "Chatbot Tidak Aktif"  },
  };
  const sc = statusConfig[status] ?? statusConfig.idle;

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-96 text-center">

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <MessageSquareIcon className="w-6 h-6 text-green-700" />
          <h1 className="text-xl font-bold text-gray-800">Hubungkan WhatsApp</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Opsional — scan QR untuk menghubungkan bot WhatsApp.
        </p>

        {/* QR Area */}
        <div className="w-64 h-64 mx-auto flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 mb-6">
          {status === "scan" && qr ? (
            <img src={qr} alt="QR Code WhatsApp" className="w-full h-full object-contain rounded-xl" />
          ) : status === "connected" ? (
            <div className="flex flex-col items-center gap-2 text-green-600">
              <Wifi className="w-12 h-12" />
              <p className="font-semibold">Terhubung!</p>
            </div>
          ) : status === "offline" ? (
            <div className="flex flex-col items-center gap-3 text-red-400">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm font-medium">Chatbot tidak aktif</p>
              <p className="text-xs text-gray-400">Pastikan chatbot sudah dijalankan</p>
            </div>
          ) : status === "loading" || status === "initializing" ? (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-green-500" />
              <p className="text-sm">
                {status === "initializing" ? "Bot sedang inisialisasi..." : "Memuat QR..."}
              </p>
            </div>
          ) : (
            // idle — belum ada aksi
            <div className="flex flex-col items-center gap-3 text-gray-300">
              <MessageSquareIcon className="w-12 h-12" />
              <p className="text-sm text-gray-400">Klik "Muat QR" untuk memulai</p>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6 ${sc.bg} ${sc.text}`}>
          <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
          {sc.label}
        </div>

        {/* Panduan scan */}
        {status === "scan" && (
          <ol className="text-xs text-gray-500 text-left space-y-1 mb-6 bg-gray-50 p-3 rounded-lg">
            <li>1. Buka WhatsApp di HP</li>
            <li>2. Ketuk <strong>Perangkat Tertaut</strong></li>
            <li>3. Ketuk <strong>Tautkan Perangkat</strong></li>
            <li>4. Arahkan kamera ke QR di atas</li>
          </ol>
        )}

        {/* Tombol utama */}
        <div className="flex gap-3 justify-center mb-4">
          {/* Muat / Refresh QR — manual, tidak ada polling */}
          {status !== "connected" && (
            <Button
              variant="outline"
              onClick={fetchQR}
              disabled={status === "loading"}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${status === "loading" ? "animate-spin" : ""}`} />
              {status === "idle" ? "Muat QR" : "Muat Ulang"}
            </Button>
          )}

          {/* Masuk setelah scan berhasil */}
          {status === "connected" && (
            <Button
              onClick={handleConnect}
              className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
            >
              <Wifi className="w-4 h-4" />
              Masuk Dashboard
            </Button>
          )}
        </div>

        {/* Tombol skip — selalu tersedia */}
        <button
          onClick={handleSkip}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          Lewati, masuk dashboard tanpa menghubungkan WhatsApp
        </button>

      </div>
    </div>
  );
}

function MessageSquareIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
