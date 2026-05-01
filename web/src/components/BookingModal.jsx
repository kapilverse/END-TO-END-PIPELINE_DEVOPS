import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CreditCard, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './BookingModal.css';

const BookingModal = ({ provider, onClose, onBookingSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  const slots = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'];

  const handleNext = () => {
    if (step === 1 && selectedDate && selectedSlot) {
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error('You must be logged in to book a service.');
      }

      // Build an ISO timestamp from the selected date + slot
      const slotDateTime = new Date(`${selectedDate} ${selectedSlot}`).toISOString();
      const totalPrice = (provider.price || 0) + 49; // base price + platform fee

      const { error } = await supabase.from('bookings').insert({
        user_id: userId,
        provider_id: provider.id,
        slot_time: slotDateTime,
        status: 'pending',
        total_price: totalPrice,
      });

      if (error) throw error;

      // Short delay for the payment animation, then show success
      await new Promise(r => setTimeout(r, 1500));
      setStep(3);
      setTimeout(() => {
        onBookingSuccess();
      }, 3000);
    } catch (err) {
      console.error('Booking failed:', err.message);
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="booking-modal"
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        
        <div className="modal-header">
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
          <h3>{step === 3 ? 'Booking Confirmed!' : `Book ${provider.name}`}</h3>
        </div>

        <div className="modal-body">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking-step"
              >
                <div className="form-section">
                  <label><Calendar size={18} /> Select Date</label>
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="form-section">
                  <label><Clock size={18} /> Select Time Slot</label>
                  <div className="slots-grid">
                    {slots.map(slot => (
                      <button 
                        key={slot}
                        className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  className="next-btn" 
                  disabled={!selectedDate || !selectedSlot}
                  onClick={handleNext}
                >
                  Next: Payment <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking-step"
              >
                <div className="summary-card">
                  <div className="summary-item">
                    <span>Service Price</span>
                    <span>₹{provider.price}</span>
                  </div>
                  <div className="summary-item">
                    <span>Platform Fee</span>
                    <span>₹49</span>
                  </div>
                  <div className="summary-item total">
                    <span>Total Amount</span>
                    <span>₹{provider.price + 49}</span>
                  </div>
                </div>
                <div className="payment-simulation">
                  <CreditCard size={48} className="payment-icon" />
                  <p>Secure payment via UrbanPay</p>
                </div>
                {error && <p className="auth-error" style={{marginBottom: '12px'}}>{error}</p>}
                <button 
                  className="confirm-btn" 
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="spinner" /> : 'Pay & Confirm Booking'}
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="booking-success"
              >
                <CheckCircle size={80} className="success-icon" />
                <h4>You're all set!</h4>
                <p>{provider.name} will arrive on <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong>.</p>
                <div className="success-footer">
                  Redirecting to dashboard...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingModal;
