import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

const UploadData = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { setData } = useData();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    } else {
      setError('Please select a valid CSV file.');
      setFile(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const firstRow = results.data[0];
          const keys = Object.keys(firstRow).map(k => k.toLowerCase());
          const hasDate = keys.some(k => ['date', 'timestamp', 'time'].includes(k));
          const hasNDVI = keys.some(k => ['ndvi', 'value', 'index'].includes(k));

          if (hasDate && hasNDVI) {
            setData(results.data);
            setSuccess(true);
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            setError('Invalid CSV format. Ensure columns for "Date" and "NDVI" exist (case-insensitive).');
          }
        } else {
          setError('The CSV file is empty.');
        }
      },
      error: (err) => {
        setError('Error parsing CSV: ' + err.message);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-4">Upload Monitoring Data</h1>
        <p className="text-slate-400">Import your custom NDVI datasets for advanced analysis.</p>
      </motion.div>

      <div className="glass p-12 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          {!file ? (
            <label className="w-full flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:bg-white/5 hover:border-emerald-500/50 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform mb-4">
                  <Upload className="w-10 h-10 text-emerald-400" />
                </div>
                <p className="mb-2 text-sm text-slate-300">
                  <span className="font-bold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">CSV files only (max. 10MB)</p>
              </div>
              <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </label>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full p-6 bg-white/5 border border-emerald-500/30 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-bold">{file.name}</p>
                  <p className="text-slate-400 text-xs">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center space-x-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center space-x-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-lg border border-emerald-400/20"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Data parsed successfully! Redirecting...</span>
            </motion.div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || success}
            className={`mt-10 px-12 py-4 rounded-xl font-bold transition-all flex items-center space-x-2 ${
              !file || success
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            <span>Process Data</span>
          </button>
        </div>
      </div>

      <div className="mt-12 p-6 glass rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">CSV Format Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-black/30 rounded-xl border border-white/5">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-widest">Required Columns</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 text-xs">Date / Timestamp</span>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 text-xs">NDVI / Value</span>
            </div>
          </div>
          <div className="p-4 bg-black/30 rounded-xl border border-white/5">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-widest">Flexible Parsing</p>
            <p className="text-xs text-slate-400">Headers are case-insensitive and support multiple naming conventions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadData;
