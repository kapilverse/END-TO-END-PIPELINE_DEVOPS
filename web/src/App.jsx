import { useEffect, useMemo, useState, useDeferredValue, startTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Briefcase,
  Calendar,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  Sparkles,
  Star,
  UserCog,
  Users,
  Wallet,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import './App.css';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import BookingModal from './components/BookingModal';
import MapView from './components/MapView';

const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.2090 };

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discover', label: 'Discover Pros', icon: Search },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'providers', label: 'Become a Pro', icon: UserCog },
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
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsOpen(false);
            }}
            className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="menu-item sign-out" onClick={onLogout}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const StatCard = ({ label, value, icon: Icon, trend }) => (
  <motion.div whileHover={{ y: -5 }} className="stat-card">
    <div className="stat-head">
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <span className={`trend-chip ${trend >= 0 ? 'up' : 'down'}`}>
        {trend >= 0 ? '+' : ''}
        {trend}%
      </span>
    </div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
  </motion.div>
);

const ProviderCard = ({ provider, onBook }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.01 }}
    className="provider-card"
  >
    {provider.is_ai_recommended && <div className="ai-badge">Top Match</div>}

    <div className="provider-header">
      <div className="provider-avatar">
        <Users size={20} />
      </div>
      <div>
        <h4>{provider.name}</h4>
        <div className="provider-rating">
          <Star size={12} fill="currentColor" />
          <span>
            {provider.rating.toFixed(1)} {provider.reviewCount ? `(${provider.reviewCount})` : ''}
          </span>
        </div>
        <div className="subtle-text">{provider.serviceName}</div>
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

const ReviewModal = ({ booking, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(booking.review?.rating || 5);
  const [reviewText, setReviewText] = useState(booking.review?.review_text || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        throw new Error('Please sign in again to submit a rating.');
      }

      const payload = {
        booking_id: booking.id,
        user_id: userId,
        provider_id: booking.provider_id,
        rating,
        review_text: reviewText.trim(),
      };

      const { error: reviewError } = await supabase.from('reviews').upsert(payload, {
        onConflict: 'booking_id',
      });

      if (reviewError) {
        throw reviewError;
      }

      if (booking.status !== 'completed') {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', booking.id);

        if (bookingError) {
          throw bookingError;
        }
      }

      onSubmitted();
    } catch (err) {
      console.error('Review submission failed:', err);
      setError(err.message || 'Unable to submit rating right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="booking-modal review-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h3>Rate {booking.providerName}</h3>
          <p className="subtle-text">Your feedback helps the next customer choose with confidence.</p>
        </div>

        <div className="modal-body">
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`review-star ${value <= rating ? 'active' : ''}`}
                onClick={() => setRating(value)}
              >
                <Star size={22} fill="currentColor" />
              </button>
            ))}
          </div>

          <textarea
            className="review-textarea"
            rows={5}
            placeholder="How was the service?"
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
          />

          {error && <div className="auth-error">{error}</div>}

          <button className="confirm-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

function mapSessionUser(user) {
  return {
    id: user.id,
    phone: user.user_metadata?.phone || user.email?.split('@')[0] || '',
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    role: user.user_metadata?.role || 'user',
  };
}

function mapProviderRow(row) {
  const reviews = row.reviews || [];
  const computedRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
      : row.rating || 0;

  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.profiles?.full_name || 'Service Professional',
    rating: computedRating,
    reviewCount: reviews.length,
    price: row.base_price || 0,
    location: row.profiles?.location || DEFAULT_LOCATION,
    serviceName: row.services?.name || 'General Service',
    serviceId: row.services?.id || row.service_id,
    is_ai_recommended: computedRating >= 4.5,
    isActive: row.is_active,
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [myProviderProfiles, setMyProviderProfiles] = useState([]);
  const [providerForm, setProviderForm] = useState({
    serviceId: '',
    price: '500',
    lat: String(DEFAULT_LOCATION.lat),
    lng: String(DEFAULT_LOCATION.lng),
    isActive: true,
  });
  const [providerSearch, setProviderSearch] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [providersLoading, setProvidersLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [providerSaving, setProviderSaving] = useState(false);
  const [providerError, setProviderError] = useState('');
  const [providerSuccess, setProviderSuccess] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [discoverView, setDiscoverView] = useState('list');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [providersError, setProvidersError] = useState('');

  const deferredSearch = useDeferredValue(providerSearch);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ? mapSessionUser(session.user) : null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      startTransition(() => {
        setCurrentUser(session?.user ? mapSessionUser(session.user) : null);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    fetchProviders();

    if (activeTab === 'bookings' || activeTab === 'dashboard') {
      fetchBookings();
    }

    if (activeTab === 'providers' || activeTab === 'settings' || activeTab === 'dashboard') {
      fetchMyProviderProfiles();
    }
  }, [activeTab, currentUser]);

  const filteredProviders = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesService =
        selectedService === 'all' || String(provider.serviceId) === String(selectedService);
      const matchesQuery =
        !query ||
        provider.name.toLowerCase().includes(query) ||
        provider.serviceName.toLowerCase().includes(query);

      return matchesService && matchesQuery;
    });
  }, [deferredSearch, providers, selectedService]);

  const dashboardStats = useMemo(() => {
    const totalSpend = bookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
    const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled').length;
    const averageRating =
      providers.length > 0
        ? providers.reduce((sum, provider) => sum + provider.rating, 0) / providers.length
        : 0;

    return {
      totalSpend,
      activeBookings,
      liveProviders: providers.length,
      averageRating,
    };
  }, [bookings, providers]);

  async function fetchServices() {
    const { data, error } = await supabase.from('services').select('id, name').order('name');
    if (error) {
      console.error('Failed to fetch services:', error);
      return;
    }

    setServices(data || []);
    setProviderForm((previous) => ({
      ...previous,
      serviceId: previous.serviceId || String(data?.[0]?.id || ''),
    }));
  }

  async function fetchProviders() {
    setProvidersLoading(true);
    setProvidersError('');

    try {
      const { data, error } = await supabase
        .from('providers')
        .select(
          `
            id,
            profile_id,
            service_id,
            rating,
            base_price,
            is_active,
            profiles ( full_name, avatar_url, location ),
            services ( id, name ),
            reviews ( rating )
          `,
        )
        .eq('is_active', true);

      console.log('[fetchProviders] raw data:', data, 'error:', error);

      if (error) {
        throw error;
      }

      const mapped = (data || []).map(mapProviderRow);
      console.log('[fetchProviders] mapped providers:', mapped);
      setProviders(mapped);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      setProvidersError(error.message || 'Failed to load providers');
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  }

  async function fetchBookings() {
    if (!currentUser?.id) {
      return;
    }

    setBookingsLoading(true);

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
          id,
          provider_id,
          slot_time,
          status,
          total_price,
          providers (
            id,
            profiles ( full_name ),
            services ( name )
          ),
          reviews ( id, rating, review_text )
        `,
      )
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch bookings:', error);
      setBookingsLoading(false);
      return;
    }

    const mapped = (data || []).map((booking) => ({
      ...booking,
      providerName: booking.providers?.profiles?.full_name || 'Service Professional',
      serviceName: booking.providers?.services?.name || 'Service',
      review: booking.reviews?.[0] || null,
    }));

    setBookings(mapped);
    setBookingsLoading(false);
  }

  async function fetchMyProviderProfiles() {
    if (!currentUser?.id) {
      return;
    }

    const { data, error } = await supabase
      .from('providers')
      .select(
        `
          id,
          profile_id,
          service_id,
          rating,
          base_price,
          is_active,
          services ( id, name ),
          reviews ( rating )
        `,
      )
      .eq('profile_id', currentUser.id)
      .order('id', { ascending: false });

    if (error) {
      console.error('Failed to fetch your provider profiles:', error);
      return;
    }

    setMyProviderProfiles((data || []).map((row) => ({
      ...mapProviderRow({
        ...row,
        profiles: { full_name: currentUser.name, location: DEFAULT_LOCATION },
      }),
    })));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setBookings([]);
    setProviders([]);
    setMyProviderProfiles([]);
  }

  async function handleProviderRegistration(event) {
    event.preventDefault();
    setProviderSaving(true);
    setProviderError('');
    setProviderSuccess('');

    try {
      const serviceId = Number(providerForm.serviceId);
      const price = Number(providerForm.price);
      const lat = Number(providerForm.lat);
      const lng = Number(providerForm.lng);

      if (!serviceId || !price) {
        throw new Error('Choose a service and a starting price.');
      }

      const location = { lat, lng };

      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: currentUser.id,
          full_name: currentUser.name,
          phone: currentUser.phone,
          role: 'provider',
          location,
        },
        { onConflict: 'id' },
      );

      if (profileError) {
        throw profileError;
      }

      const { error: providerRowError } = await supabase.from('providers').upsert(
        {
          profile_id: currentUser.id,
          service_id: serviceId,
          base_price: price,
          is_active: providerForm.isActive,
        },
        { onConflict: 'profile_id,service_id' },
      );

      if (providerRowError) {
        throw providerRowError;
      }

      setCurrentUser((previous) => ({ ...previous, role: 'provider' }));
      setProviderSuccess('Your professional profile is live and now visible in discovery.');
      await Promise.all([fetchProviders(), fetchMyProviderProfiles()]);
    } catch (error) {
      console.error('Provider registration failed:', error);
      setProviderError(error.message || 'Could not save your professional profile.');
    } finally {
      setProviderSaving(false);
    }
  }

  const settingsPanel = (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="panel">
      <div className="panel-head">
        <h2>Account Settings</h2>
      </div>
      <div className="settings-list">
        <div className="settings-item">
          <span className="settings-label">Full name</span>
          <strong>{currentUser?.name}</strong>
        </div>
        <div className="settings-item">
          <span className="settings-label">Phone</span>
          <strong>{currentUser?.phone}</strong>
        </div>
        <div className="settings-item">
          <span className="settings-label">Account role</span>
          <strong>{currentUser?.role}</strong>
        </div>
      </div>
    </motion.div>
  );

  if (!currentUser) {
    return <Auth onLogin={setCurrentUser} />;
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
            <h1>Welcome back, {currentUser.name.split(' ')[0]}</h1>
            <p>Book trusted pros, register your own service profile, and manage ratings in one place.</p>
          </div>

          <div className="topbar-right">
            <button className="icon-button with-dot">
              <Bell size={20} />
              <div className="dot" />
            </button>
            <div className="avatar">
              {currentUser.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)}
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
                <StatCard label="Total Spend" value={`₹${dashboardStats.totalSpend}`} icon={Wallet} trend={12.5} />
                <StatCard label="Active Bookings" value={dashboardStats.activeBookings} icon={Calendar} trend={8.2} />
                <StatCard label="Live Providers" value={dashboardStats.liveProviders} icon={Users} trend={6.4} />
                <StatCard
                  label="Avg. Rating"
                  value={dashboardStats.averageRating ? dashboardStats.averageRating.toFixed(1) : '0.0'}
                  icon={Star}
                  trend={4.8}
                />
              </div>

              <div className="content-grid">
                <section className="panel wide">
                  <div className="panel-head">
                    <h3>Top Recommended Pros</h3>
                    <button className="text-button" onClick={() => setActiveTab('discover')}>
                      View All
                    </button>
                  </div>
                  <div className="providers-grid">
                    {providers.slice(0, 4).map((provider) => (
                      <ProviderCard key={provider.id} provider={provider} onBook={setSelectedProvider} />
                    ))}
                  </div>
                </section>

                <aside className="panel">
                  <h3 className="live-title">Marketplace Highlights</h3>
                  <div className="feed-list">
                    <div className="feed-item">
                      <div className="feed-icon">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <p className="feed-text">
                          <strong>{providers.filter((provider) => /house/i.test(provider.serviceName)).length}</strong>
                          <span> househelp professionals currently listed</span>
                        </p>
                      </div>
                    </div>
                    <div className="feed-item">
                      <div className="feed-icon">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <p className="feed-text">
                          <strong>{myProviderProfiles.length}</strong>
                          <span> services linked to your professional profile</span>
                        </p>
                      </div>
                    </div>
                    <div className="feed-item">
                      <div className="feed-icon">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="feed-text">
                          <strong>{bookings.filter((booking) => booking.review).length}</strong>
                          <span> bookings already rated by you</span>
                        </p>
                      </div>
                    </div>
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
                      className={`toggle-btn ${discoverView === 'list' ? 'active' : ''}`}
                      onClick={() => setDiscoverView('list')}
                    >
                      List View
                    </button>
                    <button
                      className={`toggle-btn ${discoverView === 'map' ? 'active' : ''}`}
                      onClick={() => setDiscoverView('map')}
                    >
                      Map View
                    </button>
                  </div>
                </div>

                <div className="search-controls">
                  <div className="search-wrap">
                    <Search className="search-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name or service..."
                      className="search-input"
                      value={providerSearch}
                      onChange={(event) => setProviderSearch(event.target.value)}
                    />
                  </div>
                  <select
                    className="service-filter"
                    value={selectedService}
                    onChange={(event) => setSelectedService(event.target.value)}
                  >
                    <option value="all">All Services</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {providersLoading ? <p className="subtle-text">Loading professionals...</p> : null}

              <AnimatePresence mode="wait">
                {discoverView === 'list' ? (
                  <motion.div
                    key="discover-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="discover-grid"
                  >
                    {providersError ? (
                      <div className="empty-state">
                        <Wrench size={48} className="subtle-text" />
                        <p style={{ color: '#ef4444' }}>Error loading providers: {providersError}</p>
                      </div>
                    ) : filteredProviders.length === 0 ? (
                      <div className="empty-state">
                        <Wrench size={48} className="subtle-text" />
                        <p>No professionals match this search yet.</p>
                        {providers.length > 0 && selectedService !== 'all' && (
                          <button className="text-button" onClick={() => setSelectedService('all')} style={{ marginTop: 8 }}>
                            Clear filter to see all {providers.length} provider(s)
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredProviders.map((provider) => (
                        <ProviderCard key={provider.id} provider={provider} onBook={setSelectedProvider} />
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="discover-map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <MapView providers={filteredProviders} />
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
                    <p>You have no bookings yet.</p>
                    <button className="provider-cta" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setActiveTab('discover')}>
                      Browse Professionals
                    </button>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <div key={booking.id} className="booking-item booking-item-extended">
                      <div className="booking-info">
                        <h4>{booking.providerName}</h4>
                        <p>{booking.serviceName}</p>
                        <span className="subtle-text">
                          {booking.slot_time
                            ? new Date(booking.slot_time).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'Time TBD'}
                        </span>
                      </div>

                      <div className="booking-meta">
                        <span className={`status-chip ${booking.status}`}>{booking.status}</span>
                        <span className="provider-price">₹{booking.total_price}</span>
                        <button className="secondary-cta" onClick={() => setReviewBooking(booking)}>
                          {booking.review ? 'Edit Rating' : 'Rate Househelp'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'providers' && (
            <motion.div
              key="providers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="providers-tab"
            >
              <section className="panel">
                <div className="panel-head">
                  <h2>Register as a Househelp or Service Pro</h2>
                </div>

                <form className="provider-form" onSubmit={handleProviderRegistration}>
                  <div className="provider-form-grid">
                    <label className="provider-field">
                      <span>Service category</span>
                      <select
                        value={providerForm.serviceId}
                        onChange={(event) => setProviderForm((previous) => ({ ...previous, serviceId: event.target.value }))}
                      >
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="provider-field">
                      <span>Starting price (INR)</span>
                      <input
                        type="number"
                        min="100"
                        value={providerForm.price}
                        onChange={(event) => setProviderForm((previous) => ({ ...previous, price: event.target.value }))}
                      />
                    </label>

                    <label className="provider-field">
                      <span>Latitude</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={providerForm.lat}
                        onChange={(event) => setProviderForm((previous) => ({ ...previous, lat: event.target.value }))}
                      />
                    </label>

                    <label className="provider-field">
                      <span>Longitude</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={providerForm.lng}
                        onChange={(event) => setProviderForm((previous) => ({ ...previous, lng: event.target.value }))}
                      />
                    </label>
                  </div>

                  <label className="provider-checkbox">
                    <input
                      type="checkbox"
                      checked={providerForm.isActive}
                      onChange={(event) => setProviderForm((previous) => ({ ...previous, isActive: event.target.checked }))}
                    />
                    <span>Show this service in customer discovery right away</span>
                  </label>

                  {providerError && <div className="auth-error">{providerError}</div>}
                  {providerSuccess && <div className="provider-success">{providerSuccess}</div>}

                  <button type="submit" className="provider-cta provider-form-submit" disabled={providerSaving}>
                    {providerSaving ? 'Saving profile...' : 'Save Professional Profile'}
                  </button>
                </form>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h3>Your Registered Services</h3>
                </div>

                {myProviderProfiles.length === 0 ? (
                  <div className="empty-state compact">
                    <UserCog size={40} className="subtle-text" />
                    <p>You are not listed yet. Add your first househelp or service profile above.</p>
                  </div>
                ) : (
                  <div className="providers-grid">
                    {myProviderProfiles.map((provider) => (
                      <ProviderCard key={provider.id} provider={provider} onBook={setSelectedProvider} />
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {activeTab === 'settings' && <div key="settings">{settingsPanel}</div>}
        </AnimatePresence>

        <AnimatePresence>
          {selectedProvider && (
            <BookingModal
              provider={selectedProvider}
              onClose={() => setSelectedProvider(null)}
              onBookingSuccess={async () => {
                setSelectedProvider(null);
                setActiveTab('bookings');
                await fetchBookings();
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reviewBooking && (
            <ReviewModal
              booking={reviewBooking}
              onClose={() => setReviewBooking(null)}
              onSubmitted={async () => {
                setReviewBooking(null);
                await Promise.all([fetchBookings(), fetchProviders(), fetchMyProviderProfiles()]);
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
