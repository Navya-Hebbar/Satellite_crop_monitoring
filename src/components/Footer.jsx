import { Satellite } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="glass border-t border-white/10 mt-auto print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Satellite className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">SatCrop</span>
          <span className="text-xs text-slate-500">Satellite Crop Monitoring Platform</span>
        </div>
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} SatCrop Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
