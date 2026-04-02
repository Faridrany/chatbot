import { useEffect, useState } from "react";
import { RefreshCw, MessageSquare, Check } from "lucide-react";
import { Button } from "./ui/button";

export default function QRCode({ onConnect }) {
  const [qr, setQr] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQR = async () => {
    try {
      const res = await fetch("http://localhost:3001/qr");
      const data = await res.json();

      if (data.qr) {
        setQr(data.qr);
      } else {
        setQr(null); // sudah connect
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQR();
    const interval = setInterval(fetchQR, 5000); // refresh tiap 5 detik
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchQR();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-10 rounded-xl shadow-lg">
        <h1 className="text-xl mb-4">Scan QR WhatsApp</h1>

        <div className="w-64 h-64 flex items-center justify-center border">
          {qr ? <img src={qr} alt="QR Code" /> : <p className="text-green-600">✅ Sudah terhubung</p>}
        </div>

        <div className="flex gap-4 mt-4">
          <Button onClick={handleRefresh}>
            <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </Button>

          <Button onClick={onConnect}>
            <Check /> Connected
          </Button>
        </div>
      </div>
    </div>
  );
}
