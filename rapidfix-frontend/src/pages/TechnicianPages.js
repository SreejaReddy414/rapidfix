import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { techAPI, dispatchAPI } from '../api';
import { LoadingScreen, Input } from '../components/UI';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import JobMap from '../components/JobMap';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, PlayCircle, MapPin, Star,
  RefreshCw, ToggleLeft, ToggleRight, AlertCircle,
  Clock, FileText, Send, Navigation, ChevronLeft, ChevronRight,
  Briefcase, TrendingUp, Zap, Activity, Wrench, Search,
} from 'lucide-react';

const SERVICE_TYPES = ['ELECTRICIAN','PLUMBER','AC_REPAIR','CARPENTER','PAINTER','CLEANER','APPLIANCE_REPAIR','PEST_CONTROL'];
const PAGE_SIZE = 5;

// ─── SERVICE META ─────────────────────────────────────────────
const SERVICE_META = {
  ELECTRICIAN:     { icon: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  PLUMBER:         { icon: '🔧', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  AC_REPAIR:       { icon: '❄️', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
  CARPENTER:       { icon: '🪚', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)'},
  PAINTER:         { icon: '🎨', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  CLEANER:         { icon: '🧹', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  APPLIANCE_REPAIR:{ icon: '🔌', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  PEST_CONTROL:    { icon: '🐛', color: '#84cc16', bg: 'rgba(132,204,22,0.12)' },
};

// ─── STATUS META ──────────────────────────────────────────────
const STATUS_META = {
  PENDING:     { label: 'Pending',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  QUOTED:      { label: 'Quoted',      color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  APPROVED:    { label: 'Approved',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  IN_PROGRESS: { label: 'In Progress', color: '#ff6b2b', bg: 'rgba(255,107,43,0.1)'  },
  COMPLETED:   { label: 'Completed',   color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  CANCELLED:   { label: 'Cancelled',   color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

// ─── HELPERS ──────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2
      + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── PAGE LAYOUT ─────────────────────────────────────────────
function PageLayout({ children }) {
  return (
      <>
        <Navbar />
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
          {children}
        </main>
      </>
  );
}

// ─── STATUS PILL ─────────────────────────────────────────────
function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status, color: 'var(--text2)', bg: 'var(--bg3)' };
  return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        background: meta.bg, color: meta.color,
        border: `1px solid ${meta.color}30`,
      }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: meta.color,
        boxShadow: `0 0 6px ${meta.color}`,
        animation: ['APPROVED','IN_PROGRESS'].includes(status) ? 'pulse 2s ease-in-out infinite' : 'none',
      }} />
        {meta.label}
    </span>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({ label, value, color, icon, sub }) {
  return (
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
           onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}20`; e.currentTarget.style.borderColor = color + '40'; }}
           onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <div style={{
          position: 'absolute', top: -20, right: -20, width: 80, height: 80,
          borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(20px)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '30px', fontFamily: 'var(--font-head)', fontWeight: 800, color, lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px', fontWeight: 500 }}>{label}</div>
            {sub && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>{sub}</div>}
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: '10px',
            background: color + '18', border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color,
          }}>
            {icon}
          </div>
        </div>
      </div>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '28px' }}>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0} style={{
          width: 36, height: 36, borderRadius: '10px', border: '1px solid var(--border)',
          background: 'var(--bg2)', color: currentPage === 0 ? 'var(--text3)' : 'var(--text2)',
          cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}>
          <ChevronLeft size={15} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => onPageChange(i)} style={{
              width: 36, height: 36, borderRadius: '10px', border: '1px solid',
              borderColor: i === currentPage ? 'var(--accent)' : 'var(--border)',
              background: i === currentPage ? 'var(--accent)' : 'var(--bg2)',
              color: i === currentPage ? '#fff' : 'var(--text2)',
              cursor: 'pointer', fontSize: '13px', fontWeight: i === currentPage ? 700 : 400,
              fontFamily: 'var(--font)', transition: 'all 0.2s ease',
              boxShadow: i === currentPage ? '0 4px 12px rgba(255,107,43,0.35)' : 'none',
            }}>{i + 1}</button>
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} style={{
          width: 36, height: 36, borderRadius: '10px', border: '1px solid var(--border)',
          background: 'var(--bg2)', color: currentPage === totalPages - 1 ? 'var(--text3)' : 'var(--text2)',
          cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}>
          <ChevronRight size={15} />
        </button>
      </div>
  );
}

// ─── QUOTE MODAL ─────────────────────────────────────────────
function QuoteModal({ job, onClose, onDone }) {
  const [form, setForm] = useState({ hourlyRate: '', estimatedHours: '', applianceCharge: '0', quoteNote: '' });
  const [loading, setLoading] = useState(false);

  const distKm = job.distanceKm || 0;
  const travelCharge = Math.max(0, distKm - 3.0) * 12.0;
  const laborCost = form.hourlyRate && form.estimatedHours
      ? parseFloat(form.hourlyRate) * parseFloat(form.estimatedHours) : null;
  const grandTotal = laborCost !== null
      ? laborCost + parseFloat(form.applianceCharge || 0) + travelCharge : null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatchAPI.submitQuote(job.id, {
        hourlyRate:      parseFloat(form.hourlyRate),
        estimatedHours:  parseFloat(form.estimatedHours),
        applianceCharge: parseFloat(form.applianceCharge || 0),
        quoteNote:       form.quoteNote,
        technicianPhone: job.technicianPhone || '',
      });
      toast.success('Quote submitted! Waiting for customer approval.');
      onDone(); onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit quote');
    } finally { setLoading(false); }
  };

  const fieldStyle = {
    width: '100%', padding: '10px 14px',
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '10px', color: 'var(--text)', fontSize: '14px',
    fontFamily: 'var(--font)', outline: 'none', transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  };

  return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }} onClick={onClose}>
        <div style={{
          width: '100%', maxWidth: '460px',
          background: 'var(--bg2)', borderRadius: '20px',
          border: '1px solid var(--border2)', padding: '32px',
          animation: 'fadeUp 0.3s ease',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: 42, height: 42, borderRadius: '12px',
                background: 'rgba(255,107,43,0.12)', border: '1px solid rgba(255,107,43,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={18} color="var(--accent)" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
                Submit Quote
              </h2>
            </div>
            <p style={{ color: 'var(--text3)', fontSize: '13px', paddingLeft: '54px' }}>
              <strong style={{ color: 'var(--text2)' }}>{job.serviceType?.replace(/_/g,' ')}</strong>
              {' · '}{job.address}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hourly Rate (₹)</label>
                <input style={fieldStyle} type="number" min="1" placeholder="e.g. 150"
                       value={form.hourlyRate} onChange={e => setForm(p => ({ ...p, hourlyRate: e.target.value }))}
                       onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                       onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est. Hours</label>
                <input style={fieldStyle} type="number" min="0.5" step="0.5" placeholder="e.g. 2"
                       value={form.estimatedHours} onChange={e => setForm(p => ({ ...p, estimatedHours: e.target.value }))}
                       onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                       onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Parts / Appliance Charge (₹)</label>
              <input style={fieldStyle} type="number" min="0" placeholder="0 if no parts needed"
                     value={form.applianceCharge} onChange={e => setForm(p => ({ ...p, applianceCharge: e.target.value }))}
                     onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                     onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes for Customer</label>
              <textarea placeholder="Describe the issue and what parts may be needed..."
                        value={form.quoteNote} onChange={e => setForm(p => ({ ...p, quoteNote: e.target.value }))}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        style={{ ...fieldStyle, minHeight: '80px', resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {/* Live total preview */}
            {grandTotal !== null && (
                <div style={{
                  padding: '14px 16px', background: 'rgba(255,107,43,0.06)',
                  borderRadius: '12px', border: '1px solid rgba(255,107,43,0.25)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Quote Preview
                  </div>
                  {[
                    [`${form.estimatedHours}hrs × ₹${form.hourlyRate}/hr`, `₹${laborCost.toFixed(0)}`],
                    ['Parts / Appliances', `₹${parseFloat(form.applianceCharge || 0).toFixed(0)}`],
                    [`Travel (${distKm.toFixed(1)}km)${travelCharge === 0 ? ' — Free ≤3km' : ''}`,
                      travelCharge === 0 ? 'FREE' : `₹${travelCharge.toFixed(0)}`],
                  ].map(([label, val], i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text3)' }}>{label}</span>
                        <span style={{ color: val === 'FREE' ? '#10b981' : 'var(--text)', fontWeight: 500 }}>{val}</span>
                      </div>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,107,43,0.2)', paddingTop: '10px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '16px' }}>
                    <span style={{ color: 'var(--text2)' }}>Total Quote</span>
                    <span style={{ color: 'var(--accent)' }}>₹{grandTotal.toFixed(0)}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
                    * Travel charge auto-calculated based on your distance from customer
                  </p>
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button type="button" onClick={onClose} style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text2)', cursor: 'pointer', fontSize: '14px',
                fontFamily: 'var(--font)', transition: 'all 0.2s ease',
              }}>Cancel</button>
              <button type="submit" disabled={loading} style={{
                flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                background: 'var(--accent)', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font)',
                opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 20px rgba(255,107,43,0.35)', transition: 'all 0.2s ease',
              }}>
                <Send size={14} /> Send Quote
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

// ─── COMPLETE MODAL ───────────────────────────────────────────
function CompleteModal({ job, onClose, onDone }) {
  const [actualHours,     setActualHours]     = useState(job.estimatedHours || '');
  const [applianceCharge, setApplianceCharge] = useState('');
  const [completionNote,  setCompletionNote]  = useState('');
  const [loading,         setLoading]         = useState(false);

  const travelCharge = job.travelCharge || 0;
  const finalAmt = actualHours && applianceCharge !== ''
      ? (parseFloat(job.hourlyRate) * parseFloat(actualHours)) + parseFloat(applianceCharge) + travelCharge
      : null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatchAPI.complete(job.id, {
        actualHours:           parseFloat(actualHours),
        actualApplianceCharge: parseFloat(applianceCharge || 0),
        completionNote,
      });
      toast.success('Job marked complete! 🎉');
      onDone(); onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to complete job');
    } finally { setLoading(false); }
  };

  const fieldStyle = {
    width: '100%', padding: '10px 14px',
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '10px', color: 'var(--text)', fontSize: '14px',
    fontFamily: 'var(--font)', outline: 'none', transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  };

  return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }} onClick={onClose}>
        <div style={{
          width: '100%', maxWidth: '440px',
          background: 'var(--bg2)', borderRadius: '20px',
          border: '1px solid var(--border2)', padding: '32px',
          animation: 'fadeUp 0.3s ease',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }} onClick={e => e.stopPropagation()}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: 42, height: 42, borderRadius: '12px',
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={18} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                Complete Job
              </h2>
              <p style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '4px' }}>
                Enter actual details after finishing the work
              </p>
            </div>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Actual Hours Worked
              </label>
              <input style={fieldStyle} type="number" min="0.5" step="0.5"
                     placeholder={`Estimated was ${job.estimatedHours}hrs`}
                     value={actualHours} onChange={e => setActualHours(e.target.value)}
                     onFocus={e => e.target.style.borderColor = '#10b981'}
                     onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Actual Parts / Appliance Charge (₹)
              </label>
              <input style={fieldStyle} type="number" min="0" step="0.01"
                     placeholder={`Estimated was ₹${job.applianceCharge} — enter actual`}
                     value={applianceCharge} onChange={e => setApplianceCharge(e.target.value)}
                     onFocus={e => e.target.style.borderColor = '#10b981'}
                     onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
              {applianceCharge !== '' && parseFloat(applianceCharge) !== job.applianceCharge && (
                  <span style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚠️ Differs from estimated ₹{job.applianceCharge}
              </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Work Summary
              </label>
              <textarea placeholder="What did you fix / replace?"
                        value={completionNote} onChange={e => setCompletionNote(e.target.value)}
                        onFocus={e => e.target.style.borderColor = '#10b981'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        style={{ ...fieldStyle, minHeight: '70px', resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {/* Final amount preview */}
            {finalAmt !== null && (
                <div style={{
                  padding: '14px 16px', background: 'rgba(16,185,129,0.06)',
                  borderRadius: '12px', border: '1px solid rgba(16,185,129,0.25)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Final Bill Preview
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text3)' }}>{actualHours}hrs × ₹{job.hourlyRate}/hr</span>
                    <span>₹{(parseFloat(job.hourlyRate) * parseFloat(actualHours)).toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text3)' }}>Actual Parts / Appliances</span>
                    <span>₹{parseFloat(applianceCharge).toFixed(0)}</span>
                  </div>
                  {travelCharge > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} /> Travel ({job.distanceKm?.toFixed(1)}km)
                  </span>
                        <span>₹{travelCharge.toFixed(0)}</span>
                      </div>
                  )}
                  {travelCharge === 0 && job.distanceKm > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} /> Travel ({job.distanceKm?.toFixed(1)}km)
                  </span>
                        <span style={{ color: '#10b981' }}>FREE</span>
                      </div>
                  )}
                  <div style={{ borderTop: '1px solid rgba(16,185,129,0.2)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '16px' }}>
                    <span style={{ color: 'var(--text2)' }}>Final Amount</span>
                    <span style={{ color: '#10b981' }}>₹{finalAmt.toFixed(0)}</span>
                  </div>
                  {job.totalAmount && finalAmt !== job.totalAmount && (
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>
                        Quoted estimate was ₹{job.totalAmount?.toFixed(0)}
                        {finalAmt > job.totalAmount
                            ? ` (+₹${(finalAmt - job.totalAmount).toFixed(0)} over)`
                            : ` (-₹${(job.totalAmount - finalAmt).toFixed(0)} under)`}
                      </div>
                  )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button type="button" onClick={onClose} style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text2)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font)',
                transition: 'all 0.2s ease',
              }}>Cancel</button>
              <button type="submit" disabled={loading} style={{
                flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                background: '#10b981', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font)',
                opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 20px rgba(16,185,129,0.35)', transition: 'all 0.2s ease',
              }}>
                <CheckCircle size={14} /> Mark Complete
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

// ─── JOB CARD ─────────────────────────────────────────────────
function JobCard({ job, mode, onRefresh, techProfile }) {
  const [loading,      setLoading]      = useState('');
  const [showQuote,    setShowQuote]    = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showMap,      setShowMap]      = useState(false);

  const meta = SERVICE_META[job.serviceType] || { icon: '🔨', color: 'var(--accent)', bg: 'var(--accentbg)' };

  // GPS broadcast for active jobs
  useEffect(() => {
    if (!['APPROVED', 'IN_PROGRESS'].includes(job.status) || !techProfile?.id) return;
    const send = () => navigator.geolocation.getCurrentPosition(
        pos => techAPI.updateLocation(techProfile.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }).catch(() => {}),
        () => {}
    );
    send();
    const iv = setInterval(send, 30000);
    return () => clearInterval(iv);
  }, [job.status, techProfile?.id]);

  const action = async (fn, label, successMsg) => {
    setLoading(label);
    try { await fn(job.id); toast.success(successMsg); onRefresh(); }
    catch (e) { toast.error(e.response?.data?.message || 'Action failed'); }
    finally { setLoading(''); }
  };

  // Distance badge for browse mode
  const distBadge = mode === 'browse' && job.userLatitude && techProfile?.latitude
      ? (() => {
        const d = haversine(techProfile.latitude, techProfile.longitude, job.userLatitude, job.userLongitude);
        const eta = Math.round((d / 30) * 60);
        return { km: d.toFixed(1), eta };
      })()
      : null;

  const canShowMap = ['APPROVED', 'IN_PROGRESS'].includes(job.status) && job.userLatitude;

  return (
      <>
        <div style={{
          background: 'var(--bg2)', borderRadius: '16px',
          border: '1px solid var(--border)', overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}
             onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color + '40'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${meta.color}10`; }}
             onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {/* Accent bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}00)` }} />

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: meta.bg, border: `1px solid ${meta.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', flexShrink: 0,
                }}>
                  {meta.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', lineHeight: 1.2 }}>
                    {job.serviceType?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>
                    {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <StatusPill status={job.status} />
            </div>

            {/* Description */}
            <p style={{
              fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, margin: 0,
              padding: '12px 14px', background: 'var(--bg3)', borderRadius: '10px',
              borderLeft: `3px solid ${meta.color}40`,
            }}>
              {job.description}
            </p>

            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text3)' }}>
              <MapPin size={12} color={meta.color} /> {job.address}
            </div>

            {/* Distance badge — browse mode */}
            {distBadge && (
                <div style={{
                  display: 'flex', gap: '10px', padding: '10px 14px',
                  background: 'rgba(59,130,246,0.08)', borderRadius: '10px',
                  border: '1px solid rgba(59,130,246,0.2)', fontSize: '12px',
                }}>
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                📍 {distBadge.km} km away
              </span>
                  <span style={{ color: 'var(--text3)' }}>·</span>
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                ⏱️ ~{distBadge.eta} min ETA
              </span>
                </div>
            )}

            {/* Customer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 14px', background: 'var(--bg3)', borderRadius: '10px', fontSize: '13px',
            }}>
              <span style={{ color: 'var(--text3)' }}>Customer</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{job.userName}</span>
            </div>

            {/* Quote summary — after quote submitted */}
            {job.status !== 'PENDING' && job.totalAmount && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'var(--bg3)', borderRadius: '10px', fontSize: '13px',
                }}>
              <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={11} /> {job.estimatedHours}hrs × ₹{job.hourlyRate} + ₹{job.applianceCharge} parts
              </span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{job.totalAmount?.toFixed(0)}</span>
                </div>
            )}

            {/* Final amount — completed */}
            {job.status === 'COMPLETED' && job.finalAmount && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', background: 'rgba(16,185,129,0.06)',
                  borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '13px', fontWeight: 600,
                }}>
                  <span style={{ color: 'var(--text2)' }}>Final Amount Charged</span>
                  <span style={{ color: '#10b981', fontSize: '15px' }}>₹{job.finalAmount?.toFixed(0)}</span>
                </div>
            )}

            {/* Map toggle */}
            {canShowMap && (
                <div>
                  <button onClick={() => setShowMap(v => !v)} style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    background: showMap ? 'rgba(59,130,246,0.08)' : 'var(--bg3)',
                    border: `1px solid ${showMap ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                    borderRadius: '10px', padding: '8px 14px',
                    color: showMap ? '#3b82f6' : 'var(--text2)', cursor: 'pointer',
                    fontSize: '13px', fontFamily: 'var(--font)', fontWeight: 500,
                    marginBottom: showMap ? '10px' : 0, transition: 'all 0.2s ease',
                  }}>
                    <Navigation size={13} />
                    {showMap ? 'Hide Map' : 'Show Map & Navigate'}
                  </button>
                  {showMap && (
                      <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
                        <JobMap userLat={job.userLatitude} userLon={job.userLongitude}
                                techLat={techProfile?.latitude} techLon={techProfile?.longitude} address={job.address} />
                      </div>
                  )}
                </div>
            )}

            {/* Browse mode action */}
            {mode === 'browse' && job.status === 'PENDING' && (
                <button onClick={() => setShowQuote(true)} style={{
                  width: '100%', padding: '11px', borderRadius: '12px', border: 'none',
                  background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 16px rgba(255,107,43,0.3)', transition: 'all 0.2s ease',
                }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,107,43,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,107,43,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <FileText size={14} /> Submit Quote
                </button>
            )}

            {/* My jobs actions */}
            {mode === 'mine' && (
                <>
                  {job.status === 'QUOTED' && (
                      <div style={{
                        padding: '10px 14px', borderRadius: '10px',
                        background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)',
                        fontSize: '13px', color: '#a78bfa', textAlign: 'center', fontWeight: 500,
                      }}>
                        ⏳ Waiting for customer to approve your quote
                      </div>
                  )}
                  {job.status === 'APPROVED' && (
                      <button onClick={() => action(dispatchAPI.markInProgress, 'progress', 'Job started! You are on site.')}
                              disabled={loading === 'progress'} style={{
                        width: '100%', padding: '11px', borderRadius: '12px', border: 'none',
                        background: '#3b82f6', color: '#fff', cursor: loading === 'progress' ? 'not-allowed' : 'pointer',
                        fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font)',
                        opacity: loading === 'progress' ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 4px 16px rgba(59,130,246,0.3)', transition: 'all 0.2s ease',
                      }}>
                        <PlayCircle size={14} /> Arrived — Start Job
                      </button>
                  )}
                  {job.status === 'IN_PROGRESS' && (
                      <button onClick={() => setShowComplete(true)} style={{
                        width: '100%', padding: '11px', borderRadius: '12px', border: 'none',
                        background: '#10b981', color: '#fff', cursor: 'pointer',
                        fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 4px 16px rgba(16,185,129,0.3)', transition: 'all 0.2s ease',
                      }}>
                        <CheckCircle size={14} /> Mark Complete
                      </button>
                  )}
                </>
            )}
          </div>
        </div>

        {/* Modals */}
        {showQuote && (() => {
          const distKm = techProfile?.latitude
              ? haversine(techProfile.latitude, techProfile.longitude, job.userLatitude, job.userLongitude)
              : 0;
          return (
              <QuoteModal
                  job={{ ...job, distanceKm: distKm, technicianPhone: techProfile?.phone || '' }}
                  onClose={() => setShowQuote(false)} onDone={onRefresh}
              />
          );
        })()}
        {showComplete && (
            <CompleteModal job={job} onClose={() => setShowComplete(false)} onDone={onRefresh} />
        )}
      </>
  );
}

// ─── TECHNICIAN SETUP ─────────────────────────────────────────
function TechnicianSetup({ onComplete }) {
  const [form, setForm]       = useState({ phone: '', serviceTypes: [], latitude: '', longitude: '' });
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const toggleService = (s) => setForm(p => ({
    ...p, serviceTypes: p.serviceTypes.includes(s)
        ? p.serviceTypes.filter(x => x !== s)
        : [...p.serviceTypes, s],
  }));

  const getLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
        pos => {
          setForm(p => ({ ...p, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
          toast.success('Location detected!');
          setLocLoading(false);
        },
        () => { toast.error('Could not get location'); setLocLoading(false); }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.serviceTypes.length === 0) { toast.error('Select at least one service type'); return; }
    setLoading(true);
    try {
      await techAPI.register({
        phone:        form.phone,
        serviceTypes: form.serviceTypes,
        latitude:     form.latitude  ? parseFloat(form.latitude)  : null,
        longitude:    form.longitude ? parseFloat(form.longitude) : null,
      });
      toast.success('Technician profile created!');
      onComplete();
    } catch (e) { toast.error(e.response?.data?.message || 'Setup failed'); }
    finally { setLoading(false); }
  };

  return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ width: '100%', maxWidth: '540px', animation: 'fadeUp 0.4s ease' }}>

            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '20px', margin: '0 auto 20px',
                background: 'rgba(255,107,43,0.12)', border: '1px solid rgba(255,107,43,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
              }}>🔧</div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                Complete Your Profile
              </h1>
              <p style={{ color: 'var(--text3)', marginTop: '8px', fontSize: '14px' }}>
                Set up your technician profile to start receiving jobs
              </p>
            </div>

            <div style={{
              background: 'var(--bg2)', borderRadius: '20px',
              border: '1px solid var(--border)', overflow: 'hidden',
            }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
              <div style={{ padding: '28px' }}>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                  <Input label="Phone Number" placeholder="10-digit phone number"
                         value={form.phone} maxLength={10}
                         onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />

                  {/* Service type grid */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: '12px' }}>
                      Services You Offer <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {SERVICE_TYPES.map(s => {
                        const m = SERVICE_META[s] || { icon: '🔨', color: 'var(--accent)', bg: 'var(--accentbg)' };
                        const selected = form.serviceTypes.includes(s);
                        return (
                            <button key={s} type="button" onClick={() => toggleService(s)} style={{
                              padding: '12px 8px', borderRadius: '12px',
                              border: `1px solid ${selected ? m.color + '60' : 'var(--border)'}`,
                              background: selected ? m.bg : 'var(--bg3)',
                              cursor: 'pointer', transition: 'all 0.2s ease',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                              boxShadow: selected ? `0 4px 12px ${m.color}20` : 'none',
                            }}>
                              <span style={{ fontSize: '20px' }}>{m.icon}</span>
                              <span style={{
                                fontSize: '10px', fontFamily: 'var(--font)', textAlign: 'center', lineHeight: 1.2,
                                color: selected ? m.color : 'var(--text3)', fontWeight: selected ? 600 : 400,
                              }}>
                            {s.replace(/_/g, ' ')}
                          </span>
                              {selected && (
                                  <div style={{
                                    width: 16, height: 16, borderRadius: '50%',
                                    background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    <CheckCircle size={10} color="#fff" />
                                  </div>
                              )}
                            </button>
                        );
                      })}
                    </div>
                    {form.serviceTypes.length > 0 && (
                        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text3)' }}>
                          ✓ {form.serviceTypes.length} service{form.serviceTypes.length > 1 ? 's' : ''} selected
                        </div>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: '10px' }}>
                      Your Location
                      <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: '6px' }}>(optional)</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <Input placeholder="Latitude" value={form.latitude}
                             onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} />
                      <Input placeholder="Longitude" value={form.longitude}
                             onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} />
                    </div>
                    <button type="button" onClick={getLocation} disabled={locLoading} style={{
                      padding: '9px 16px', borderRadius: '10px',
                      border: '1px solid var(--border)', background: 'var(--bg3)',
                      color: 'var(--text2)', cursor: locLoading ? 'not-allowed' : 'pointer',
                      fontSize: '13px', fontFamily: 'var(--font)', fontWeight: 500,
                      display: 'inline-flex', alignItems: 'center', gap: '7px',
                      opacity: locLoading ? 0.7 : 1, transition: 'all 0.2s ease',
                    }}>
                      {locLoading ? <RefreshCw size={13} className="spin" /> : <MapPin size={13} />}
                      Use My Current Location
                    </button>
                    {form.latitude && form.longitude && (
                        <div style={{
                          marginTop: '10px', padding: '8px 12px',
                          background: 'rgba(16,185,129,0.08)', borderRadius: '10px',
                          fontSize: '12px', color: '#10b981',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          border: '1px solid rgba(16,185,129,0.2)',
                        }}>
                          <CheckCircle size={12} /> Location set: {form.latitude}, {form.longitude}
                        </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                    background: 'var(--accent)', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font)',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 4px 20px rgba(255,107,43,0.35)', transition: 'all 0.2s ease',
                  }}>
                    {loading ? 'Creating...' : 'Create Profile'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

// ─── AVAILABILITY TOGGLE ──────────────────────────────────────
function AvailabilityToggle({ status, loading, onToggle }) {
  const isOnline = status === 'AVAILABLE';
  return (
      <button onClick={onToggle} disabled={loading} style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: '10px 20px', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
        border: `1px solid ${isOnline ? 'rgba(231,76,60,0.3)' : 'rgba(16,185,129,0.3)'}`,
        background: isOnline ? 'rgba(231,76,60,0.08)' : 'rgba(16,185,129,0.08)',
        color: isOnline ? '#e74c3c' : '#10b981',
        fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font)',
        opacity: loading ? 0.7 : 1, transition: 'all 0.2s ease',
      }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {isOnline ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
        {isOnline ? 'Go Offline' : 'Go Online'}
      </button>
  );
}

// ─── TECHNICIAN DASHBOARD ─────────────────────────────────────
export function TechnicianDashboard() {
  const { user } = useAuth();
  const [profile,        setProfile]        = useState(null);
  const [jobs,           setJobs]           = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [availLoading,   setAvailLoading]   = useState(false);
  const [locLoading,     setLocLoading]     = useState(false);
  const [setupNeeded,    setSetupNeeded]    = useState(false);
  const [page,           setPage]           = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const res = await techAPI.getByUserId(user.id);
      setProfile(res.data); setSetupNeeded(false);
    } catch (e) {
      if (e.response?.status === 404) setSetupNeeded(true);
    } finally { setProfileLoading(false); }
  }, [user.id]);

  const loadJobs = useCallback(async (currentProfile) => {
    const p = currentProfile || profile;
    if (!p) return;
    try {
      const [jobsRes, profileRes] = await Promise.all([
        dispatchAPI.getByTechnician(p.userId, { page: 0, size: 50 }),
        techAPI.getByUserId(user.id),
      ]);
      setJobs(jobsRes.data.content || []);
      setProfile(profileRes.data);
    } catch (e) {}
  }, [profile, user.id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => {
    if (!profile) return;
    loadJobs(profile);
    const iv = setInterval(() => loadJobs(profile), 10000);
    return () => clearInterval(iv);
  }, [profile?.id]);

  const handleRefresh = () => loadJobs(profile);

  const toggleAvailability = async () => {
    const next = profile.availabilityStatus === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
    setAvailLoading(true);
    try {
      await techAPI.updateAvailability(profile.id, next);
      setProfile(p => ({ ...p, availabilityStatus: next }));
      toast.success(`You are now ${next}`);
    } catch (e) { toast.error('Failed to update availability'); }
    finally { setAvailLoading(false); }
  };

  const updateLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        await techAPI.updateLocation(profile.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setProfile(p => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        toast.success('Location updated!');
      } catch (e) { toast.error('Failed to update location'); }
      finally { setLocLoading(false); }
    }, () => { toast.error('Could not get location'); setLocLoading(false); });
  };

  if (profileLoading) return <><Navbar /><LoadingScreen /></>;
  if (setupNeeded)    return <TechnicianSetup onComplete={loadProfile} />;

  const activeJobs  = jobs.filter(j => ['QUOTED','APPROVED','IN_PROGRESS'].includes(j.status));
  const availStatus = profile?.availabilityStatus;
  const isOnline    = availStatus === 'AVAILABLE';

  return (
      <PageLayout>
        <div style={{ animation: 'fadeUp 0.4s ease' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '30px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                Hello, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p style={{ color: 'var(--text3)', marginTop: '6px', fontSize: '14px' }}>
                {profile?.serviceTypes?.map(s => s.replace(/_/g,' ')).join(' · ')}
              </p>
            </div>
            {/* Availability badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
              color: isOnline ? '#10b981' : '#6b7280',
              border: `1px solid ${isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.3)'}`,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isOnline ? '#10b981' : '#6b7280',
              boxShadow: isOnline ? '0 0 8px #10b981' : 'none',
              animation: isOnline ? 'pulse 2s ease-in-out infinite' : 'none',
            }} />
              {availStatus}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <StatCard label="Active Jobs" value={activeJobs.length} color="#ff6b2b"
                      icon={<Activity size={18} />} sub={activeJobs.length > 0 ? 'Needs attention' : 'All clear'} />
            <StatCard label="Completed" value={profile?.completedJobs ?? 0} color="#10b981"
                      icon={<CheckCircle size={18} />} sub="All time" />
            <StatCard
                label="Rating"
                value={`${profile?.rating != null ? Number(profile.rating).toFixed(1) : '0.0'}★`}
                color="#f59e0b"
                icon={<Star size={18} />}
                sub={`${profile?.totalRatings ?? 0} review${(profile?.totalRatings ?? 0) !== 1 ? 's' : ''}`}
            />
          </div>

          {/* Quick actions card */}
          <div style={{
            background: 'var(--bg2)', borderRadius: '16px',
            border: '1px solid var(--border)', padding: '20px',
            marginBottom: '28px',
          }}>
            <div style={{ fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-head)', fontSize: '15px' }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <AvailabilityToggle status={availStatus} loading={availLoading} onToggle={toggleAvailability} />
              <button onClick={updateLocation} disabled={locLoading} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text2)', cursor: locLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font)',
                opacity: locLoading ? 0.7 : 1, transition: 'all 0.2s ease',
              }}>
                {locLoading ? <RefreshCw size={14} className="spin" /> : <MapPin size={14} />}
                Update Location
              </button>
            </div>

            {!isOnline && (
                <div style={{
                  marginTop: '16px', padding: '12px 14px', borderRadius: '12px',
                  background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.25)',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontSize: '13px', color: '#f59e0b',
                }}>
                  <AlertCircle size={15} />
                  Go Online to start browsing and receiving job requests
                </div>
            )}
          </div>

          {/* Recent jobs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700 }}>Recent Jobs</h2>
            <button onClick={handleRefresh} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text3)', cursor: 'pointer', fontSize: '13px',
              fontFamily: 'var(--font)', transition: 'all 0.2s ease',
            }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {jobs.length === 0
              ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No jobs yet</div>
                    <div style={{ color: 'var(--text3)', fontSize: '14px' }}>Go online and browse available jobs</div>
                  </div>
              )
              : (() => {
                const totalPages = Math.ceil(jobs.length / PAGE_SIZE);
                const safePage = Math.min(page, totalPages - 1);
                const paged = jobs.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
                return (
                    <>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {paged.map(j => <JobCard key={j.id} job={j} mode="mine" onRefresh={handleRefresh} techProfile={profile} />)}
                      </div>
                      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
                    </>
                );
              })()
          }
        </div>
      </PageLayout>
  );
}

// ─── BROWSE JOBS ──────────────────────────────────────────────
export function BrowseJobsPage() {
  const { user }    = useAuth();
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [profile,   setProfile]   = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    techAPI.getByUserId(user.id).then(r => {
      setProfile(r.data);
      if (r.data.serviceTypes?.length > 0) {
        const first = [...r.data.serviceTypes][0];
        setActiveTab(first);
        searchForType(first, r.data);
      }
    }).catch(() => {});
  }, [user.id]);

  const searchForType = async (type, profileData) => {
    const tech = profileData || profile;
    setActiveTab(type);
    setLoading(true);
    try {
      const res = await dispatchAPI.getAvailable(type, { page: 0, size: 100 });
      const all = res.data.content || [];
      const filtered = tech?.latitude && tech?.longitude
          ? all.filter(job => {
            if (!job.userLatitude) return true;
            return haversine(tech.latitude, tech.longitude, job.userLatitude, job.userLongitude) <= 20;
          })
          : all;
      setJobs(filtered);
    } catch (e) { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  // Blocked states
  if (profile?.availabilityStatus === 'BUSY') {
    return (
        <PageLayout>
          <div style={{ animation: 'fadeUp 0.4s ease', textAlign: 'center', marginTop: '80px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '22px', margin: '0 auto 20px',
              background: 'rgba(255,107,43,0.12)', border: '1px solid rgba(255,107,43,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
            }}>🔧</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              You're on a job
            </h2>
            <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '28px' }}>
              Complete your current job before browsing new requests
            </p>
            <button onClick={() => navigate('/technician/jobs')} style={{
              padding: '12px 28px', borderRadius: '12px', border: 'none',
              background: 'var(--accent)', color: '#fff', cursor: 'pointer',
              fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font)',
              boxShadow: '0 4px 20px rgba(255,107,43,0.35)',
            }}>
              View My Current Job
            </button>
          </div>
        </PageLayout>
    );
  }

  if (profile?.availabilityStatus === 'OFFLINE') {
    return (
        <PageLayout>
          <div style={{ animation: 'fadeUp 0.4s ease', textAlign: 'center', marginTop: '80px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '22px', margin: '0 auto 20px',
              background: 'rgba(107,114,128,0.12)', border: '1px solid rgba(107,114,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
            }}>😴</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              You're offline
            </h2>
            <p style={{ color: 'var(--text3)', fontSize: '14px' }}>
              Go online from your dashboard to browse new requests
            </p>
          </div>
        </PageLayout>
    );
  }

  const activeTabMeta = SERVICE_META[activeTab] || {};

  return (
      <PageLayout>
        <div style={{ animation: 'fadeUp 0.4s ease' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Browse Jobs
            </h1>
            <p style={{ color: 'var(--text3)', marginTop: '6px', fontSize: '14px' }}>
              Open requests within 20km of your location
            </p>
          </div>

          {/* Service type tabs */}
          {profile?.serviceTypes?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[...profile.serviceTypes].map(s => {
                  const m = SERVICE_META[s] || { icon: '🔨', color: 'var(--accent)', bg: 'var(--accentbg)' };
                  const active = activeTab === s;
                  return (
                      <button key={s} onClick={() => searchForType(s, profile)} style={{
                        padding: '8px 16px', borderRadius: '20px',
                        border: `1px solid ${active ? m.color + '60' : 'var(--border)'}`,
                        background: active ? m.bg : 'var(--bg3)',
                        color: active ? m.color : 'var(--text3)',
                        fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font)',
                        fontWeight: active ? 600 : 400,
                        display: 'inline-flex', alignItems: 'center', gap: '7px',
                        transition: 'all 0.2s ease',
                        boxShadow: active ? `0 4px 12px ${m.color}20` : 'none',
                      }}>
                        <span>{m.icon}</span>
                        {s.replace(/_/g, ' ')}
                      </button>
                  );
                })}
              </div>
          )}

          {loading ? <LoadingScreen /> : jobs.length === 0
              ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                      No open jobs within 20km
                    </div>
                    <div style={{ color: 'var(--text3)', fontSize: '13px' }}>
                      No pending {activeTab?.replace(/_/g,' ')} requests in your area right now
                    </div>
                  </div>
              )
              : (
                  <>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '6px 14px', borderRadius: '20px', marginBottom: '16px',
                      background: activeTabMeta.bg || 'var(--bg3)',
                      border: `1px solid ${(activeTabMeta.color || 'var(--border)') + '40'}`,
                      fontSize: '13px', color: activeTabMeta.color || 'var(--text2)', fontWeight: 600,
                    }}>
                      <Search size={13} />
                      {jobs.length} open job{jobs.length !== 1 ? 's' : ''} · {activeTab?.replace(/_/g, ' ')}
                    </div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {jobs.map(j => (
                          <JobCard key={j.id} job={j} mode="browse"
                                   onRefresh={() => searchForType(activeTab, profile)}
                                   techProfile={profile} />
                      ))}
                    </div>
                  </>
              )
          }
        </div>
      </PageLayout>
  );
}

// ─── MY JOBS ──────────────────────────────────────────────────
export function MyJobsPage() {
  const { user }  = useAuth();
  const [profile, setProfile] = useState(null);
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ALL');
  const [page,    setPage]    = useState(0);

  useEffect(() => {
    techAPI.getByUserId(user.id).then(r => {
      setProfile(r.data);
      return dispatchAPI.getByTechnician(r.data.userId, { page: 0, size: 50 });
    }).then(r => setJobs(r.data.content || []))
        .catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false));
  }, [user.id]);

  const reload = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await dispatchAPI.getByTechnician(profile.userId, { page: 0, size: 50 });
      setJobs(res.data.content || []);
    } finally { setLoading(false); }
  };

  const STATUS_FILTERS = ['ALL','QUOTED','APPROVED','IN_PROGRESS','COMPLETED','CANCELLED'];
  const filtered = filter === 'ALL' ? jobs : jobs.filter(j => j.status === filter);
  const handleFilterChange = (f) => { setFilter(f); setPage(0); };

  const counts = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? jobs.length : jobs.filter(j => j.status === s).length;
    return acc;
  }, {});

  return (
      <PageLayout>
        <div style={{ animation: 'fadeUp 0.4s ease' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                My Jobs
              </h1>
              <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>
                {jobs.length} total job{jobs.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={reload} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text3)', cursor: 'pointer', fontSize: '13px',
              fontFamily: 'var(--font)', transition: 'all 0.2s ease',
            }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Filter tabs with count badges */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(s => {
              const active = filter === s;
              const meta = STATUS_META[s];
              const color = meta?.color || 'var(--text2)';
              return (
                  <button key={s} onClick={() => handleFilterChange(s)} style={{
                    padding: '6px 14px', borderRadius: '20px',
                    border: `1px solid ${active ? color + '60' : 'var(--border)'}`,
                    background: active ? color + '15' : 'transparent',
                    color: active ? color : 'var(--text3)',
                    fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font)',
                    fontWeight: active ? 600 : 400, transition: 'all 0.2s ease',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}>
                    {s.replace(/_/g, ' ')}
                    {counts[s] > 0 && (
                        <span style={{
                          minWidth: 18, height: 18, borderRadius: '9px', fontSize: '10px',
                          background: active ? color : 'var(--bg3)',
                          color: active ? '#fff' : 'var(--text3)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 600, padding: '0 4px',
                        }}>
                    {counts[s]}
                  </span>
                    )}
                  </button>
              );
            })}
          </div>

          {loading ? <LoadingScreen /> : filtered.length === 0
              ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>💼</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>No jobs found</div>
                    <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Submit quotes from the Browse Jobs tab</div>
                  </div>
              )
              : (() => {
                const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                const safePage = Math.min(page, totalPages - 1);
                const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
                return (
                    <>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>
                        Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                      </div>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {paged.map(j => <JobCard key={j.id} job={j} mode="mine" onRefresh={reload} techProfile={profile} />)}
                      </div>
                      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
                    </>
                );
              })()
          }
        </div>
      </PageLayout>
  );
}