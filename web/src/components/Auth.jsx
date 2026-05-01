import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, Phone, User, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Auth.css';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    name: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSignupSuccess(false);

    try {
      const sanitizedPhone = formData.phone.replace(/\s+/g, '');
      const email = `${sanitizedPhone}@urbanpulse.com`;

      if (isLogin) {
        // ── Supabase Login ──────────────────────────────────────────────────
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: formData.password,
        });

        if (authError) throw authError;

        onLogin({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || sanitizedPhone,
          phone: formData.phone,
          role: data.user.user_metadata?.role || 'user',
          token: data.session.access_token,
        });
      } else {
        // ── Supabase Signup ─────────────────────────────────────────────────
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              role: formData.role,
              phone: sanitizedPhone,
            },
          },
        });

        if (authError) throw authError;

        // If identities is empty, the email is already registered
        if (data?.user?.identities?.length === 0) {
          throw new Error('This phone number is already registered. Please log in instead.');
        }

        // Show success — ask user to verify email or log in
        setSignupSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Signup success screen ────────────────────────────────────────────────────
  if (signupSuccess) {
    return (
      <div className="auth-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-card"
        >
          <div className="auth-header">
            <div className="brand-icon large">
              <Zap size={32} />
            </div>
            <h2>Account Created!</h2>
            <p>
              If email confirmation is required, check your inbox and click the
              verification link. Otherwise you can sign in right now.
            </p>
          </div>
          <button
            className="auth-submit"
            onClick={() => { setSignupSuccess(false); setIsLogin(true); }}
          >
            Go to Sign In <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card"
      >
        <div className="auth-header">
          <div className="brand-icon large">
            <Zap size={32} />
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Login to manage your services' : 'Join the elite service marketplace'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="form-group"
              >
                <label><User size={16} /> Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="role"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="form-group"
              >
                <label>Account Type</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="auth-select"
                >
                  <option value="user">Customer</option>
                  <option value="provider">Househelp / Service Professional</option>
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="form-group">
            <label><Phone size={16} /> Phone Number</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label><Lock size={16} /> Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Get Started')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>Don't have an account? <button onClick={() => setIsLogin(false)}>Sign Up</button></p>
          ) : (
            <p>Already have an account? <button onClick={() => setIsLogin(true)}>Sign In</button></p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
