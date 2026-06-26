import { useEffect, useState } from "react";
import { RefreshCw, AlertCircle, ChevronUp, ArrowRight } from "lucide-react";

// Kamus normalisasi — sama dengan backend
const NORM_DICT = {
  gk: "tidak", nggak: "tidak", tdk: "tidak",
  rt: "rukun tetangga", rw: "rukun warga",
  pju: "penerangan jalan umum",
};

// Warna per step
const STEP_STYLE = [
  { bg: "#FFF5F5", border: "#E53935", badge: "#E53935", label: "Step 1 — Cleaning" },
  { bg: "#FFF8F0", border: "#FB8C00", badge: "#FB8C00", label: "Step 2 — Case Folding" },
  { bg: "#FFFDE7", border: "#FDD835", badge: "#F9A825", label: "Step 3 — Tokenizing" },
  { bg: "#F1F8E9", border: "#43A047", badge: "#2E7D32", label: "Step 4 — Normalization" },
  { bg: "#E3F2FD", border: "#1E88E5", badge: "#1565C0", label: "Step 5 — Stopword Removal" },
  { bg: "#F3E5F5", border: "#8E24AA", badge: "#6A1B9A", label: "Step 6 — Stemming" },
];

// ── Helper: diff karakter yang hilang saat cleaning ───────────────────────────
function buildCleaningDiff(original, cleaned) {
  // Tampilkan teks asli dengan karakter "terbuang" diberi highlight merah
  // Strategi: bandingkan karakter per karakter
  const result = [];
  let ci = 0; // pointer ke cleaned
  for (let oi = 0; oi < original.length; oi++) {
    const ch = original[oi];
    if (ci < cleaned.length && ch.toLowerCase() === cleaned[ci]?.toLowerCase()) {
      result.push({ ch, kept: true });
      ci++;
    } else if (cleaned[ci] && ch === " " && cleaned[ci] !== " ") {
      // spasi yang dipadatkan — skip
      result.push({ ch: " ", kept: false });
    } else {
      result.push({ ch, kept: false });
    }
  }
  return result;
}

// ── Token badge ───────────────────────────────────────────────────────────────
function TokenBadge({ word, state }) {
  // state: "normal" | "changed" (normalisasi) | "removed" (stopword)
  if (state === "removed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono border mx-0.5 my-0.5 line-through opacity-40 bg-red-50 border-red-200 text-red-600">
        {word}
      </span>
    );
  }
  if (state === "changed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono border mx-0.5 my-0.5 bg-yellow-100 border-yellow-400 text-yellow-800">
        {word}
        <span className="text-[9px] bg-green-600 text-white rounded px-0.5">✓</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono border mx-0.5 my-0.5 bg-white border-gray-300 text-gray-700">
      {word}
    </span>
  );
}

// ── Step Card ─────────────────────────────────────────────────────────────────
function StepCard({ stepIdx, children, extra }) {
  const s = STEP_STYLE[stepIdx];
  return (
    <div className="rounded-xl border-l-4 p-4" style={{ borderColor: s.border, backgroundColor: s.bg }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: s.badge }}>
          {s.label}
        </span>
        {extra}
      </div>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PreprocessingDetailCard({ kode, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true); setError(null); setData(null);
    fetch(`/api/preprocessing/${kode}`)
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.error); }))
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [kode]);

  const pl = data?.pipeline ?? {};

  // Hitung token yang berubah saat normalisasi
  const normChanges = {};
  if (pl.tokenized && pl.normalized) {
    pl.tokenized.forEach((tok, i) => {
      if (pl.normalized[i] && tok !== pl.normalized[i]) {
        normChanges[i] = { from: tok, to: pl.normalized[i] };
      }
    });
  }

  // Token yang dihapus saat stopword removal
  const stopRemovedSet = new Set(pl.stop_removed ?? []);
  const normalizedSet  = new Set(pl.normalized ?? []);

  // Token yang berubah saat stemming
  const stemChanges = {};
  if (pl.stop_removed && pl.stemmed) {
    pl.stop_removed.forEach((tok, i) => {
      if (pl.stemmed[i] && tok !== pl.stemmed[i]) {
        stemChanges[i] = { from: tok, to: pl.stemmed[i] };
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-green-700 text-white">
        <div>
          <p className="font-bold text-lg">Detail Preprocessing — {kode}</p>
          {data && <p className="text-xs text-green-200 mt-0.5">{data.nama} · {data.kategori_prediksi}</p>}
        </div>
        <button onClick={onClose} className="hover:bg-green-600 rounded-lg p-2 transition-colors">
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />Memuat data pipeline...
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Gagal memuat</p>
              <p className="text-xs mt-0.5">{error}</p>
              <p className="text-xs mt-1 text-red-500">Pastikan sudah menjalankan <code>python main.py --train</code> agar file pipeline tersedia.</p>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Teks Asli */}
            <div className="p-4 bg-gray-50 border rounded-xl">
              <p className="text-xs font-semibold text-gray-500 mb-2">Teks Asli (Input User)</p>
              <p className="text-sm text-gray-800 leading-relaxed">{data.deskripsi}</p>
            </div>

            {/* Connector */}
            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-gray-300 rotate-90" />
            </div>

            {/* Step 1: Cleaning */}
            <StepCard stepIdx={0} extra={
              <span className="text-xs text-gray-500">Hapus URL, simbol, angka, spasi berlebih</span>
            }>
              {pl.cleaned != null ? (
                <>
                  <div className="text-xs font-mono leading-relaxed bg-white rounded-lg p-3 border border-red-100">
                    {buildCleaningDiff(data.deskripsi, pl.cleaned).map((d, i) =>
                      d.kept ? (
                        <span key={i}>{d.ch}</span>
                      ) : (
                        <span key={i} className="bg-red-200 text-red-700 line-through rounded px-0.5">{d.ch === " " ? "·" : d.ch}</span>
                      )
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Hasil: <span className="font-mono text-gray-700">{pl.cleaned}</span></p>
                </>
              ) : <NoPipelineData />}
            </StepCard>

            <StepConnector />

            {/* Step 2: Case Folding */}
            <StepCard stepIdx={1} extra={<span className="text-xs text-gray-500">Semua huruf → lowercase</span>}>
              {pl.casefolded != null ? (
                <p className="font-mono text-sm text-orange-800 bg-white rounded-lg p-3 border border-orange-100 leading-relaxed">
                  {pl.casefolded}
                </p>
              ) : <NoPipelineData />}
            </StepCard>

            <StepConnector />

            {/* Step 3: Tokenizing */}
            <StepCard stepIdx={2} extra={
              pl.tokenized && <span className="text-xs text-gray-500">{pl.tokenized.length} token</span>
            }>
              {pl.tokenized?.length ? (
                <div className="flex flex-wrap">
                  {pl.tokenized.map((tok, i) => <TokenBadge key={i} word={tok} state="normal" />)}
                </div>
              ) : <NoPipelineData />}
            </StepCard>

            <StepConnector />

            {/* Step 4: Normalization */}
            <StepCard stepIdx={3} extra={
              Object.keys(normChanges).length > 0
                ? <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">{Object.keys(normChanges).length} kata dinormalisasi</span>
                : <span className="text-xs text-gray-400">Tidak ada perubahan</span>
            }>
              {pl.normalized?.length ? (
                <>
                  <div className="flex flex-wrap">
                    {pl.normalized.map((tok, i) => (
                      <TokenBadge key={i} word={tok} state={normChanges[i] ? "changed" : "normal"} />
                    ))}
                  </div>
                  {Object.keys(normChanges).length > 0 && (
                    <div className="mt-3 space-y-1">
                      {Object.entries(normChanges).map(([, v]) => (
                        <div key={v.from} className="flex items-center gap-2 text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5 w-fit">
                          <span className="font-mono text-red-600 bg-red-50 px-1.5 rounded line-through">{v.from}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="font-mono font-semibold text-green-700">{v.to}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : <NoPipelineData />}
            </StepCard>

            <StepConnector />

            {/* Step 5: Stopword Removal */}
            {(() => {
              const removed = (pl.normalized ?? []).filter((t) => !stopRemovedSet.has(t));
              return (
                <StepCard stepIdx={4} extra={
                  removed.length > 0
                    ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{removed.length} stopword dihapus</span>
                    : <span className="text-xs text-gray-400">Tidak ada yang dihapus</span>
                }>
                  {pl.normalized?.length ? (
                    <>
                      <div className="flex flex-wrap">
                        {pl.normalized.map((tok, i) => (
                          <TokenBadge key={i} word={tok}
                            state={stopRemovedSet.has(tok) ? "normal" : "removed"} />
                        ))}
                      </div>
                      {removed.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-red-100 inline-block border border-red-300" />
                          Kata dicoret = dihapus sebagai stopword
                        </p>
                      )}
                    </>
                  ) : <NoPipelineData />}
                </StepCard>
              );
            })()}

            <StepConnector />

            {/* Step 6: Stemming */}
            <StepCard stepIdx={5} extra={
              Object.keys(stemChanges).length > 0
                ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{Object.keys(stemChanges).length} kata distemming</span>
                : <span className="text-xs text-gray-400">Tidak ada perubahan</span>
            }>
              {pl.stemmed?.length ? (
                <>
                  <div className="flex flex-wrap">
                    {pl.stemmed.map((tok, i) => {
                      const fromTok = pl.stop_removed?.[i];
                      const changed = fromTok && fromTok !== tok;
                      return (
                        <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono border mx-0.5 my-0.5 ${changed ? "bg-purple-100 border-purple-400 text-purple-800" : "bg-white border-gray-300 text-gray-700"}`}>
                          {changed && <span className="text-[9px] text-purple-400 line-through">{fromTok}</span>}
                          {tok}
                        </span>
                      );
                    })}
                  </div>
                  {/* Final text */}
                  <div className="mt-3 p-3 bg-green-700 rounded-xl">
                    <p className="text-xs text-green-200 mb-1">✅ Final Text (Input ke TF-IDF)</p>
                    <p className="font-mono text-sm text-white leading-relaxed">{pl.final_text}</p>
                  </div>
                </>
              ) : <NoPipelineData />}
            </StepCard>
          </>
        )}
      </div>
    </div>
  );
}

function StepConnector() {
  return <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-gray-300 rotate-90" /></div>;
}

function NoPipelineData() {
  return (
    <p className="text-xs text-gray-400 italic">
      Data pipeline belum tersedia. Jalankan <code className="bg-gray-100 px-1 rounded">python main.py --train</code> terlebih dahulu.
    </p>
  );
}
