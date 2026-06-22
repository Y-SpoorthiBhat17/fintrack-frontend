import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ColumnMap {
  date: string; amount: string; description: string;
  category: string; type: string; credit: string; debit: string;
}

const CSVImportPage: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [useDebitCredit, setUseDebitCredit] = useState(false);
  const [columnMap, setColumnMap] = useState<ColumnMap>({
    date: '', amount: '', description: '', category: '', type: '', credit: '', debit: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };

    const parseRow = (line: string) => {
      const result: string[] = [];
      let cur = '', inQuote = false;
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(l => {
      const vals = parseRow(l);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    });
    return { headers, rows };
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setHeaders(headers);
      setRows(rows);
      // Auto-guess column mapping
      const h = headers.map(h => h.toLowerCase());
      setColumnMap({
        date: headers[h.findIndex(x => x.includes('date'))] || '',
        amount: headers[h.findIndex(x => x.includes('amount') || x.includes('total'))] || '',
        description: headers[h.findIndex(x => x.includes('desc') || x.includes('narration') || x.includes('particular'))] || '',
        // "category" and "type" are different fields — a column literally
        // named "category" should never be picked by the type matcher, and
        // vice versa. Previously this matcher also accepted "type", which
        // meant a file with both a "category" column and a "transaction_type"
        // column could have category steal the type slot (or leave type
        // unmapped), silently defaulting every row to "expense".
        category: headers[h.findIndex(x => x.includes('category') || x.includes('cat'))] || '',
        // Matches "type", "txn type", "transaction_type", "trans type", etc —
        // any header containing "type" that isn't actually the category column.
        type: headers[h.findIndex(x => x.includes('type') && !x.includes('category'))] || '',
        credit: headers[h.findIndex(x => x.includes('credit') || x === 'cr')] || '',
        debit: headers[h.findIndex(x => x.includes('debit') || x === 'dr')] || '',
      });
      // Auto-detect if credit/debit columns exist
      if (h.some(x => x.includes('credit')) && h.some(x => x.includes('debit'))) {
        setUseDebitCredit(true);
      }
      toast.success(`Loaded ${rows.length} rows from ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) handleFile(file);
    else toast.error('Please upload a CSV file');
  };

  const handleImport = async () => {
    if (rows.length === 0) { toast.error('No data loaded'); return; }

    // Without a type/credit/debit column mapped, every row would silently
    // default to "expense" — including real income rows. Block the import
    // and tell the person exactly what to fix instead of corrupting data.
    if (!useDebitCredit && !columnMap.type) {
      toast.error('Map a "Type" column (or switch on Credit/Debit columns) so income and expense are detected correctly — otherwise everything will be imported as expense.');
      return;
    }

    setLoading(true);
    try {
      const map = useDebitCredit
        ? { date: columnMap.date, description: columnMap.description, category: columnMap.category, credit: columnMap.credit, debit: columnMap.debit }
        : { date: columnMap.date, amount: columnMap.amount, description: columnMap.description, category: columnMap.category, type: columnMap.type };

      const res = await api.post('/import/csv', { rows, columnMap: map });
      setResult(res.data.data);
      if (res.data.data.imported > 0) {
        toast.success(`Imported ${res.data.data.imported} transactions!`);
      }
      else toast.error('No valid rows found. Check your column mapping.');
    } catch { toast.error('Import failed'); }
    finally { setLoading(false); }
  };

  const sel = (field: keyof ColumnMap) => (
    <select
      value={columnMap[field]}
      onChange={e => setColumnMap(p => ({ ...p, [field]: e.target.value }))}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
    >
      <option value="">— not mapped —</option>
      {headers.map(h => <option key={h} value={h}>{h}</option>)}
    </select>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">📊</span> CSV / Excel Import
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload a CSV exported from your bank, Excel, or accounting software.
        </p>
      </div>

      {/* Supported formats */}
      <div className="glass rounded-xl p-4 text-xs text-slate-400 space-y-1">
        <p className="font-medium text-slate-300">✅ Supported sources</p>
        <p>HDFC NetBanking export · SBI account statement · ICICI bank CSV · Excel sheet saved as CSV · Tally export · Zoho Books export · Any bank statement CSV</p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="glass rounded-xl p-10 border-2 border-dashed border-white/10 hover:border-emerald-500/40 transition cursor-pointer text-center"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="text-4xl mb-3">📂</div>
        {fileName ? (
          <>
            <p className="text-white font-medium">{fileName}</p>
            <p className="text-emerald-400 text-sm mt-1">{rows.length} rows loaded</p>
          </>
        ) : (
          <>
            <p className="text-slate-300 font-medium">Drop your CSV file here</p>
            <p className="text-slate-500 text-sm mt-1">or click to browse · .csv files only</p>
          </>
        )}
      </div>

      {/* Column Mapping */}
      {headers.length > 0 && (
        <div className="glass rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Map Columns</h2>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useDebitCredit}
                onChange={e => setUseDebitCredit(e.target.checked)}
                className="accent-emerald-500"
              />
              My CSV has separate Credit/Debit columns
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Date column *</label>
              {sel('date')}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Description column</label>
              {sel('description')}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Category column</label>
              {sel('category')}
            </div>

            {useDebitCredit ? (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Credit / Income column *</label>
                  {sel('credit')}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Debit / Expense column *</label>
                  {sel('debit')}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Amount column *</label>
                  {sel('amount')}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Type column (income/expense)</label>
                  {sel('type')}
                </div>
              </>
            )}
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Preview (first 3 rows)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    {headers.map(h => <th key={h} className="px-3 py-2 text-left text-slate-500 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {headers.map(h => <td key={h} className="px-3 py-2 text-slate-400 truncate max-w-24">{row[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleImport} disabled={loading} className="btn-primary px-6 py-2.5">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  Importing...
                </span>
              ) : `📥 Import ${rows.length} Rows`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Import Result</h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-mono text-emerald-400">{result.imported}</p>
              <p className="text-xs text-slate-500 mt-1">Imported</p>
            </div>
            <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-mono text-red-400">{result.errors.length}</p>
              <p className="text-xs text-slate-500 mt-1">Errors</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              {result.errors.map((e, i) => <p key={i} className="text-xs text-red-400">{e}</p>)}
            </div>
          )}
          {result.imported > 0 && (
            <p className="text-xs text-emerald-400">✅ Done! Go to Transactions to review.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CSVImportPage;
