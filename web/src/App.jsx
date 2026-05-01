import { useState, useEffect } from 'react';
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
  LogOut,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import MapView from './components/MapView';
import Auth from './components/Auth';
import BookingModal from './components/BookingModal';
import { supabase } from './supabaseClient';

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discover', label: 'Discover Pros', icon: Search },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'providers', label: 'Service Pros', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="brand-row">
        <div className="brand-icon">
          <Zap size={20} />
        </div>
        <span className="brand-text">UrbanPulse</span>
        <button className="mobile-close" onClick={() => setIsOpen(false)} aria-label="Close navigation">
          <X size={18} />
        </button>
      </div>

      <nav className="menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsOpen(false);
            }}
            className={`menu-item ${
              activeTab === item.id 
                ? 'active' 
                : ''
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="support-info" style={{ padding: '0 12px 16px', fontSize: '0.82rem' }}>
          <p className="subtle-text" style={{ margin: '0 0 4px' }}>Support</p>
          <a href="mailto:infonovelnet@gmail.com" className="support-link">infonovelnet@gmail.com</a>
        </div>
        <button className="menu-item sign-out" onClick={onLogout}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};


const StatCard = ({ label, value, icon: Icon, trend }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="stat-card"
  >
    <div className="stat-head">
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <span className={`trend-chip ${trend > 0 ? 'up' : 'down'}`}>
        {trend > 0 ? '+' : ''}{trend}%
      </span>
    </div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
  </motion.div>
);

const ProviderCard = ({ provider, onBook }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    className="provider-card"
  >
    {provider.is_ai_recommended && (
      <div className="ai-badge">
        AI Recommended
      </div>
    )}
    <div className="provider-header">
      <div className="provider-avatar">
        <Users size={20} />
      </div>
      <div>
        <h4>{provider.name}</h4>
        <div className="provider-rating">
          <Star size={12} fill="currentColor" />
          <span>{provider.rating}</span>
        </div>
      </div>
    </div>
    <div className="provider-price-row">
      <div className="subtle-text">Starting from</div>
      <div className="provider-price">₹{provider.price}</div>
    </div>
    <button className="provider-cta" onClick={() => onBook(provider)}>
      Book Service
    </button>
  </motion.div>
);

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [reviewModal, setReviewModal] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  async function fetchProviders() {
    setLoading(true);
    
    // Attempt Supabase Fetch
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-id.supabase.co') {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          id, rating, base_price,
          profiles (full_name, avatar_url, location),
          services (name)
        `)
        .eq('is_active', true);

      if (!error && data) {
        const formatted = data.map(p => ({
          id: p.id,
          name: p.profiles?.full_name || 'Expert Pro',
          rating: p.rating,
          price: p.base_price,
          location: p.profiles?.location,
          is_ai_recommended: p.rating > 4.5
        }));
        setProviders(formatted);
        setLoading(false);
        return;
      }
    }

    // Fallback for demo
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/providers/discover?lat=28.6139&lng=77.2090&service_id=1`);
      const data = await res.json();
      setProviders(data.results || []);
    } catch (err) {
      console.error("Failed to fetch providers", err);
      // Fallback if API also fails
      setProviders([]);
    }
    setLoading(false);
  }

  // ── Auth helpers ────────────────────────────────────────────────────────────
  function buildUserObj(supabaseUser) {
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      phone: supabaseUser.user_metadata?.phone || supabaseUser.email || '',
      role: supabaseUser.user_metadata?.role || 'user',
    };
  }

  function handleLogin(userData) {
    // Called from Auth.jsx after a successful Supabase sign-in
    // The Supabase onAuthStateChange listener below will also fire and
    // keep the session alive on refresh, so we just do a best-effort update here.
    const userObj = {
      id: userData.id || null,
      phone: userData.phone || '',
      name: userData.name || 'User',
      role: userData.role || 'user',
    };
    setUser(userObj);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setBookings([]);
  }

  // ── Restore session on page refresh ─────────────────────────────────────────
  useEffect(() => {
    // Check for an existing session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(buildUserObj(session.user));
    });

    // Listen for future auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? buildUserObj(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch providers when relevant tab is active ──────────────────────────────
  useEffect(() => {
    if (user && (activeTab === 'discover' || activeTab === 'dashboard')) {
      fetchProviders();
    }
  }, [activeTab, user]);

  // ── Fetch real bookings from Supabase ────────────────────────────────────────
  async function fetchBookings() {
    if (!user?.id) return;
    setBookingsLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, slot_time, status, total_price,
        providers (
          id,
          profiles ( full_name ),
          services ( name )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBookings(data);
    } else if (error) {
      console.error('Failed to fetch bookings:', error.message);
    }
    setBookingsLoading(false);
  }

  useEffect(() => {
    if (user && (activeTab === 'bookings' || activeTab === 'dashboard')) {
      fetchBookings();
    }
  }, [activeTab, user]);

  // Dashboard computations
  const activeBookingsCount = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length;
  const totalSpent = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

  async function submitReview(rating, text) {
    if (!reviewModal) return;
    const { error } = await supabase.from('reviews').insert({
      booking_id: reviewModal.id,
      user_id: user.id,
      provider_id: reviewModal.providers.id,
      rating: rating,
      review_text: text
    });
    if (!error) {
      alert("Review submitted successfully!");
      setReviewModal(null);
    } else {
      alert("Failed to submit review: " + error.message);
    }
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)} />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onLogout={handleLogout}
      />

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-mobile-actions">
              <button className="icon-button" onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation">
                <Menu size={20} />
              </button>
            </div>
            <h1>Welcome back, {user.name.split(' ')[0]}</h1>
            <p>Here's what's happening with your service marketplace today.</p>
          </div>
          <div className="topbar-right">
            <button 
              className="icon-button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="icon-button with-dot">
              <Bell size={20} />
              <div className="dot"></div>
            </button>
            <div className="avatar">
              {user.name.split(' ').map(n => n[0]).join('')}
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
              className="dashboard-panel"
            >
              <div className="stats-grid">
                <StatCard label="Total Spent" value={`₹${totalSpent}`} icon={TrendingUp} trend={0} />
                <StatCard label="Active Bookings" value={activeBookingsCount} icon={Clock} trend={0} />
                <StatCard label="Live Providers" value={providers.length} icon={Users} trend={0} />
                <StatCard label="Avg. Response" value="0m" icon={Zap} trend={0} />
              </div>

              <div className="content-grid">
                <section className="panel wide">
                  <div className="panel-head">
                    <h3>Top Recommended Pros</h3>
                    <button className="text-button">View All</button>
                  </div>
                  <div className="providers-grid">
                    {providers.slice(0, 4).map(p => <ProviderCard key={p.id} provider={p} onBook={setSelectedProvider} />)}
                  </div>
                </section>

                <aside className="panel">
                  <h3 className="live-title">Live Feed</h3>
                  <div className="feed-list">
                    {bookings.slice(0, 3).map(b => (
                      <div key={b.id} className="feed-item">
                        <div className="feed-icon">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="feed-text">
                            <span>You</span> booked <strong>{b.providers?.profiles?.full_name || 'a Pro'}</strong>
                          </p>
                          <span className="feed-time">
                            {b.slot_time ? new Date(b.slot_time).toLocaleString('en-IN', { dateStyle: 'short' }) : 'Recently'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && <p className="subtle-text" style={{ padding: '1rem' }}>No recent activity.</p>}
                  </div>
                </aside>
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
              <div className="discover-head">
                <div>
                  <h2>Discover Service Professionals</h2>
                  <div className="view-toggle">
                    <button 
                      className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      List View
                    </button>
                    <button 
                      className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                      onClick={() => setViewMode('map')}
                    >
                      Map View
                    </button>
                  </div>
                </div>
                <div className="search-wrap">
                  <Search className="search-icon" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name or skill..." 
                    className="search-input"
                  />
                </div>
              </div>

              {loading ? <p className="subtle-text">Loading professionals...</p> : null}
              
              <AnimatePresence mode="wait">
                {viewMode === 'list' ? (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="discover-grid"
                  >
                    {providers.map(p => <ProviderCard key={p.id} provider={p} onBook={setSelectedProvider} />)}
                  </motion.div>
                ) : (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <MapView providers={providers} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'bookings' && (
            <motion.div 
              key="bookings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="panel"
            >
              <div className="panel-head">
                <h2>Your Recent Bookings</h2>
              </div>
              <div className="bookings-list">
                {bookingsLoading ? (
                  <p className="subtle-text">Loading your bookings...</p>
                ) : bookings.length === 0 ? (
                  <div className="empty-state">
                    <Calendar size={48} className="subtle-text" />
                    <p>You have no active bookings yet.</p>
                    <button className="provider-cta" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setActiveTab('discover')}>
                      Browse Professionals
                    </button>
                  </div>
                ) : (
                  bookings.map(b => (
                    <div key={b.id} className="booking-item">
                      <div className="booking-info">
                        <h4>{b.providers?.profiles?.full_name || 'Service Pro'}</h4>
                        <p>{b.providers?.services?.name || 'Service'}</p>
                        <span className="subtle-text">
                          {b.slot_time ? new Date(b.slot_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Time TBD'}
                        </span>
                      </div>
                      <div className="booking-meta">
                        <span className={`status-chip ${b.status}`}>{b.status}</span>
                        <span className="provider-price">₹{b.total_price}</span>
                        {b.status === 'completed' && (
                          <button className="text-button" style={{ marginTop: '4px', fontSize: '0.75rem' }} onClick={() => setReviewModal(b)}>
                            Leave Review
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        <AnimatePresence>
          {selectedProvider && (
            <BookingModal 
              provider={selectedProvider} 
              onClose={() => setSelectedProvider(null)}
              onBookingSuccess={() => {
                setSelectedProvider(null);
                setActiveTab('bookings');
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reviewModal && (
            <div className="modal-overlay" onClick={() => setReviewModal(null)}>
              <motion.div 
                className="modal-content"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                style={{ padding: '24px', maxWidth: '400px', margin: 'auto', marginTop: '100px', borderRadius: '16px' }}
              >
                <h2 style={{ marginBottom: '8px' }}>Review {reviewModal.providers?.profiles?.full_name}</h2>
                <p style={{ marginBottom: '20px', color: '#64748b' }}>How was your experience?</p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  submitReview(parseInt(e.target.rating.value), e.target.review_text.value);
                }}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Rating (1-5)</label>
                    <input type="number" name="rating" min="1" max="5" defaultValue="5" required className="search-input" />
                  </div>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Review Text</label>
                    <textarea name="review_text" rows="3" required className="search-input" style={{ width: '100%', resize: 'vertical' }} placeholder="They did a great job..."></textarea>
                  </div>
                  <div className="modal-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="provider-cta cancel-btn" onClick={() => setReviewModal(null)} style={{ flex: 1, background: 'transparent' }}>Cancel</button>
                    <button type="submit" className="provider-cta" style={{ flex: 1, background: '#2563eb', color: 'white', borderColor: '#2563eb' }}>Submit Review</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

export default App;
