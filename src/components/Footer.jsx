import { Satellite, Globe, MessageCircle, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="glass border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Satellite className="w-8 h-8 text-emerald-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                SatCrop Monitoring
              </span>
            </div>
            <p className="text-slate-400 max-w-xs mb-6">
              Advanced satellite-based crop monitoring and vegetation health analytics for sustainable agriculture.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-emerald-400">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-emerald-400">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-emerald-400">
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-slate-400 hover:text-emerald-400 transition-colors">Home</a></li>
              <li><a href="/dashboard" className="text-slate-400 hover:text-emerald-400 transition-colors">Dashboard</a></li>
              <li><a href="/map" className="text-slate-400 hover:text-emerald-400 transition-colors">Map View</a></li>
              <li><a href="/about" className="text-slate-400 hover:text-emerald-400 transition-colors">About Us</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Methodology</h3>
            <ul className="space-y-2">
              <li className="text-slate-400">NDVI Analysis</li>
              <li className="text-slate-400">Satellite Imaging</li>
              <li className="text-slate-400">Time-series Tracking</li>
              <li className="text-slate-400">Predictive Modeling</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} SatCrop Systems. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
