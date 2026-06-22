import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dispatchAPI, techAPI } from '../api';
import { Button, Badge, LoadingScreen, ServiceIcon, Divider, Textarea, Input, Select } from '../components/UI';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import {
  Plus, MapPin, XCircle, RefreshCw, CheckCircle, Star,
  Clock, FileText, ChevronLeft, ChevronRight, Wrench,
  TrendingUp, AlertCircle, Activity, Navigation2
} from 'lucide-react';
import ChatBox from '../components/ChatBox';

// ─── LEAFLET Z-INDEX FIX ──────────────────────────────────────
if (typeof document !== 'undefined') {
  const STYLE_ID = '__rapidfix-leaflet-zfix__';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .leaflet-pane          { z-index: 40 !important; }
      .leaflet-tile-pane     { z-index: 20 !important; }
      .leaflet-overlay-pane  { z-index: 30 !important; }
      .leaflet-shadow-pane   { z-index: 35 !important; }
      .leaflet-marker-pane   { z-index: 40 !important; }
      .leaflet-tooltip-pane  { z-index: 45 !important; }
      .leaflet-popup-pane    { z-index: 50 !important; }
      .leaflet-top,
      .leaflet-bottom        { z-index: 55 !important; }
    `;
    document.head.appendChild(style);
  }
}

const SERVICE_TYPES = ['ELECTRICIAN','PLUMBER','AC_REPAIR','CARPENTER','PAINTER','CLEANER','APPLIANCE_REPAIR','PEST_CONTROL','TAILORING','NETWORKING_TECH','BEAUTICIAN','MEHANDI_SERVICES','GENERAL_HELPER'];
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
  TAILORING:       { icon: '🪡', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  NETWORKING_TECH: { icon: '📶', color: '#14b8a6', bg: 'rgba(20,184,166,0.12)' },
  BEAUTICIAN:      { icon: '💄', color: '#d946ef', bg: 'rgba(217,70,239,0.12)' },
  MEHANDI_SERVICES:{ icon: '🌿', color: '#84cc16', bg: 'rgba(132,204,22,0.12)' },
  GENERAL_HELPER:  { icon: '🙋🏽‍♂️', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
};

const SERVICE_DETAILS = {
  ELECTRICIAN: {
    desc: 'Certified electricians for wiring, short circuits, switchboards, lighting, and heavy appliance setups.',
    eta: '15-30 mins',
    price: '₹249',
    benefits: ['Licensed & Certified', 'Equipped with safety tools', '30-day work warranty']
  },
  PLUMBER: {
    desc: 'Professional plumbers for pipe leaks, tap repairs, bathroom fittings, clog removals, and drainage issues.',
    eta: '20-40 mins',
    price: '₹199',
    benefits: ['Experienced Professionals', 'No hidden charges', 'High-quality replacement parts']
  },
  AC_REPAIR: {
    desc: 'Expert AC technicians for servicing, gas filling, cooling issues, filter cleaning, and compressor repairs.',
    eta: '30-60 mins',
    price: '₹399',
    benefits: ['Certified HVAC experts', 'Multi-brand specialization', 'Post-service cleaning included']
  },
  CARPENTER: {
    desc: 'Skilled carpenters for furniture repair, assembly, door/window fixing, lock installations, and woodwork.',
    eta: '30-50 mins',
    price: '₹299',
    benefits: ['Precision crafting', 'Experienced woodworkers', 'Cleanup post-completion']
  },
  PAINTER: {
    desc: 'Professional painters for wall touch-ups, wall repairs, texture painting, interior painting, and consultations.',
    eta: 'Next day start',
    price: '₹499',
    benefits: ['Premium quality paints', 'Mess-free execution', 'Color consultation support']
  },
  CLEANER: {
    desc: 'Deep cleaning experts for home, kitchen, bathroom, sofa/carpet shampooing, and post-party cleanup.',
    eta: '45-90 mins',
    price: '₹349',
    benefits: ['Eco-friendly chemicals', 'Mechanized deep cleaning', 'Thorough stain removal']
  },
  APPLIANCE_REPAIR: {
    desc: 'Expert technicians for washing machines, refrigerators, microwaves, chimneys, and TV installations.',
    eta: '25-45 mins',
    price: '₹299',
    benefits: ['Genuine spare parts', 'Multi-brand expertise', 'Instant diagnostics report']
  },
  PEST_CONTROL: {
    desc: 'Trained specialists for cockroaches, bedbugs, termites, rodents, and general disinfection.',
    eta: '30-60 mins',
    price: '₹449',
    benefits: ['Odourless & safe chemicals', 'Long-lasting protection', 'Free follow-up inspection']
  },
  TAILORING: {
    desc: 'Professional tailoring for alterations, small fixes, stitch adjustments, and sewing needs right at home.',
    eta: '30-60 mins',
    price: '₹149',
    benefits: ['On-demand alterations', 'Equipped with compact machines', 'Instant fitting support']
  },
  NETWORKING_TECH: {
    desc: 'Router setups, Wi-Fi connectivity diagnostics, LAN cabling, configuration troubleshooting, and home network optimization.',
    eta: '20-40 mins',
    price: '₹299',
    benefits: ['Instant connectivity fix', 'Router setting calibration', 'Wi-Fi dead zone analysis']
  },
  BEAUTICIAN: {
    desc: 'Professional beauticians for salon services, facials, waxing, threading, makeup, and hair care at your convenience.',
    eta: '45-90 mins',
    price: '₹499',
    benefits: ['Premium beauty products', 'Hygienic setups', 'Certified style experts']
  },
  MEHANDI_SERVICES: {
    desc: 'Skilled Mehandi artists for bridal, festival, and traditional intricate henna patterns for all celebrations.',
    eta: '60-120 mins',
    price: '₹349',
    benefits: ['100% natural henna', 'Intricate traditional designs', 'Fast & clean application']
  },
  GENERAL_HELPER: {
    desc: 'Reliable helpers for house shifting support, event serving, heavy lifting, or general home assistance chores.',
    eta: '15-30 mins',
    price: '₹199',
    benefits: ['Heavy lifting assistance', 'Polite & verified support', 'Multi-purpose help']
  }
};

// ─── STATUS META ──────────────────────────────────────────────
const STATUS_META = {
  PENDING:     { label: 'Pending',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   dot: '#f59e0b' },
  QUOTED:      { label: 'Quoted',      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  dot: '#a78bfa' },
  APPROVED:    { label: 'Approved',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',   dot: '#3b82f6' },
  IN_PROGRESS: { label: 'In Progress', color: '#ff6b2b', bg: 'rgba(255,107,43,0.12)',   dot: '#ff6b2b' },
  COMPLETED:   { label: 'Completed',   color: '#10b981', bg: 'rgba(16,185,129,0.12)',   dot: '#10b981' },
  CANCELLED:   { label: 'Cancelled',   color: '#6b7280', bg: 'rgba(107,114,128,0.12)',  dot: '#6b7280' },
};

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
  const meta = STATUS_META[status] || { label: status, color: 'var(--text2)', bg: 'var(--bg3)', dot: 'var(--text3)' };
  return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        background: meta.bg, color: meta.color,
        border: `1px solid ${meta.color}30`,
      }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: meta.dot, flexShrink: 0,
        boxShadow: `0 0 6px ${meta.dot}`,
        animation: ['APPROVED','IN_PROGRESS'].includes(status) ? 'pulse 2s ease-in-out infinite' : 'none',
      }} />
        {meta.label}
    </span>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({ label, value, color, icon, accent }) {
  return (
      <div style={{
        background: 'var(--bg2)',
        border: `1px solid ${accent ? color + '40' : 'var(--border)'}`,
        borderRadius: '16px', padding: '20px',
        position: 'relative', overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
           onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}20`; }}
           onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: color, opacity: 0.06, filter: 'blur(20px)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '28px', fontFamily: 'var(--font-head)', fontWeight: 800, color, lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px', fontWeight: 500 }}>
              {label}
            </div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: color + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color, fontSize: '16px',
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

// ─── REVIEW MODAL ─────────────────────────────────────────────
function ReviewModal({ request, onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await techAPI.updateRating(request.technicianId, { rating });
      await dispatchAPI.markAsRated(request.id);
      toast.success('Review submitted! Thank you 🙏');
      onDone(); onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit review');
    } finally { setLoading(false); }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

  return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }} onClick={onClose}>
        <div style={{
          width: '100%', maxWidth: '420px',
          background: 'var(--bg2)', borderRadius: '20px',
          border: '1px solid var(--border2)', padding: '32px',
          animation: 'fadeUp 0.3s ease',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }} onClick={e => e.stopPropagation()}>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '18px',
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', margin: '0 auto 16px',
            }}>⭐</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
              Rate your experience
            </h2>
            <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '6px' }}>
              How was <strong style={{ color: 'var(--text2)' }}>{request.technicianName}</strong>?
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
            {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button"
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHovered(s)}
                        onMouseLeave={() => setHovered(0)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                          transition: 'transform 0.15s ease',
                          transform: (hovered || rating) >= s ? 'scale(1.25)' : 'scale(1)',
                        }}>
                  <Star size={32}
                        fill={(hovered || rating) >= s ? '#f59e0b' : 'none'}
                        color={(hovered || rating) >= s ? '#f59e0b' : 'var(--border2)'}
                  />
                </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px', fontSize: '14px', color: '#f59e0b', fontWeight: 600, minHeight: '20px' }}>
            {labels[hovered || rating]}
          </div>

          {request.finalAmount && (
              <div style={{
                padding: '16px', background: 'var(--bg3)', borderRadius: '14px',
                marginBottom: '24px', fontSize: '13px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontWeight: 600, marginBottom: '10px', color: 'var(--text2)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Job Summary
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text3)' }}>Service ({request.actualHours}hrs × ₹{request.hourlyRate}/hr)</span>
                  <span style={{ color: 'var(--text)' }}>₹{(request.hourlyRate * request.actualHours).toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text3)' }}>Parts / Appliances</span>
                  <span style={{ color: 'var(--text)' }}>₹{request.actualApplianceCharge?.toFixed(0)}</span>
                </div>
                {request.travelCharge > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} /> Travel
                </span>
                      <span style={{ color: 'var(--text)' }}>₹{request.travelCharge?.toFixed(0)}</span>
                    </div>
                )}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                  <span>Total Paid</span>
                  <span style={{ color: '#10b981' }}>₹{request.finalAmount?.toFixed(0)}</span>
                </div>
              </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '11px', borderRadius: '12px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text2)', cursor: 'pointer', fontSize: '14px',
              fontFamily: 'var(--font)', transition: 'all 0.2s ease',
            }}>Skip</button>
            <button onClick={submit} disabled={loading} style={{
              flex: 2, padding: '11px', borderRadius: '12px',
              border: 'none', background: 'var(--accent)',
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font)',
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <Star size={14} fill="#fff" /> Submit Review
            </button>
          </div>
        </div>
      </div>
  );
}

function QuoteBox({ quote, onApprove, onReject, approveLoading, rejectLoading }) {
  return (
      <div style={{
        padding: '18px', borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.04) 100%)',
        border: '1px solid rgba(167,139,250,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '8px',
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={13} color="#a78bfa" />
          </div>
          <span style={{ color: '#a78bfa', fontWeight: 600, fontSize: '13px' }}>
          Quote from {quote.technicianName}
        </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> {quote.estimatedHours}hrs × ₹{quote.hourlyRate}/hr
          </span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>₹{(quote.hourlyRate * quote.estimatedHours).toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text3)' }}>Parts / Appliances</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>₹{quote.applianceCharge?.toFixed(0)}</span>
          </div>
          {quote.travelCharge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Navigation2 size={12} /> Travel ({quote.distanceKm?.toFixed(1)}km)
            </span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>₹{quote.travelCharge?.toFixed(0)}</span>
              </div>
          )}
          {quote.travelCharge === 0 && quote.distanceKm > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Navigation2 size={12} /> Travel ({quote.distanceKm?.toFixed(1)}km)
            </span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>FREE</span>
              </div>
          )}
          <div style={{ borderTop: '1px solid rgba(167,139,250,0.2)', paddingTop: '8px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
            <span style={{ color: 'var(--text2)' }}>Estimated Total</span>
            <span style={{ color: '#a78bfa' }}>₹{quote.totalAmount?.toFixed(0)}</span>
          </div>
        </div>

        {quote.quoteNote && (
            <div style={{
              padding: '10px 14px', background: 'rgba(167,139,250,0.06)',
              borderRadius: '10px', fontSize: '12px', color: 'var(--text3)',
              marginBottom: '14px', fontStyle: 'italic',
              borderLeft: '3px solid rgba(167,139,250,0.4)',
            }}>
              "{quote.quoteNote}"
            </div>
        )}

        <div style={{
          padding: '10px 12px',
          marginBottom: '14px',
          borderRadius: '10px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          color: '#f59e0b',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Clock size={14} />
          Please review and approve this quote within 5 minutes. The technician may withdraw or revise the quote if it is not approved in time.
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onApprove} disabled={approveLoading} style={{
            flex: 2, padding: '10px', borderRadius: '10px', border: 'none',
            background: '#10b981', color: '#fff', cursor: approveLoading ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font)',
            opacity: approveLoading ? 0.7 : 1, transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
          }}>
            <CheckCircle size={13} /> Approve & Book
          </button>
          <button onClick={onReject} disabled={rejectLoading} style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            border: '1px solid rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.08)',
            color: '#e74c3c', cursor: rejectLoading ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font)',
            opacity: rejectLoading ? 0.7 : 1, transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <XCircle size={13} /> Reject
          </button>
        </div>
      </div>
  );
}

// ─── ETA BOX ──────────────────────────────────────────────────
function ETABox({ estimatedArrivalTime, distanceKm }) {
  if (!estimatedArrivalTime) return null;
  const arrival = new Date(estimatedArrivalTime);
  const diffMins = Math.max(0, Math.round((arrival - new Date()) / 60000));

  return (
      <div style={{
        padding: '14px 16px', borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)',
        border: '1px solid rgba(59,130,246,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '12px',
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>🚗</div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>
              On the way{distanceKm ? ` · ${distanceKm.toFixed(1)}km` : ''}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>
              {diffMins > 0 ? `Arriving in ~${diffMins} min` : 'Arriving any moment'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ETA</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#3b82f6', fontFamily: 'var(--font-head)' }}>
            {arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
  );
}

// ─── LIVE TRACKING MAP ────────────────────────────────────────
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const technicianIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function FitBoundsLive({ pos1, pos2 }) {
  const map = useMap();
  useEffect(() => {
    if (pos1 && pos2) map.fitBounds(L.latLngBounds([pos1, pos2]), { padding: [40, 40] });
  }, [pos1, pos2, map]);
  return null;
}

function LiveTrackingMap({ userLat, userLon, technicianId, onDistanceUpdate }) {
  const [techLocation, setTechLocation] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);

  useEffect(() => {
    if (!technicianId) return;
    const fetch_ = async () => {
      try {
        const res = await techAPI.getByUserId(technicianId);
        if (res.data?.latitude) setTechLocation({ lat: res.data.latitude, lon: res.data.longitude });
      } catch (e) {}
    };
    fetch_();
    const iv = setInterval(fetch_, 30000);
    return () => clearInterval(iv);
  }, [technicianId]);

  const customerPos = userLat && userLon ? [userLat, userLon] : null;
  const techPos = techLocation ? [techLocation.lat, techLocation.lon] : null;

  useEffect(() => {
    if (!customerPos || !techPos) {
      setRoutePoints([]);
      if (onDistanceUpdate) onDistanceUpdate(null);
      return;
    }
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${customerPos[1]},${customerPos[0]};${techPos[1]},${techPos[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]);
          setRoutePoints(coords);
          if (onDistanceUpdate) {
            const distance = data.routes[0].distance / 1000;
            onDistanceUpdate(distance);
          }
        } else {
          setRoutePoints([customerPos, techPos]);
        }
      } catch (e) {
        setRoutePoints([customerPos, techPos]);
      }
    };
    fetchRoute();
  }, [userLat, userLon, techLocation]);

  if (!customerPos) return null;

  return (
      <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{
          padding: '8px 14px', background: 'var(--bg3)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '12px',
        }}>
        <span style={{ color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔴 You</span><span>🔵 Technician</span>
        </span>
          <span style={{ color: techPos ? '#10b981' : 'var(--text3)', fontWeight: 600, fontSize: '11px' }}>
          {techPos ? '● LIVE' : '⏳ Locating...'}
        </span>
        </div>
        <div style={{ isolation: 'isolate', position: 'relative' }}>
          <MapContainer
              center={customerPos}
              zoom={13}
              style={{ height: '240px', width: '100%' }}
              scrollWheelZoom={false}
          >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            <FitBoundsLive pos1={customerPos} pos2={techPos} />
            <Marker position={customerPos} icon={customerIcon}>
              <Popup>📍 Your Location</Popup>
            </Marker>
            {techPos && (
                <>
                  {routePoints.length > 0 && (
                      <Polyline
                          positions={routePoints}
                          color="#3b82f6"
                          weight={4}
                          opacity={0.8}
                      />
                  )}
                  <Marker position={techPos} icon={technicianIcon}>
                    <Popup>🔧 Technician (live)</Popup>
                  </Marker>
                </>
            )}
          </MapContainer>
        </div>
      </div>
  );
}

// ─── REQUEST CARD ─────────────────────────────────────────────
function RequestCard({ request, onRefresh, onChatActiveChange }) {
  const [cancelLoading,  setCancelLoading]  = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading,  setRejectLoading]  = useState(false);
  const [showReview,     setShowReview]     = useState(false);
  const [liveDistance,   setLiveDistance]   = useState(null);
  const [quotes,         setQuotes]         = useState([]);
  const [quotesLoading,  setQuotesLoading]  = useState(false);
  const { user } = useAuth();
  const meta = SERVICE_META[request.serviceType] || { icon: '🔨', color: 'var(--accent)', bg: 'var(--accentbg)' };

  useEffect(() => {
    if (['PENDING', 'QUOTED'].includes(request.status)) {
      const fetchQuotes = async () => {
        setQuotesLoading(true);
        try {
          const res = await dispatchAPI.getQuotesForRequest(request.id);
          setQuotes(res.data || []);
        } catch (e) {
          console.error("Failed to fetch quotes", e);
        } finally {
          setQuotesLoading(false);
        }
      };
      fetchQuotes();
    }
  }, [request.id, request.status]);

  const cancel = async () => {
    setCancelLoading(true);
    try { await dispatchAPI.cancel(request.id); toast.success('Request cancelled'); onRefresh(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed to cancel'); }
    finally { setCancelLoading(false); }
  };

  const approve = async (technicianId) => {
    setApproveLoading(true);
    try { await dispatchAPI.approveQuote(request.id, technicianId); toast.success('Quote approved! Technician is on the way 🚗'); onRefresh(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed to approve'); }
    finally { setApproveLoading(false); }
  };

  const reject = async (technicianId) => {
    setRejectLoading(true);
    try { await dispatchAPI.rejectQuote(request.id, technicianId); toast.success('Quote rejected.'); onRefresh(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed to reject'); }
    finally { setRejectLoading(false); }
  };

  return (
      <>
        <div style={{
          background: 'var(--bg2)', borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden', transition: 'all 0.2s ease',
        }}
             onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color + '40'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${meta.color}10`; }}
             onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {/* Colored top accent bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}00)` }} />

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: meta.bg, border: `1px solid ${meta.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                  flexShrink: 0,
                }}>
                  {meta.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', lineHeight: 1.2 }}>
                    {request.serviceType?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>
                    {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <StatusPill status={request.status} />
            </div>

            {/* Description */}
            <p style={{
              fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6,
              padding: '12px 14px', background: 'var(--bg3)',
              borderRadius: '10px', borderLeft: `3px solid ${meta.color}40`,
              margin: 0,
            }}>
              {request.description}
            </p>

            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text3)' }}>
              <MapPin size={12} color={meta.color} /> {request.address}
            </div>

            {/* Technician assigned */}
            {request.technicianName && request.status !== 'QUOTED' && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'var(--bg3)', borderRadius: '10px',
                  fontSize: '13px',
                }}>
              <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={12} /> Technician
              </span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{request.technicianName}</span>
                </div>
            )}

            {/* ETA */}
            {request.status === 'APPROVED' && request.estimatedArrivalTime && (
                <ETABox estimatedArrivalTime={request.estimatedArrivalTime} distanceKm={liveDistance || request.distanceKm} />
            )}

            {request.status === 'IN_PROGRESS' && (
                <div style={{
                  padding: '14px 16px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '12px',
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                  }}>👋</div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>
                      Status
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                      Technician Arrived
                    </div>
                  </div>
                </div>
            )}

            {/* Live map */}
            {['APPROVED', 'IN_PROGRESS'].includes(request.status) && request.userLatitude && request.technicianId && (
                <LiveTrackingMap
                    userLat={request.userLatitude}
                    userLon={request.userLongitude}
                    technicianId={request.technicianId}
                    onDistanceUpdate={setLiveDistance}
                />
            )}

            {/* Phone */}
            {['APPROVED', 'IN_PROGRESS'].includes(request.status) && request.technicianPhone && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'var(--bg3)', borderRadius: '10px', fontSize: '13px',
                }}>
                  <span style={{ color: 'var(--text3)' }}>📞 Contact Technician</span>
                  <a href={`tel:${request.technicianPhone}`} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                    {request.technicianPhone}
                  </a>
                </div>
            )}

            {/* Chat */}
            {['APPROVED', 'IN_PROGRESS'].includes(request.status) && (
                <ChatBox
                    requestId={request.id}
                    currentUser={{ id: user.id, name: user.name, role: 'USER' }}
                    status={request.status}
                    onChatActiveChange={onChatActiveChange}
                />
            )}

            {/* Final amount */}
            {request.status === 'COMPLETED' && request.finalAmount && (
                <div style={{
                  padding: '14px', background: 'rgba(16,185,129,0.06)',
                  borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '13px',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '10px', color: '#10b981', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Final Bill
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text3)' }}>Service ({request.actualHours}hrs × ₹{request.hourlyRate}/hr)</span>
                    <span>₹{(request.hourlyRate * request.actualHours).toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text3)' }}>Parts / Appliances</span>
                    <span>₹{request.actualApplianceCharge?.toFixed(0)}</span>
                  </div>
                  {request.travelCharge > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Navigation2 size={11} /> Travel
                  </span>
                        <span>₹{request.travelCharge?.toFixed(0)}</span>
                      </div>
                  )}
                  <div style={{ borderTop: '1px solid rgba(16,185,129,0.2)', paddingTop: '10px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '15px' }}>
                    <span>Total Paid</span>
                    <span style={{ color: '#10b981' }}>₹{request.finalAmount?.toFixed(0)}</span>
                  </div>
                </div>
            )}

            {/* Quotes list */}
            {['PENDING', 'QUOTED'].includes(request.status) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {quotesLoading ? (
                  <div style={{ fontSize: '13px', color: 'var(--text3)', textAlign: 'center', padding: '10px' }}>
                    Loading quotes...
                  </div>
                ) : quotes.length > 0 ? (
                  <>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={14} color="var(--accent)" /> Technician Quotes ({quotes.length})
                    </div>
                    {quotes.map(q => (
                      <QuoteBox
                        key={q.technicianId}
                        quote={q}
                        onApprove={() => approve(q.technicianId)}
                        onReject={() => reject(q.technicianId)}
                        approveLoading={approveLoading}
                        rejectLoading={rejectLoading}
                      />
                    ))}
                  </>
                ) : request.status === 'QUOTED' ? (
                  <QuoteBox
                    quote={{
                      technicianId: request.technicianId,
                      technicianName: request.technicianName,
                      technicianPhone: request.technicianPhone,
                      hourlyRate: request.hourlyRate,
                      estimatedHours: request.estimatedHours,
                      applianceCharge: request.applianceCharge,
                      travelCharge: request.travelCharge,
                      distanceKm: request.distanceKm,
                      totalAmount: request.totalAmount,
                      quoteNote: request.quoteNote
                    }}
                    onApprove={() => approve(request.technicianId)}
                    onReject={() => reject(request.technicianId)}
                    approveLoading={approveLoading}
                    rejectLoading={rejectLoading}
                  />
                ) : (
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg3)', border: '1px dashed var(--border)', textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>
                    Waiting for technicians to quote...
                  </div>
                )}
              </div>
            )}

            {/* Cancel */}
            {request.status === 'PENDING' && (
                <button onClick={cancel} disabled={cancelLoading} style={{
                  padding: '10px', borderRadius: '10px',
                  border: '1px solid rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.06)',
                  color: '#e74c3c', cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font)',
                  opacity: cancelLoading ? 0.7 : 1, transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  marginTop: '10px',
                }}>
                  <XCircle size={13} /> Cancel Request
                </button>
            )}

            {/* Rate button */}
            {request.status === 'COMPLETED' && request.technicianId && !request.rated && (
                <button onClick={() => setShowReview(true)} style={{
                  padding: '10px', borderRadius: '10px',
                  border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)',
                  color: '#f59e0b', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font)',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <Star size={13} /> Rate Technician
                </button>
            )}

            {/* Already rated */}
            {request.status === 'COMPLETED' && request.rated && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontSize: '12px', color: '#10b981', padding: '8px',
                  background: 'rgba(16,185,129,0.06)', borderRadius: '10px',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}>
                  <CheckCircle size={13} /> You've rated this job
                </div>
            )}
          </div>
        </div>

        {showReview && (
            <ReviewModal request={request} onClose={() => setShowReview(false)} onDone={onRefresh} />
        )}
      </>
  );
}

// ─── ADDRESS AUTOCOMPLETE ─────────────────────────────────────
function AddressAutocomplete({ value, onChange, onLocationSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = (query) => {
    onChange(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://corsproxy.io/?${encodeURIComponent(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`)}`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data); setShowDropdown(true);
      } catch (e) {} finally { setLoading(false); }
    }, 500);
  };

  const select = (item) => {
    onChange(item.display_name);
    onLocationSelect(parseFloat(item.lat), parseFloat(item.lon));
    setSuggestions([]); setShowDropdown(false);
  };

  useEffect(() => {
    const h = () => setShowDropdown(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
      <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
        <Input label="Address" placeholder="Start typing your address..."
               value={value} onChange={e => search(e.target.value)}
               icon={loading ? <RefreshCw size={15} className="spin" /> : <MapPin size={15} />}
        />
        {showDropdown && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg2)', border: '1px solid var(--border2)',
              borderRadius: '12px', zIndex: 100, maxHeight: '200px', overflowY: 'auto',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)', marginTop: '4px',
            }}>
              {suggestions.map((s, i) => (
                  <div key={i} onClick={() => select(s)} style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: 'var(--text2)',
                    borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    transition: 'background 0.15s ease',
                  }}
                       onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <MapPin size={11} style={{ marginTop: 2, opacity: 0.5, flexShrink: 0 }} />
                    <span>{s.display_name}</span>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}

// ─── USER DASHBOARD ───────────────────────────────────────────
export function UserDashboard() {
  const { user } = useAuth();
  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(0);
  const [chatActive,  setChatActive]  = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await dispatchAPI.getByUser(user.id, { page: 0, size: 50 });
      setRequests(res.data.content || []);
    } catch (e) { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  // ─── Auto-refresh: paused while chat is open ─────────────────
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (chatActive) return; // don't set up interval while chatting
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [chatActive]);

  const stats = {
    total:     requests.length,
    pending:   requests.filter(r => r.status === 'PENDING').length,
    quoted:    requests.filter(r => r.status === 'QUOTED').length,
    active:    requests.filter(r => ['APPROVED','IN_PROGRESS'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'COMPLETED').length,
  };

  return (
      <PageLayout>
        <div style={{ animation: 'fadeUp 0.4s ease' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '30px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                Hello, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p style={{ color: 'var(--text3)', marginTop: '6px', fontSize: '14px' }}>
                Manage your service requests
              </p>
            </div>
            <button onClick={() => navigate('/user/new-request')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '11px 20px', borderRadius: '12px', border: 'none',
              background: 'var(--accent)', color: '#fff', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font)',
              boxShadow: '0 4px 20px rgba(255,107,43,0.35)',
              transition: 'all 0.2s ease',
            }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(255,107,43,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,107,43,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Plus size={16} /> New Request
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '32px' }}>
            <StatCard label="Total"     value={stats.total}     color="var(--text)" icon={<Activity size={16}/>} />
            <StatCard label="Pending"   value={stats.pending}   color="#f59e0b" icon={<Clock size={16}/>} />
            <StatCard label="Quoted"    value={stats.quoted}    color="#a78bfa" icon={<FileText size={16}/>} accent={stats.quoted > 0} />
            <StatCard label="Active"    value={stats.active}    color="#3b82f6" icon={<Navigation2 size={16}/>} accent={stats.active > 0} />
            <StatCard label="Completed" value={stats.completed} color="#10b981" icon={<CheckCircle size={16}/>} />
          </div>

          {/* Quote alert */}
          {stats.quoted > 0 && (
              <div style={{
                padding: '14px 18px', borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.06) 100%)',
                border: '1px solid rgba(167,139,250,0.3)',
                marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px',
                fontSize: '13px', color: '#a78bfa', fontWeight: 500,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={13} />
                </div>
                <span>
              <strong>{stats.quoted} quote{stats.quoted > 1 ? 's' : ''}</strong> waiting for your approval
            </span>
              </div>
          )}

          {/* Requests section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700 }}>Recent Requests</h2>
            <button onClick={load} style={{
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

          {loading ? <LoadingScreen /> : requests.length === 0
              ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No requests yet</div>
                    <div style={{ color: 'var(--text3)', marginBottom: '24px', fontSize: '14px' }}>Create your first service request to get started</div>
                    <button onClick={() => navigate('/user/new-request')} style={{
                      padding: '11px 24px', borderRadius: '12px', border: 'none',
                      background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                      fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font)',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                    }}>
                      <Plus size={15} /> Create Request
                    </button>
                  </div>
              ) : (() => {
                const totalPages = Math.ceil(requests.length / PAGE_SIZE);
                const safePage = Math.min(page, totalPages - 1);
                const paged = requests.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
                return (
                    <>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {paged.map(r => (
                            <RequestCard
                                key={r.id}
                                request={r}
                                onRefresh={load}
                                onChatActiveChange={setChatActive}
                            />
                        ))}
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

// ─── NEW REQUEST PAGE ─────────────────────────────────────────
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.setView(coords, 15);
    }
  }, [coords, map]);
  return null;
}

export function NewRequestPage() {
  const [form, setForm] = useState({
    serviceType: 'ELECTRICIAN', description: '', address: '',
    userLatitude: '', userLongitude: '',
  });
  const [loading,    setLoading]    = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 850);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 850);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      setForm(p => ({ ...p, userLatitude: lat.toFixed(6), userLongitude: lon.toFixed(6) }));
      try {
        const url = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)}`;
        const res = await fetch(url);
        const json = await res.json();
        const data = JSON.parse(json.contents);
        if (data.display_name) setForm(p => ({ ...p, address: data.display_name }));
        toast.success('Location & address detected! ✅');
      } catch (e) { toast.success('Location detected! Please type your address.'); }
      setLocLoading(false);
    }, () => { toast.error('Could not get location'); setLocLoading(false); });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.userLatitude || !form.userLongitude) { toast.error('Please set your location first'); return; }
    setLoading(true);
    try {
      await dispatchAPI.createRequest({ ...form, userLatitude: parseFloat(form.userLatitude), userLongitude: parseFloat(form.userLongitude) });
      toast.success('Request created! Technicians will send quotes shortly.');
      navigate('/user/requests');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create request'); }
    finally { setLoading(false); }
  };

  const selectedMeta = SERVICE_META[form.serviceType] || { color: 'var(--accent)', icon: '🔨', bg: 'var(--accentbg)' };

  return (
      <PageLayout>
        <div style={{ animation: 'fadeUp 0.4s ease' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <button onClick={() => navigate('/user/dashboard')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: 'var(--text3)',
              cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font)',
              padding: '0 0 16px', transition: 'color 0.2s ease',
            }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
            >
              <ChevronLeft size={15} /> Back to Dashboard
            </button>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              New Service Request
            </h1>
            <p style={{ color: 'var(--text3)', marginTop: '6px', fontSize: '15px' }}>
              Describe your issue and get matching quotes from verified local technicians in minutes.
            </p>
          </div>

          {/* Two-Column Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr',
            gap: '28px',
            alignItems: 'start'
          }}>

            {/* Left Column: Request Form Card */}
            <div style={{
              background: 'var(--bg2)', borderRadius: '20px',
              border: '1px solid var(--border)', overflow: 'hidden',
            }}>
              {/* Colored header stripe */}
              <div style={{
                height: 4,
                background: `linear-gradient(90deg, ${selectedMeta.color}, ${selectedMeta.color}00)`,
                transition: 'background 0.3s ease',
              }} />

              <div style={{ padding: '28px' }}>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                  {/* Service type grouped selector */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: '12px' }}>
                      Select Service Category
                    </label>
                    
                    {[
                      {
                        title: 'Repairs & Maintenance',
                        types: ['ELECTRICIAN', 'PLUMBER', 'AC_REPAIR', 'CARPENTER', 'PAINTER', 'APPLIANCE_REPAIR', 'NETWORKING_TECH']
                      },
                      {
                        title: 'Specialty & Home Services',
                        types: ['CLEANING', 'PEST_CONTROL', 'TAILORING', 'BEAUTICIAN', 'MEHANDI_SERVICES', 'GENERAL_HELPER']
                      }
                    ].map(group => (
                      <div key={group.title} style={{ marginBottom: '18px' }}>
                        <div style={{ textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', fontSize: '10px', fontWeight: 800, marginBottom: '8px' }}>
                          {group.title}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                          {group.types.map(s => {
                            const m = SERVICE_META[s] || { icon: '🔨', color: 'var(--accent)', bg: 'var(--accentbg)' };
                            const selected = form.serviceType === s;
                            return (
                              <button key={s} type="button" onClick={() => setForm(p => ({ ...p, serviceType: s }))} style={{
                                padding: '10px 8px', borderRadius: '12px',
                                border: `1px solid ${selected ? m.color + '80' : 'var(--border)'}`,
                                background: selected ? m.bg : 'var(--bg3)',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: selected ? `0 4px 14px ${m.color}20` : 'none',
                              }}
                                      onMouseEnter={e => { if(!selected) e.currentTarget.style.borderColor = 'var(--border2)'; }}
                                      onMouseLeave={e => { if(!selected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                              >
                                <span style={{ fontSize: '18px' }}>{m.icon}</span>
                                <span style={{ fontSize: '12px', fontFamily: 'var(--font)', color: selected ? m.color : 'var(--text2)', fontWeight: selected ? 600 : 500, textAlign: 'left', lineHeight: 1.1 }}>
                                  {s.replace(/_/g, ' ')}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Textarea label="Describe the service details"
                            placeholder="Please explain what you need support with in detail..."
                            value={form.description} minLength={10}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required
                  />

                  <AddressAutocomplete
                      value={form.address}
                      onChange={addr => setForm(p => ({ ...p, address: addr }))}
                      onLocationSelect={(lat, lon) => {
                        setForm(p => ({ ...p, userLatitude: lat.toFixed(6), userLongitude: lon.toFixed(6) }));
                        toast.success('Location auto-detected! ✅');
                      }}
                  />

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" onClick={getLocation} disabled={locLoading} style={{
                      padding: '10px 16px', borderRadius: '10px',
                      border: '1px solid var(--border)', background: 'var(--bg3)',
                      color: 'var(--text2)', cursor: locLoading ? 'not-allowed' : 'pointer',
                      fontSize: '13px', fontFamily: 'var(--font)', fontWeight: 500,
                      display: 'inline-flex', alignItems: 'center', gap: '7px',
                      opacity: locLoading ? 0.7 : 1, transition: 'all 0.2s ease',
                    }}>
                      {locLoading ? <RefreshCw size={13} className="spin" /> : <MapPin size={13} />}
                      Use GPS Instead
                    </button>

                    {form.userLatitude && form.userLongitude && (
                        <div style={{
                          padding: '10px 14px', background: 'rgba(16,185,129,0.08)',
                          borderRadius: '10px', fontSize: '12px', color: '#10b981',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          border: '1px solid rgba(16,185,129,0.2)',
                        }}>
                          <CheckCircle size={13} />
                          Location set: {form.userLatitude}, {form.userLongitude}
                        </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => navigate('/user/dashboard')} style={{
                      flex: 1, padding: '12px', borderRadius: '12px',
                      border: '1px solid var(--border)', background: 'transparent',
                      color: 'var(--text2)', cursor: 'pointer', fontSize: '14px',
                      fontFamily: 'var(--font)', transition: 'all 0.2s ease',
                    }}>Cancel</button>
                    <button type="submit" disabled={loading} style={{
                      flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                      background: 'var(--accent)', color: '#fff',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font)',
                      opacity: loading ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 20px rgba(255,107,43,0.35)',
                      transition: 'all 0.2s ease',
                    }}>
                      <Plus size={15} /> Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Side Preview Map & Dynamic Service Showcase */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Dynamic Service Showcase Card */}
              {form.serviceType && (
                <div style={{
                  background: 'var(--bg2)', borderRadius: '20px',
                  border: '1px solid var(--border)', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', animation: 'fadeUp 0.3s ease'
                }}>
                  <div style={{ position: 'relative', height: '170px', overflow: 'hidden' }}>
                    <img
                        src={
                          form.serviceType === 'ELECTRICIAN'
                              ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500'
                              : form.serviceType === 'PLUMBER'
                                  ? 'https://tse1.explicit.bing.net/th/id/OIP.mJPruqxQGzd3dcTZTrCeEAHaFj?w=2000&h=1500&rs=1&pid=ImgDetMain&o=7&rm=3'
                                  : form.serviceType === 'AC_REPAIR'
                                      ? 'https://techsquadteam.com/assets/profile/blogimages/f00ab4df455700aeb2ff86da0cb79fe2.png'
                                      : form.serviceType === 'CARPENTER'
                                          ? 'https://images.pexels.com/photos/5974337/pexels-photo-5974337.jpeg?auto=compress&w=500'
                                          : form.serviceType === 'PAINTER'
                                              ? 'https://images.pexels.com/photos/6474475/pexels-photo-6474475.jpeg?auto=compress&w=500'
                                              : form.serviceType === 'APPLIANCE_REPAIR'
                                                  ? 'https://images.pexels.com/photos/5691659/pexels-photo-5691659.jpeg?auto=compress&w=500'
                                                  : form.serviceType === 'CLEANING'
                                                      ? 'https://static.vecteezy.com/system/resources/thumbnails/026/936/992/small_2x/ai-generative-young-woman-housewife-clean-wash-hardwood-floor-in-modern-living-room-interior-tidy-girl-cleaner-maid-holding-mop-at-home-housekeeping-and-household-domestic-housework-cleaning-ser-photo.jpg'
                                                      : form.serviceType === 'PEST_CONTROL'
                                                          ? 'https://images.pexels.com/photos/6969809/pexels-photo-6969809.jpeg?auto=compress&w=500'
                                                          : form.serviceType === 'NETWORKING_TECH'
                                                              ? 'https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg?auto=compress&w=500'
                                                              : form.serviceType === 'TAILORING'
                                                                  ? 'https://helonix.com/cdn/shop/files/81wFF_YkJyL._SL1500.jpg?v=1704308176&width=500'
                                                                  : form.serviceType === 'BEAUTICIAN'
                                                                      ? 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500'
                                                                      : form.serviceType === 'MEHANDI_SERVICES'
                                                                          ? 'https://i.pinimg.com/originals/3b/e1/f1/3be1f17ddea804b00b9b1769dcb15591.jpg'
                                                                          : form.serviceType === 'GENERAL_HELPER'
                                                                              ? 'https://tse4.mm.bing.net/th/id/OIP.qV9YNzPfCWtM0CBP9vSr2gHaE7?rs=1&pid=ImgDetMain&o=7&rm=3'
                                                                              : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500'
                        }
                      alt={form.serviceType}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 80%)'
                    }} />
                    <div style={{
                      position: 'absolute', bottom: '14px', left: '16px',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <span style={{ fontSize: '20px' }}>{selectedMeta.icon}</span>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: '17px', fontFamily: 'var(--font-head)' }}>
                        {form.serviceType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5, background: 'var(--bg2)' }}>
                    Our verified service professionals bring equipment, experience, and are fully vetted.
                  </div>
                </div>
              )}

              {/* Map Preview Box */}
              <div style={{
                background: 'var(--bg2)', borderRadius: '20px',
                border: '1px solid var(--border)', padding: '18px',
                display: 'flex', flexDirection: 'column', gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)' }}>Location Preview (Drag pin to set)</span>
                  <span style={{ fontSize: '11px', color: form.userLatitude ? '#10b981' : 'var(--text3)', fontWeight: 600 }}>
                    {form.userLatitude ? '● DETECTED' : '⏳ Waiting for Location'}
                  </span>
                </div>

                {form.userLatitude && form.userLongitude ? (
                    <div style={{
                      borderRadius: '12px', overflow: 'hidden',
                      border: '1px solid var(--border)', height: '220px',
                      position: 'relative', isolation: 'isolate'
                    }}>
                      <MapContainer
                          center={[parseFloat(form.userLatitude), parseFloat(form.userLongitude)]}
                          zoom={15}
                          style={{ height: '100%', width: '100%' }}
                          scrollWheelZoom={false}
                      >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        <ChangeMapView coords={[parseFloat(form.userLatitude), parseFloat(form.userLongitude)]} />
                        <Marker 
                          position={[parseFloat(form.userLatitude), parseFloat(form.userLongitude)]} 
                          icon={customerIcon}
                          draggable={true}
                          eventHandlers={{
                            dragend: async (e) => {
                              const marker = e.target;
                              const position = marker.getLatLng();
                              const lat = position.lat;
                              const lng = position.lng;
                              setForm(p => ({ ...p, userLatitude: lat.toFixed(6), userLongitude: lng.toFixed(6) }));
                              try {
                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { 'Accept-Language': 'en' } });
                                const data = await res.json();
                                if (data.display_name) {
                                  setForm(p => ({ ...p, address: data.display_name }));
                                }
                              } catch (err) { /* silent */ }
                            }
                          }}
                        >
                          <Popup>📍 Drag me to adjust location</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                ) : (
                    <div style={{
                      height: '220px', borderRadius: '12px',
                      border: '1px dashed var(--border2)', background: 'var(--bg3)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: '12px', color: 'var(--text3)',
                      padding: '24px', textAlign: 'center'
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(255,107,43,0.1)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <MapPin size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text2)', fontSize: '13px', marginBottom: '4px' }}>No Location Selected</div>
                        <div style={{ fontSize: '11px', lineHeight: 1.4 }}>Enter an address or use GPS to display the location on the map.</div>
                      </div>
                    </div>
                )}
              </div>

              {/* Service Info / Tips Box */}
              <div style={{
                background: 'var(--bg2)', borderRadius: '20px',
                border: '1px solid var(--border)', overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: 4,
                  background: selectedMeta.color,
                  opacity: 0.8
                }} />

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '10px',
                      background: selectedMeta.bg, color: selectedMeta.color,
                      display: 'flex', alignItems: 'center', justifyItems: 'center',
                      justifyContent: 'center', fontSize: '20px'
                    }}>
                      {selectedMeta.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 500 }}>Selected Category</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                        {form.serviceType.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5, margin: 0 }}>
                    {SERVICE_DETAILS[form.serviceType]?.desc}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Dispatch ETA</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text2)', marginTop: '2px' }}>
                        {SERVICE_DETAILS[form.serviceType]?.eta}
                      </div>
                    </div>
                    <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Typical Cost</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text2)', marginTop: '2px' }}>
                        {SERVICE_DETAILS[form.serviceType]?.price}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '8px' }}>RapidFix Guarantees:</div>
                    <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {SERVICE_DETAILS[form.serviceType]?.benefits.map((b, i) => (
                          <li key={i} style={{ fontSize: '11px', color: 'var(--text3)' }}>{b}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </PageLayout>
  );
}

// ─── USER REQUESTS PAGE ───────────────────────────────────────
export function UserRequestsPage() {
  const { user }  = useAuth();
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('ALL');
  const [page,       setPage]       = useState(0);
  const [chatActive, setChatActive] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await dispatchAPI.getByUser(user.id, { page: 0, size: 50 });
      setRequests(res.data.content || []);
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ─── Auto-refresh: paused while chat is open ─────────────────
  useEffect(() => {
    if (chatActive) return;
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [chatActive]);

  const STATUS_FILTERS = ['ALL','PENDING','QUOTED','APPROVED','IN_PROGRESS','COMPLETED','CANCELLED'];
  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);
  const handleFilterChange = (f) => { setFilter(f); setPage(0); };

  const counts = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? requests.length : requests.filter(r => r.status === s).length;
    return acc;
  }, {});

  return (
      <PageLayout>
        <div style={{ animation: 'fadeUp 0.4s ease' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                My Requests
              </h1>
              <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>
                {requests.length} total request{requests.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={load} style={{
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

          {/* Filter tabs */}
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
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.2s ease',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}>
                    {s.replace(/_/g, ' ')}
                    {counts[s] > 0 && (
                        <span style={{
                          minWidth: 18, height: 18, borderRadius: '9px', fontSize: '10px',
                          background: active ? color : 'var(--bg3)', color: active ? '#fff' : 'var(--text3)',
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
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>No requests found</div>
                    <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Try a different filter</div>
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
                        {paged.map(r => (
                            <RequestCard
                                key={r.id}
                                request={r}
                                onRefresh={load}
                                onChatActiveChange={setChatActive}
                            />
                        ))}
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