import React, { useState } from 'react';
import { loadStripe }       from '@stripe/stripe-js';
import {
  Elements, CardElement, useStripe, useElements,
} from '@stripe/react-stripe-js';
import { createPaymentIntent, confirmPayment } from '../services/paymentService';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

//Inner checkout form 
function CheckoutForm({ course, onSuccess, onClose }) {
  const stripe   = useStripe();
  const elements = useElements();

  const [step, setStep]         = useState('idle'); // idle | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStep('processing');
    setErrorMsg('');

    try {
      // Step 1: Create PaymentIntent on backend 
      const { clientSecret } = await createPaymentIntent(course._id);

      // Step 2: Confirm payment with Stripe.js (card never hits your server)
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setStep('error');
        return;
      }

      // Step 3: Tell backend — it verifies with Stripe & creates enrollment
      const result = await confirmPayment(paymentIntent.id);

      setStep('success');
      setTimeout(() => onSuccess(result.enrollmentId), 1200);

    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Payment failed. Please try again.');
      setStep('error');
    }
  };

  //  Success state 
  if (step === 'success') {
    return (
      <div style={styles.successBox}>
        <div style={styles.successIcon}>✓</div>
        <h3 style={styles.successTitle}>Payment Successful!</h3>
        <p style={styles.successSub}>
          You are now enrolled in <strong>{course.title}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Course info */}
      <div style={styles.courseInfo}>
        <p style={styles.courseLabel}>Enrolling in</p>
        <h3 style={styles.courseTitle}>{course.title}</h3>
        <p style={styles.price}>${parseFloat(course.price).toFixed(2)} <span style={styles.currency}>USD</span></p>
      </div>

      <div style={styles.divider} />

      {/* Card input */}
      <div style={styles.cardSection}>
        <label style={styles.cardLabel}>Card Details</label>
        <div style={styles.cardWrapper}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '15px',
                  color: '#1a2b3c',
                  fontFamily: "'DM Sans', sans-serif",
                  '::placeholder': { color: '#aab7c4' },
                },
                invalid: { color: '#e74c3c' },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {/* Error */}
      {step === 'error' && errorMsg && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠</span> {errorMsg}
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button type="button" onClick={onClose} style={styles.cancelBtn}
          disabled={step === 'processing'}>
          Cancel
        </button>
        <button type="submit" style={{
          ...styles.payBtn,
          opacity: (!stripe || step === 'processing') ? 0.7 : 1,
          cursor:  (!stripe || step === 'processing') ? 'not-allowed' : 'pointer',
        }} disabled={!stripe || step === 'processing'}>
          {step === 'processing' ? (
            <span style={styles.loadingRow}>
              <span style={styles.spinner} />
              Processing…
            </span>
          ) : (
            `Pay $${parseFloat(course.price).toFixed(2)}`
          )}
        </button>
      </div>

      <p style={styles.secureNote}>Secured by Stripe — your card details are never stored</p>
    </form>
  );
}

// Public component 
export default function PaymentModal({ course, onSuccess, onClose }) {
  return (
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Complete Payment</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm course={course} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </div>
    </div>
  );
}

// Styles
const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  },
  modal: {
    background: '#fff', borderRadius: '20px',
    width: '100%', maxWidth: '460px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #00b4b4, #007a7a)',
    padding: '20px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { margin: 0, color: '#fff', fontSize: '18px', fontWeight: '700' },
  closeBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none',
    color: '#fff', width: '32px', height: '32px',
    borderRadius: '50%', cursor: 'pointer', fontSize: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  form: { display: 'flex', flexDirection: 'column', gap: 0, padding: '24px' },

  courseInfo: { marginBottom: '20px' },
  courseLabel: { margin: '0 0 4px', fontSize: '11px', color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' },
  courseTitle: { margin: '0 0 8px', fontSize: '17px', fontWeight: '700', color: '#1a2b3c' },
  price: { margin: 0, fontSize: '28px', fontWeight: '800', color: '#00b4b4' },
  currency: { fontSize: '14px', color: '#999', fontWeight: '500' },

  divider: { height: '1px', background: '#f0f0f0', margin: '0 0 20px' },

  cardSection: { marginBottom: '20px' },
  cardLabel: { display: 'block', fontSize: '12px', fontWeight: '700', color: '#4a7070', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' },
  cardWrapper: {
    border: '1.5px solid #d4e8e8', borderRadius: '12px',
    padding: '14px 16px', background: '#f8fdfd',
    transition: 'border-color 0.2s',
  },
  testHint: { margin: '8px 0 0', fontSize: '11px', color: '#aaa' },
  code: { background: '#f0f0f0', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' },

  errorBox: {
    background: '#fef0ef', border: '1px solid #f5c6c2',
    borderRadius: '10px', padding: '10px 14px',
    color: '#c0392b', fontSize: '13px', fontWeight: '500',
    marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
  },
  errorIcon: { fontSize: '16px' },

  actions: { display: 'flex', gap: '12px', marginBottom: '12px' },
  cancelBtn: {
    flex: 1, padding: '13px',
    background: '#f0f5f5', color: '#4a7070',
    border: 'none', borderRadius: '12px',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'background 0.2s',
  },
  payBtn: {
    flex: 2, padding: '13px',
    background: 'linear-gradient(135deg, #00b4b4, #007a7a)',
    color: '#fff', border: 'none', borderRadius: '12px',
    fontSize: '15px', fontWeight: '700',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  loadingRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  spinner: {
    width: '16px', height: '16px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },

  secureNote: { textAlign: 'center', fontSize: '11px', color: '#aaa', margin: 0 },

  // Success state
  successBox: {
    padding: '40px 24px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  },
  successIcon: {
    width: '64px', height: '64px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #00b4b4, #007a7a)',
    color: '#fff', fontSize: '30px', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0,180,180,0.3)',
  },
  successTitle: { margin: 0, fontSize: '22px', fontWeight: '700', color: '#0d2626' },
  successSub: { margin: 0, fontSize: '14px', color: '#7f9999' },
};
