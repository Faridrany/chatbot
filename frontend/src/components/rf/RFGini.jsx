import { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import {
  GitBranch, Info, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, CheckCircle2, Search,
  Layers, Leaf, BarChart3, TreeDeciduous, Download, Table2,
} from "lucide-react";

const CATS = ["INFRASTRUKTUR", "KEAMANAN", "LINGKUNGAN", "PELAYANAN"];
const CAT_COLOR = {
  INFRASTRUKTUR: { bg: "#2E7D32", light: "#E8F5E9", text: "#1B5E20" },
  KEAMANAN:      { bg: "#1976D2", light: "#E3F2FD", text: "#0D47A1" },
  LINGKUNGAN:    { bg: "#388E3C", light: "#F1F8E9", text: "#1B5E20" },
  PELAYANAN:     { bg: "#F57C00", light: "#FFF3E0", text: "#E65100" },
};

function CatBadge({ val }) {
  const c = CAT_COLOR[val] || { bg: "#757575", light: "#F5F5F5", text: "#424242" };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: c.light, color: c.text, border: `1px solid ${c.bg}30` }}>
      {val}
    </span>
  );
}

function GiniBar({ gini, maxGini = 0.75 }) {
  const pct   = Math.min(100, (gini / maxGini) * 100);
  const color = gini <= 0.05 ? "#43A047" : gini <= 0.25 ? "#8BC34A" : gini <= 0.5 ? "#FB8C00" : "#E53935";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-12 text-xs font-mono font-bold text-right" style={{ color }}>{gini.toFixed(4)}</span>
    </div>
  );
}

function FallbackNotice() {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 flex items-start gap-4">
      <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-800 mb-1">Data gini aktual belum tersedia</p>
        <p className="text-sm text-amber-700 mb-3">
          File <code className="bg-amber-100 px-1 rounded">data/stages/gini_splitting.json</code> belum ada.
        </p>
        <code className="text-xs bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg block font-mono">
          python backend/main.py --train
        </code>
      </div>
    </div>
  );
}

// ── Helper: parse nodes linear → struktur hierarki IF-ELSE ──────────────────
/**
 * Bangun peta child_kiri/child_kanan dari array nodes flat,
 * lalu rekursif susun jalur aturan IF-ELSE dari root ke tiap leaf.
 * Return: array baris aturan { depth, label, node, isLeaf }
 */
function buildTreeLogicRows(nodes) {
  if (!nodes || nodes.length === 0) return [];

  // Buat map nodeId → node object
  const nodeMap = {};
  nodes.forEach((n) => { nodeMap[n.node_id] = n; });

  const rows = [];

  function traverse(nodeId, depth, prefixLabel) {
    const n = nodeMap[nodeId];
    if (!n) return;

    const dominant = Object.entries(n.distribusi ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

    if (n.tipe === "leaf") {
      rows.push({
        depth,
        label: prefixLabel,
        node: n,
        isLeaf: true,
        dominant,
        rule: `THEN → ${dominant}`,
      });
      return;
    }

    const term      = n.term_split ?? "?";
    const threshold = n.threshold?.toFixed(6) ?? "?";
    const prefix    = depth === 0 ? "IF" : "AND IF";

    rows.push({
      depth,
      label: prefixLabel,
      node: n,
      isLeaf: false,
      dominant,
      rule: `${prefix} '${term}' ≤ ${threshold}`,
      ruleRight: `${prefix} '${term}' > ${threshold}`,
    });

    // Cabang KIRI (≤ threshold)
    if (n.child_kiri != null) traverse(n.child_kiri, depth + 1, "kiri");
    // Cabang KANAN (> threshold)
    if (n.child_kanan != null) traverse(n.child_kanan, depth + 1, "kanan");
  }

  // Mulai dari root (node_id yang tidak pernah jadi child)
  const childIds = new Set(
    nodes.flatMap((n) => [n.child_kiri, n.child_kanan].filter((x) => x != null))
  );
  const rootNode = nodes.find((n) => !childIds.has(n.node_id));
  if (rootNode) traverse(rootNode.node_id, 0, "root");

  return rows;
}

/**
 * Konversi rows ke string teks indented untuk export Excel.
 * Format: "└── IF 'term' <= 0.xxxx  (Samples: N, Gini: 0.xxxx)"
 */
function treeRowsToText(rows) {
  return rows.map((r) => {
    const indent = "    ".repeat(r.depth) + (r.depth > 0 ? "└── " : "");
    const meta   = `(Samples: ${r.node.jumlah_sampel}, Gini: ${r.node.gini.toFixed(4)})`;
    if (r.isLeaf) {
      return `${indent}${r.rule} ${meta}`;
    }
    return `${indent}[Node #${r.node.node_id} - Depth ${r.depth + 1}]: ${r.rule} ${meta}`;
  });
}

// ── Tree Logic View component ─────────────────────────────────────────────────
function TreeLogicView({ nodes }) {
  const rows = buildTreeLogicRows(nodes);

  if (!rows.length) {
    return <p className="text-gray-400 text-sm text-center py-8">Tidak ada data node untuk ditampilkan.</p>;
  }

  const INDENT_PX = 20;

  return (
    <div className="font-mono text-xs bg-gray-950 text-green-300 rounded-xl p-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
      {rows.map((r, i) => {
        const ml  = r.depth * INDENT_PX;
        const connector = r.depth > 0 ? "└── " : "";
        const giniColor = r.node.gini <= 0.05 ? "text-green-400" : r.node.gini <= 0.25 ? "text-yellow-400" : r.node.gini <= 0.5 ? "text-orange-400" : "text-red-400";
        const domColor  = CAT_COLOR[r.dominant]?.bg ?? "#9CA3AF";

        return (
          <div key={`${r.node.node_id}-${i}`} className="leading-6 hover:bg-white/5 rounded px-1" style={{ marginLeft: ml }}>
            <span className="text-gray-500">{connector}</span>

            {r.isLeaf ? (
              <>
                <span className="text-purple-400 font-bold">THEN → </span>
                <span className="font-bold" style={{ color: domColor }}>{r.dominant}</span>
                <span className="text-gray-500 ml-2">
                  (Samples: <span className="text-white">{r.node.jumlah_sampel}</span>,{" "}
                  Gini: <span className={giniColor}>{r.node.gini.toFixed(4)}</span>
                  {r.node.is_pure && <span className="text-green-400 ml-1">✦PURE</span>})
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-500 text-[10px] mr-1">[Node #{r.node.node_id} D{r.depth}]</span>
                <span className={r.depth === 0 ? "text-cyan-400 font-bold" : "text-yellow-300 font-bold"}>
                  {r.depth === 0 ? "IF" : "AND IF"}{" "}
                </span>
                <span className="text-blue-300">'{r.node.term_split}'</span>
                <span className="text-gray-400"> ≤ </span>
                <span className="text-orange-300">{r.node.threshold?.toFixed(6)}</span>
                <span className="text-gray-500 ml-2">
                  (Samples: <span className="text-white">{r.node.jumlah_sampel}</span>,{" "}
                  Gini: <span className={giniColor}>{r.node.gini.toFixed(4)}</span>)
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Export Excel helper ───────────────────────────────────────────────────────
async function exportTreeToExcel(treeId, nodes) {
  // Load SheetJS dari CDN
  let XLSX;
  try {
    XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
  } catch {
    alert("Gagal load library Excel. Pastikan ada koneksi internet."); return;
  }

  const rows    = buildTreeLogicRows(nodes);
  const textArr = treeRowsToText(rows);

  // Sheet 1: Decision Path (teks visual)
  const sheet1Data = [
    ["Decision Path (IF-ELSE Tree Logic)", "", "", "", ""],
    ["Indented Rule", "Node ID", "Depth", "Gini", "Samples", "Distribusi", "Prediksi / Dominant"],
  ];
  rows.forEach((r, i) => {
    const distStr = Object.entries(r.node.distribusi ?? {})
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ");
    sheet1Data.push([
      textArr[i],
      r.node.node_id,
      r.depth,
      r.node.gini,
      r.node.jumlah_sampel,
      distStr,
      r.isLeaf ? `LEAF → ${r.dominant}` : `${r.node.term_split} ≤ ${r.node.threshold?.toFixed(6)}`,
    ]);
  });

  // Sheet 2: Data Tabular (flat)
  const sheet2Data = [
    ["node_id", "kedalaman", "tipe", "term_split", "threshold", "gini", "is_pure", "jumlah_sampel",
     ...CATS.map((c) => `dist_${c}`), "prediksi"],
  ];
  nodes.forEach((n) => {
    sheet2Data.push([
      n.node_id, n.kedalaman, n.tipe,
      n.term_split ?? "", n.threshold ?? "",
      n.gini, n.is_pure,
      n.jumlah_sampel,
      ...CATS.map((c) => n.distribusi?.[c] ?? 0),
      n.prediksi ?? "",
    ]);
  });

  const wb  = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);

  // Lebar kolom otomatis untuk sheet 1
  ws1["!cols"] = [{ wch: 80 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 40 }, { wch: 30 }];
  ws2["!cols"] = [{ wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 12 }];

  XLSX.utils.book_append_sheet(wb, ws1, "Decision Path");
  XLSX.utils.book_append_sheet(wb, ws2, "Node Data");
  XLSX.writeFile(wb, `tree_${treeId}_decision_path.xlsx`);
}


function TreeSummaryTable({ trees, selected, onSelect }) {
  const rows = Object.entries(trees)
    .map(([k, v]) => ({ tree_id: parseInt(k.replace("tree_", "")), ...v }))
    .sort((a, b) => a.tree_id - b.tree_id);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-green-100 text-green-900">
          <tr>
            <th className="p-3 text-left font-semibold">Pohon</th>
            <th className="p-3 text-center font-semibold">Total Node</th>
            <th className="p-3 text-center font-semibold">Node Split</th>
            <th className="p-3 text-center font-semibold">Leaf</th>
            <th className="p-3 text-center font-semibold">Kedalaman</th>
            <th className="p-3 text-left font-semibold">Rata-rata Gini</th>
            <th className="p-3 text-left font-semibold">Top Term Split</th>
            <th className="p-3 text-center font-semibold w-24">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isSelected = selected === row.tree_id;
            return (
              <tr key={row.tree_id} className={`border-t transition-colors ${isSelected ? "bg-green-50 ring-2 ring-inset ring-green-400" : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-green-50"}`}>
                <td className="p-3 font-semibold text-gray-800">
                  <div className="flex items-center gap-2"><TreeDeciduous className="w-4 h-4 text-green-600" />Tree #{row.tree_id}</div>
                </td>
                <td className="p-3 text-center font-mono text-gray-700">{row.total_node}</td>
                <td className="p-3 text-center"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono text-xs">{row.total_split}</span></td>
                <td className="p-3 text-center"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-mono text-xs">{row.total_leaf}</span></td>
                <td className="p-3 text-center font-mono text-gray-700">{row.kedalaman}</td>
                <td className="p-3 min-w-[160px]"><GiniBar gini={row.rata_gini} /></td>
                <td className="p-3 font-mono text-xs text-blue-700">{row.top_term ?? "-"}</td>
                <td className="p-3 text-center">
                  <button onClick={() => onSelect(isSelected ? null : row.tree_id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isSelected ? "bg-green-700 text-white border-green-700" : "border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-700"}`}>
                    {isSelected
                      ? <span className="flex items-center gap-1"><ChevronUp className="w-3 h-3" />Tutup</span>
                      : <span className="flex items-center gap-1"><ChevronDown className="w-3 h-3" />Lihat</span>}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Level 2: Tabel node per pohon ─────────────────────────────────────────────
function NodeTable({ treeId, selectedNode, onSelectNode, onClose }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [tipe, setTipe]         = useState("semua");
  const [pureOnly, setPureOnly] = useState(false);
  const [page, setPage]         = useState(1);
  const [viewMode, setViewMode] = useState("table"); // "table" | "logic"
  const [exporting, setExporting] = useState(false);
  const PAGE = 30;

  // Selalu load SEMUA node (tanpa filter) untuk tree logic view
  const [allNodes, setAllNodes] = useState([]);

  useEffect(() => {
    setLoading(true); setError(null);
    // Load semua node untuk logic view (tanpa filter)
    fetch(`/api/gini/${treeId}/nodes?tipe=semua&pure=0&search=`)
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.error); }))
      .then((d) => { setAllNodes(d.nodes ?? []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
    setPage(1);
  }, [treeId]);

  // Node yang difilter untuk tampilan tabel
  const filteredNodes = allNodes.filter((n) => {
    const matchTipe   = tipe === "semua" || n.tipe === tipe;
    const matchPure   = !pureOnly || n.is_pure;
    const matchSearch = !search || n.term_split?.includes(search);
    return matchTipe && matchPure && matchSearch;
  });

  const pages = Math.max(1, Math.ceil(filteredNodes.length / PAGE));
  const slice = filteredNodes.slice((page - 1) * PAGE, page * PAGE);
  const depthIndent = (depth) => Math.min(depth * 12, 96);

  const handleExport = async () => {
    setExporting(true);
    try { await exportTreeToExcel(treeId, allNodes); }
    finally { setExporting(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-green-700 text-white">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5" />
          <span className="font-bold">Struktur Node — Tree #{treeId}</span>
          {allNodes.length > 0 && <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">{allNodes.length} node total</span>}
        </div>
        <div className="flex items-center gap-2">
          {/* Tombol Export */}
          <button onClick={handleExport} disabled={exporting || allNodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
            {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
          <button onClick={onClose} className="hover:bg-green-600 rounded-lg p-1 transition-colors"><ChevronUp className="w-5 h-5" /></button>
        </div>
      </div>

      {error && <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      <div className="p-5 space-y-4">
        {/* Tab switcher: Tabel vs Tree Logic */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${viewMode === "table" ? "bg-white shadow text-green-700" : "text-gray-500 hover:text-gray-700"}`}>
              <Table2 className="w-4 h-4" />Tabel Linear
            </button>
            <button onClick={() => setViewMode("logic")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${viewMode === "logic" ? "bg-white shadow text-green-700" : "text-gray-500 hover:text-gray-700"}`}>
              <GitBranch className="w-4 h-4" />IF-ELSE Tree Logic
            </button>
          </div>
          <p className="text-xs text-gray-400">
            {viewMode === "logic"
              ? "Visualisasi bersarang berdasarkan kedalaman node — kiri = kondisi terpenuhi (≤)"
              : `${filteredNodes.length} node ditampilkan · klik ↓ untuk sampel`}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />Memuat struktur pohon...
          </div>
        )}

        {/* ── VIEW MODE: Tree Logic ── */}
        {!loading && viewMode === "logic" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
              <GitBranch className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Cara baca: IF-ELSE Tree Logic</p>
                <p>Setiap baris menunjukkan satu kondisi split. Cabang <strong>kiri</strong> (indentasi lanjut) = kondisi <strong>terpenuhi (≤ threshold)</strong>.
                Node dengan label <span className="font-bold text-purple-600">THEN →</span> adalah leaf — prediksi akhir untuk sampel yang mencapainya.</p>
              </div>
            </div>
            <TreeLogicView nodes={allNodes} />
            <p className="text-xs text-gray-400">
              ✦ = Pure node · Warna Gini: <span className="text-green-600">hijau ≤0.05</span> · <span className="text-yellow-600">kuning ≤0.25</span> · <span className="text-orange-600">oranye ≤0.5</span> · <span className="text-red-600">merah &gt;0.5</span>
            </p>
          </div>
        )}

        {/* ── VIEW MODE: Tabel Linear ── */}
        {!loading && viewMode === "table" && (
          <>
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Cari term split..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
              </div>
              <select value={tipe} onChange={(e) => { setTipe(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
                <option value="semua">Semua Node</option>
                <option value="split">Split Node</option>
                <option value="leaf">Leaf Node</option>
              </select>
              <label className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={pureOnly} onChange={(e) => { setPureOnly(e.target.checked); setPage(1); }} className="rounded" />
                <Leaf className="w-3.5 h-3.5 text-green-600" />Pure (Gini ≤ 0.05)
              </label>
            </div>

            {/* Tabel node */}
            <div className="overflow-x-auto rounded-xl border text-xs">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-2.5 text-left font-semibold">Node ID</th>
                    <th className="p-2.5 text-center font-semibold">Depth</th>
                    <th className="p-2.5 text-left font-semibold">Term Split</th>
                    <th className="p-2.5 text-center font-semibold">Threshold</th>
                    <th className="p-2.5 text-left font-semibold">Gini</th>
                    <th className="p-2.5 text-center font-semibold">Sampel</th>
                    <th className="p-2.5 text-left font-semibold">Distribusi</th>
                    <th className="p-2.5 text-center font-semibold">Prediksi</th>
                    <th className="p-2.5 text-center font-semibold">Tipe</th>
                    <th className="p-2.5 text-center font-semibold w-16">Sampel</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.length === 0 ? (
                    <tr><td colSpan={10} className="p-6 text-center text-gray-400">Tidak ada node yang cocok</td></tr>
                  ) : slice.map((n, i) => {
                    const isSelectedNode = selectedNode?.node_id === n.node_id;
                    const dominant = Object.entries(n.distribusi ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0];
                    return (
                      <tr key={n.node_id} className={`border-t transition-colors ${isSelectedNode ? "bg-blue-50 ring-2 ring-inset ring-blue-400" : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-green-50"}`}>
                        <td className="p-2.5">
                          <span className="font-mono text-gray-600" style={{ paddingLeft: depthIndent(n.kedalaman) }}>
                            {n.kedalaman === 0 ? "🌱 " : ""}#{n.node_id}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-1.5 rounded text-xs font-mono ${n.kedalaman === 0 ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                            {n.kedalaman === 0 ? "Root" : n.kedalaman}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {n.term_split
                            ? <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{n.term_split}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="p-2.5 text-center font-mono text-gray-600">{n.threshold ?? "—"}</td>
                        <td className="p-2.5 min-w-[130px]">
                          <div className="flex items-center gap-1">
                            <GiniBar gini={n.gini} />
                            {n.is_pure && <span className="text-green-600 text-xs font-bold ml-1">✦</span>}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-mono font-semibold text-gray-700">{n.jumlah_sampel}</td>
                        <td className="p-2.5 min-w-[200px]">
                          <div className="flex gap-1 flex-wrap">
                            {CATS.map((cat) => {
                              const cnt = n.distribusi?.[cat] ?? 0;
                              if (!cnt) return null;
                              const c = CAT_COLOR[cat];
                              return (
                                <span key={cat} className="text-xs px-1 rounded" style={{ backgroundColor: c.light, color: c.text }}>
                                  {cat.substring(0, 3)}: {cnt}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-2.5 text-center">{dominant && <CatBadge val={dominant} />}</td>
                        <td className="p-2.5 text-center">
                          {n.tipe === "leaf"
                            ? <span className="flex items-center justify-center gap-1 text-green-600 font-semibold"><Leaf className="w-3 h-3" />Leaf</span>
                            : <span className="flex items-center justify-center gap-1 text-blue-600"><GitBranch className="w-3 h-3" />Split</span>}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => onSelectNode(isSelectedNode ? null : n)}
                            title="Lihat sampel di node ini"
                            className={`px-2 py-1 rounded text-xs font-semibold border transition-colors ${isSelectedNode ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600"}`}>
                            {n.n_sampel_ids}↓
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Halaman {page} dari {pages} · {filteredNodes.length} total</span>
                <div className="flex gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">‹</button>
                  <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">›</button>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400">✦ = Pure node (Gini ≤ 0.05) · Angka di kolom terakhir = jumlah sampel di node, klik untuk detail</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Level 3: Sampel per node (on-demand) ─────────────────────────────────────
function NodeSamplesPanel({ treeId, node, prediksiNode, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gini/${treeId}/node/${node.node_id}/samples`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [treeId, node.node_id]);

  const filtered = (data?.items ?? []).filter((d) => {
    return !search || d.kode_pengaduan.toLowerCase().includes(search.toLowerCase()) ||
      d.nama.toLowerCase().includes(search.toLowerCase()) ||
      d.deskripsi.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-blue-700 text-white">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5" />
          <span className="font-bold">Sampel Node #{node.node_id} — Tree #{treeId}</span>
          {data && (
            <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">
              {data.total} sampel · {node.tipe === "leaf" ? "LEAF" : "SPLIT"} · Gini {node.gini.toFixed(4)}
              {node.is_pure && " ✦ PURE"}
            </span>
          )}
        </div>
        <button onClick={onClose} className="hover:bg-blue-600 rounded-lg p-1"><ChevronUp className="w-5 h-5" /></button>
      </div>

      <div className="p-5 space-y-4">
        {/* Info node */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATS.map((cat) => {
            const cnt = node.distribusi?.[cat] ?? 0;
            const c   = CAT_COLOR[cat];
            const isPred = prediksiNode === cat;
            return (
              <div key={cat} className={`rounded-xl border p-3 ${isPred ? "border-2" : ""}`}
                style={{ borderColor: isPred ? c.bg : `${c.bg}30`, backgroundColor: c.light }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: c.bg }}>{cat} {isPred && "★"}</p>
                <p className="text-xl font-bold text-gray-800">{cnt}</p>
                <p className="text-xs text-gray-500">{node.jumlah_sampel ? ((cnt / node.jumlah_sampel) * 100).toFixed(1) : 0}%</p>
              </div>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder="Cari kode, nama, deskripsi..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400"><RefreshCw className="w-4 h-4 animate-spin inline mr-2" />Memuat...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 text-blue-900">
                <tr>
                  <th className="p-3 text-left font-semibold">Kode</th>
                  <th className="p-3 text-left font-semibold">Nama</th>
                  <th className="p-3 text-left font-semibold">Cuplikan Deskripsi</th>
                  <th className="p-3 text-center font-semibold">Label Asli</th>
                  <th className="p-3 text-center font-semibold">Prediksi Node</th>
                  <th className="p-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-400">Tidak ada data</td></tr>
                ) : filtered.map((d, i) => {
                  const mismatch = prediksiNode && d.label_asli !== prediksiNode && d.label_asli !== "-";
                  return (
                    <tr key={`${d.kode_pengaduan}-${i}`} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}>
                      <td className="p-3 font-mono text-xs text-gray-600 whitespace-nowrap">{d.kode_pengaduan}</td>
                      <td className="p-3 text-xs text-gray-700 whitespace-nowrap">{d.nama}</td>
                      <td className="p-3 text-xs text-gray-600 max-w-xs">
                        <span title={d.deskripsi}>{d.deskripsi?.substring(0, 65)}{d.deskripsi?.length > 65 ? "…" : ""}</span>
                      </td>
                      <td className="p-3 text-center">{d.label_asli !== "-" ? <CatBadge val={d.label_asli} /> : <span className="text-gray-400 text-xs">—</span>}</td>
                      <td className="p-3 text-center">{prediksiNode && <CatBadge val={prediksiNode} />}</td>
                      <td className="p-3 text-center text-xs">
                        {d.label_asli === "-" ? <span className="text-gray-400">—</span>
                          : mismatch
                          ? <span className="text-orange-600 font-semibold">⚠️ Beda</span>
                          : <span className="text-green-600 font-semibold flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />Sesuai</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-400">⚠️ Beda = label asli berbeda dari prediksi node — bukan berarti salah, karena ini intermediate node, bukan leaf.</p>
      </div>
    </div>
  );
}

// ── Level 4: Analisis term split global (tab terpisah) ───────────────────────
function TermSplitGlobal({ meta }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [minPohon, setMinPohon] = useState(1);
  const [page, setPage]         = useState(1);
  const LIMIT = 50;

  const fetch_ = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ min_pohon: minPohon, search, page, limit: LIMIT });
    fetch(`/api/gini/terms?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [minPohon, search, page]);

  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => { setPage(1); }, [minPohon, search]);

  const nTrees = meta?.n_trees ?? 20;

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
      <div>
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-700" />
          Analisis Term Split Global ({nTrees} Pohon)
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Term mana yang paling sering dipakai sebagai split di seluruh forest — indikator fitur yang paling diskriminatif.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder="Cari term..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
          <span className="text-gray-500 whitespace-nowrap">Min. pohon ≥</span>
          <input type="number" min={1} max={nTrees} value={minPohon}
            onChange={(e) => { setMinPohon(Math.max(1, parseInt(e.target.value) || 1)); setPage(1); }}
            className="w-14 text-center focus:outline-none font-mono font-semibold" />
          <span className="text-gray-400 text-xs">/ {nTrees}</span>
        </div>
        {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin self-center" />}
        {data && <span className="text-xs text-gray-400 self-center">{data.total} term</span>}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-900">
            <tr>
              <th className="p-3 text-left font-semibold">Term</th>
              <th className="p-3 text-center font-semibold">Frekuensi Split</th>
              <th className="p-3 text-center font-semibold">Di Pohon (Unik)</th>
              <th className="p-3 text-left font-semibold">Pohon IDs</th>
              <th className="p-3 text-left font-semibold">Rata-rata Gini saat Split</th>
            </tr>
          </thead>
          <tbody>
            {!data?.items?.length ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">{loading ? "Memuat..." : "Tidak ada term yang cocok"}</td></tr>
            ) : data.items.map((t, i) => {
              const pct = ((t.pohon_unik / nTrees) * 100).toFixed(0);
              return (
                <tr key={t.term} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-50`}>
                  <td className="p-3 font-mono text-blue-700 text-sm">{t.term}</td>
                  <td className="p-3 text-center font-mono font-semibold text-gray-700">{t.frekuensi}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex-1 max-w-[80px] bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-semibold text-green-700 text-xs">{t.pohon_unik}/{nTrees}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-gray-500 font-mono">
                    {t.pohon_ids.slice(0, 10).join(", ")}{t.pohon_ids.length > 10 ? "…" : ""}
                  </td>
                  <td className="p-3 min-w-[160px]"><GiniBar gini={t.rata_gini} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Halaman {data.page} dari {data.totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">‹</button>
            <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">›</button>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400">Term dengan Gini rendah saat split = term tersebut sangat "kuat" membedakan kelas — sedikit kehadiran term ini langsung mengelompokkan data secara bersih.</p>
    </div>
  );
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function RFGini({ onLogout }) {
  const [summary, setSummary]       = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [activeTab, setActiveTab]   = useState("trees"); // trees | terms
  const [selectedTree, setSelectedTree]   = useState(null);
  const [selectedNode, setSelectedNode]   = useState(null);

  useEffect(() => {
    fetch("/api/gini")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setSummary(d); setLoadingPage(false); })
      .catch(() => setLoadingPage(false));
  }, []);

  const handleSelectTree = useCallback((treeId) => {
    setSelectedTree(treeId);
    setSelectedNode(null);
    if (treeId) setTimeout(() => document.getElementById("node-table-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, []);

  const handleSelectNode = useCallback((node) => {
    setSelectedNode(node);
    if (node) setTimeout(() => document.getElementById("node-samples-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, []);

  const trees     = summary?.trees ?? {};
  const nTrees    = Object.keys(trees).length;
  const avgGini   = nTrees ? (Object.values(trees).reduce((s, t) => s + t.rata_gini, 0) / nTrees).toFixed(4) : "—";
  const avgDepth  = nTrees ? Math.round(Object.values(trees).reduce((s, t) => s + t.kedalaman, 0) / nTrees) : "—";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">

          {/* Judul */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gini Impurity &amp; Node Splitting</h1>
              <p className="text-sm text-gray-500 mt-1">
                Transparansi penuh — struktur node tiap pohon, term split, distribusi kelas, dan sampel per node.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber: <code className="font-semibold mx-1">data/stages/gini_splitting.json</code>
                + <code className="font-semibold">data/stages/gini_samples/</code>
              </div>
            </div>
          </div>

          {loadingPage && <div className="flex items-center gap-2 text-gray-400 py-12 justify-center"><RefreshCw className="w-5 h-5 animate-spin" />Memuat...</div>}
          {!loadingPage && !summary && <FallbackNotice />}

          {/* Kartu ringkasan */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Pohon Ditampilkan",  value: nTrees,   sub: "dari total 500 estimators", color: "#2E7D32" },
                { label: "Avg Rata-rata Gini", value: avgGini,  sub: "rata-rata gini split nodes", color: "#E53935" },
                { label: "Avg Kedalaman",      value: avgDepth, sub: "kedalaman pohon",            color: "#1976D2" },
                { label: "Unique Split Terms", value: (summary._term_split_global ?? []).length, sub: "term berbeda sebagai split", color: "#F57C00" },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl shadow p-5 border-l-4" style={{ borderColor: c.color }}>
                  <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab switcher */}
          {summary && (
            <div className="flex gap-2 border-b bg-white rounded-t-2xl px-4 pt-4 shadow-sm">
              <button onClick={() => setActiveTab("trees")}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "trees" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                <span className="flex items-center gap-1.5"><TreeDeciduous className="w-4 h-4" />Ringkasan & Struktur Pohon</span>
              </button>
              <button onClick={() => setActiveTab("terms")}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "terms" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" />Analisis Term Split Global</span>
              </button>
            </div>
          )}

          {/* Tab: Pohon */}
          {summary && activeTab === "trees" && (
            <>
              <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
                <div>
                  <h2 className="font-bold text-gray-800">Level 1 — Ringkasan Semua Pohon</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Klik <strong>Lihat</strong> untuk membuka struktur node lengkap pohon tersebut.</p>
                </div>
                <TreeSummaryTable trees={trees} selected={selectedTree} onSelect={handleSelectTree} />
              </div>

              {/* Level 2: Node table */}
              {selectedTree && (
                <div id="node-table-panel">
                  <NodeTable
                    treeId={selectedTree}
                    selectedNode={selectedNode}
                    onSelectNode={handleSelectNode}
                    onClose={() => { setSelectedTree(null); setSelectedNode(null); }}
                  />
                </div>
              )}

              {/* Level 3: Sampel node */}
              {selectedNode && selectedTree && (
                <div id="node-samples-panel">
                  <NodeSamplesPanel
                    treeId={selectedTree}
                    node={selectedNode}
                    prediksiNode={selectedNode.prediksi}
                    onClose={() => setSelectedNode(null)}
                  />
                </div>
              )}
            </>
          )}

          {/* Tab: Terms */}
          {summary && activeTab === "terms" && (
            <TermSplitGlobal meta={summary._meta} />
          )}

          {/* Rumus Gini (selalu tampil di bawah) */}
          {summary && (
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-gray-800 mb-3">Referensi — Formula Gini Impurity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 border rounded-xl font-mono text-sm"><strong>Gini = 1 − Σᵢ pᵢ²</strong></div>
                  <div className="p-3 bg-gray-50 border rounded-xl font-mono text-xs text-gray-700">ΔGini = Gini(parent) − [nL/n·Gini(L) + nR/n·Gini(R)]</div>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { range: "Gini = 0.00", desc: "Pure node — satu kelas", color: "#43A047" },
                    { range: "Gini ≤ 0.05", desc: "Hampir pure (✦ ditandai)", color: "#8BC34A" },
                    { range: "Gini ~ 0.50", desc: "2 kelas seimbang", color: "#FB8C00" },
                    { range: "Gini ~ 0.75", desc: "4 kelas sama rata (maksimum)", color: "#E53935" },
                  ].map((r) => (
                    <div key={r.range} className="flex items-center gap-2 p-2 rounded bg-gray-50 border">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                      <span className="font-mono font-semibold w-28" style={{ color: r.color }}>{r.range}</span>
                      <span className="text-gray-500">{r.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
