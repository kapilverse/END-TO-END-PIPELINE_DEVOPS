import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  Search, 
  Bell, 
  MapPin, 
  Star, 
  Zap,
  TrendingUp,
  Clock,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discover', label: 'Discover Pros', icon: Search },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'providers', label: 'Service Pros', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-[#020617] border-r border-[rgba(255,255,255,0.1)] p-6 fixed left-0 top-0 flex flex-col">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Zap size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold font-outfit">UrbanPro</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-indigo-600/10 text-indigo-500 border-l-4 border-indigo-500' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, trend }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-[rgba(30,41,59,0.7)] backdrop-blur-xl border border-white/10 p-6 rounded-3xl"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-indigo-600/10 rounded-2xl">
        <Icon size={24} className="text-indigo-500" />
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
        {trend > 0 ? '+' : ''}{trend}%
      </span>
    </div>
    <div className="text-gray-400 text-sm font-medium mb-1">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </motion.div>
);

const ProviderCard = ({ provider }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    className="bg-[rgba(30,41,59,0.7)] backdrop-blur-xl border border-white/10 p-5 rounded-3xl relative overflow-hidden"
  >
    {provider.is_ai_recommended && (
      <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-wider">
        AI Recommended
      </div>
    )}
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
        <Users size={20} className="text-indigo-400" />
      </div>
      <div>
        <h4 className="font-bold">{provider.name}</h4>
        <div className="flex items-center gap-1 text-xs text-amber-400">
          <Star size={12} fill="currentColor" />
          <span>{provider.rating}</span>
        </div>
      </div>
    </div>
    <div className="flex justify-between items-center text-sm">
      <div className="text-gray-400">Starting from</div>
      <div className="font-bold text-indigo-400">₹{provider.price}</div>
    </div>
    <button className="w-full mt-4 bg-white/5 hover:bg-indigo-600 py-3 rounded-2xl font-bold transition-all">
      Book Service
    </button>
  </motion.div>
);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'discover' || activeTab === 'dashboard') {
      fetchProviders();
    }
  }, [activeTab]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/providers/discover?lat=28.6139&lng=77.2090&service_id=1');
      const data = await res.json();
      setProviders(data.results || []);
    } catch (err) {
      console.error("Failed to fetch providers", err);
      // Fallback for demo
      setProviders([
        { id: 1, name: "John Plumber", rating: 4.8, price: 500, is_ai_recommended: true },
        { id: 2, name: "Quick Fix Inc", rating: 4.2, price: 400, is_ai_recommended: false },
        { id: 3, name: "Expert Electrics", rating: 4.9, price: 800, is_ai_recommended: true },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#0b0f1a] text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, Admin</h1>
            <p className="text-gray-400">Here's what's happening with your service marketplace today.</p>
          </div>
          <div className="flex gap-4">
            <button className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors relative">
              <Bell size={20} />
              <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full"></div>
            </button>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-bold">
              AD
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value="₹1,24,500" icon={TrendingUp} trend={12.5} />
                <StatCard label="Active Bookings" value="42" icon={Clock} trend={8.2} />
                <StatCard label="Live Providers" value="158" icon={Users} trend={-2.4} />
                <StatCard label="Avg. Response" value="12m" icon={Zap} trend={15.1} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-[rgba(30,41,59,0.7)] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold">Top Recommended Pros</h3>
                    <button className="text-indigo-400 text-sm font-bold">View All</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {providers.slice(0, 4).map(p => <ProviderCard key={p.id} provider={p} />)}
                  </div>
                </div>

                <div className="bg-[rgba(30,41,59,0.7)] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold mb-8">Live Feed</h3>
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin size={18} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-bold">John Doe</span> booked <span className="font-bold text-indigo-400">Urban Fix</span>
                          </p>
                          <span className="text-xs text-gray-500">2 minutes ago</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'discover' && (
            <motion.div 
              key="discover"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Discover Service Professionals</h2>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name or skill..." 
                    className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-indigo-500 transition-colors w-80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {providers.map(p => <ProviderCard key={p.id} provider={p} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
