import { useEffect, useState, useRef } from "react";
import { RefreshCw, Wifi, Loader2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

// status: "offline" | "initializing" | "scan" | "connected"

export default function QRCode({ onConnect }) {
  const [qr, setQr]         = useState(null);
  const [status, setStatus] = useState("initializing");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef(null);

  const fetchQR = async () => {
    try {
      const res  = await fetch("/qr");

      // Kalau chatbot belum jalan, response bukan JSON valid
      if (!res.ok) {
        setStatus("offline");
        return;
      }

      const data = await res.json();

      if (data.status === "connected") {
        setStatus("connected");
        setQr(null);
        // TIDAK auto-redirect — user harus klik tombol sendiri
      } else if (data.status === "scan" && data.qr) {
        setStatus("scan");
        setQr(data.qr);
      } else if (data.status === "initializing") {
        setStatus("initializing");
        setQr(null);
      } else {
        // Response tidak dikenal (misal dari backend lain yang salah proxy)
        setStatus("offline");
        setQr(null);
      }
    } catch {
      // Chatbot server belum jalan
      setStatus("offline");
      setQr(null);
    }
  };

  useEffect(() => {
    fetchQR();
    intervalRef.current = setInterval(fetchQR, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchQR();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const statusConfig = {
    connected:    { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500",              label: "WhatsApp Terhubung"   },
    scan:         { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500 animate-pulse", label: "Menunggu Scan QR"     },
    initializing: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500 animate-pulse",label: "Menginisialisasi..."  },
    offline:      { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500",                label: "Chatbot Tidak Aktif"  },
  };
  const sc = statusConfig[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-96 text-center">

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <MessageSquareIcon className="w-6 h-6 text-green-700" />
          <h1 className="text-xl font-bold text-gray-800">Hubungkan WhatsApp</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Scan QR Code dengan WhatsApp di HP kamu
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
              <p className="text-xs text-gray-400">Jalankan <code className="bg-gray-100 px-1 rounded">npm run dev</code> di root</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-green-500" />
              <p className="text-sm">Menunggu QR Code...</p>
              <p className="text-xs text-gray-300">WhatsApp client sedang inisialisasi</p>
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

        {/* Tombol */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {status === "connected" && (
            <Button
              onClick={onConnect}
              className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
            >
              <Wifi className="w-4 h-4" />
              Lanjut ke Dashboard
            </Button>
          )}
        </div>
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
