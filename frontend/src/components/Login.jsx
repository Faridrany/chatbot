import { useState } from "react";
import { Users, Mail, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-green-50 to-green-100">
      <div className="w-full max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side */}
        <div className="hidden lg:flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-linear-to-br from-[#2E7D32] to-[#4CAF50] rounded-3xl p-12 shadow-2xl">
              <Users className="w-32 h-32 text-white mx-auto mb-6" strokeWidth={1.5} />
              <div className="text-white text-center space-y-4">
                <h2 className="text-3xl">Sistem Pengaduan Warga</h2>
                <p className="text-green-50">
                  Platform digital untuk mengelola dan mengklasifikasikan laporan masyarakat Samboja dengan teknologi Machine
                  Learning
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-linear-to-br from-[#2E7D32] to-[#4CAF50] rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">Kecamatan Samboja</h1>
                <p className="text-sm text-gray-500">Sistem Klasifikasi Pengaduan</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl text-gray-900 mb-2">Masuk ke Dashboard</h2>
              <p className="text-gray-500">Masuk untuk mengelola laporan warga</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@samboja.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 border-gray-200 focus:border-[#2E7D32] focus:ring-[#2E7D32] rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12 border-gray-200 focus:border-[#2E7D32] focus:ring-[#2E7D32] rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Masuk
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Sistem berbasis Machine Learning Random Forest</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>© 2024 Kecamatan Samboja. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
