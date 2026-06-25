import React, { useState, useCallback } from 'react';
import { paymentAPI } from '../api';
import toast from 'react-hot-toast';
import { CreditCard, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// ─── SERVICE LABELS ─────────────────────────────────────────────
const SERVICE_LABELS = {
  ELECTRICIAN: 'Electrician', PLUMBER: 'Plumber', AC_REPAIR: 'AC Repair',
  CARPENTER: 'Carpenter', PAINTER: 'Painter', CLEANER: 'Cleaner',
  APPLIANCE_REPAIR: 'Appliance Repair', PEST_CONTROL: 'Pest Control',
  TAILORING: 'Tailoring', NETWORKING_TECH: 'Networking', BEAUTICIAN: 'Beautician',
  MEHANDI_SERVICES: 'Mehandi', GENERAL_HELPER: 'General Helper',
};

// ─── LOAD RAZORPAY SCRIPT ONCE ───────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-sdk')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── COMPONENT ───────────────────────────────────────────────────
export default function PaymentModal({ request, onClose, onPaymentSuccess }) {
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState(null);

  const handlePay = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Load Razorpay checkout SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) throw new Error('Failed to load Razorpay checkout. Check your internet connection.');

      // 2. Create order on backend
      const { data: order } = await paymentAPI.createOrder(request.id);

      // 3. Open Razorpay checkout widget
      const options = {
        key:          order.keyId,
        amount:       order.amount,      // paise
        currency:     order.currency,
        order_id:     order.razorpayOrderId,
        name:         'RapidFix',
        description:  order.description || `${SERVICE_LABELS[request.serviceType] || request.serviceType} Service`,
        image:        '', // optional logo URL
        prefill: {
          name:  order.userName || '',
          email: '',
          contact: '',
        },
        theme: { color: '#6c63ff' },
        handler: async (response) => {
          // Razorpay checkout succeeded — verify signature on the backend to mark job PAID
          try {
            await paymentAPI.verify(
              request.id,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
          } catch (err) {
            // Verification failed — warn but still show success (webhook will retry)
            console.warn('Payment verify call failed:', err?.response?.data?.message || err.message);
          }
          setSuccess(true);
          setLoading(false);
          toast.success('🎉 Payment successful! Thank you.');
          if (onPaymentSuccess) onPaymentSuccess(request.id, response);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast('Payment cancelled.', { icon: '⚠️' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setLoading(false);
        setError('Payment failed: ' + (response.error?.description || 'Unknown error'));
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();

    } catch (err) {
      setLoading(false);
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong';
      setError(msg);
      toast.error(msg);
    }
  }, [request, onPaymentSuccess]);

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconWrap}>
              <CreditCard size={22} color="#6c63ff" />
            </div>
            <span style={styles.title}>Complete Payment</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose} id="payment-modal-close">
            <X size={20} />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div style={styles.successBox}>
            <CheckCircle size={56} color="#10b981" />
            <h3 style={styles.successTitle}>Payment Successful!</h3>
            <p style={styles.successSub}>Your payment has been confirmed. Thank you for using RapidFix!</p>
            <button style={styles.doneBtn} onClick={onClose} id="payment-done-btn">Done</button>
          </div>
        ) : (
          <>
            {/* Job Summary */}
            <div style={styles.summary}>
              <SummaryRow label="Service"    value={SERVICE_LABELS[request.serviceType] || request.serviceType} />
              <SummaryRow label="Technician" value={request.technicianName || '—'} />
              <SummaryRow label="Status"     value={request.status} />
              <div style={styles.divider} />
              <SummaryRow
                label="Amount Due"
                value={`₹${(request.finalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                highlight
              />
            </div>

            {/* Error */}
            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Pay button */}
            <button
              id="payment-pay-btn"
              style={{ ...styles.payBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? (
                <><Loader size={18} style={styles.spin} /> Opening Razorpay…</>
              ) : (
                <><CreditCard size={18} /> Pay ₹{(request.finalAmount || 0).toLocaleString('en-IN')}</>
              )}
            </button>

            <p style={styles.note}>
              🔒 Secured by <strong>Razorpay</strong> · UPI · Cards · Netbanking
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SUMMARY ROW SUB-COMPONENT ───────────────────────────────────
function SummaryRow({ label, value, highlight }) {
  return (
    <div style={styles.summaryRow}>
      <span style={styles.summaryLabel}>{label}</span>
      <span style={{ ...styles.summaryValue, ...(highlight ? styles.summaryHighlight : {}) }}>
        {value}
      </span>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  modal: {
    background: 'var(--bg2, #1e1e2e)', border: '1px solid var(--border, rgba(255,255,255,0.08))',
    borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
    animation: 'slideUp 0.25s ease',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '24px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  iconWrap: {
    width: '40px', height: '40px', borderRadius: '12px',
    background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: '18px', fontWeight: 700, color: 'var(--text, #e2e8f0)' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text2, #94a3b8)', padding: '4px', borderRadius: '8px',
    display: 'flex', alignItems: 'center',
    transition: 'color 0.2s',
  },
  summary: {
    background: 'var(--bg, #12121e)', borderRadius: '14px',
    padding: '20px', marginBottom: '20px',
    border: '1px solid var(--border, rgba(255,255,255,0.06))',
  },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '12px',
  },
  summaryLabel: { fontSize: '13px', color: 'var(--text2, #94a3b8)' },
  summaryValue: { fontSize: '14px', fontWeight: 600, color: 'var(--text, #e2e8f0)' },
  summaryHighlight: { fontSize: '20px', fontWeight: 800, color: '#6c63ff' },
  divider: { height: '1px', background: 'var(--border, rgba(255,255,255,0.06))', margin: '12px 0' },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
    color: '#ef4444', fontSize: '13px',
  },
  payBtn: {
    width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
    background: 'linear-gradient(135deg, #6c63ff 0%, #a855f7 100%)',
    color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    transition: 'opacity 0.2s, transform 0.15s',
    boxShadow: '0 8px 24px rgba(108,99,255,0.35)',
  },
  spin: { animation: 'spin 1s linear infinite' },
  note: {
    textAlign: 'center', fontSize: '12px', color: 'var(--text2, #94a3b8)',
    marginTop: '14px', marginBottom: 0,
  },
  successBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '8px 0 16px',
  },
  successTitle: { fontSize: '22px', fontWeight: 800, color: '#10b981', margin: '16px 0 8px' },
  successSub: { fontSize: '14px', color: 'var(--text2, #94a3b8)', marginBottom: '24px' },
  doneBtn: {
    padding: '12px 40px', borderRadius: '12px', border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
  },
};
