import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dispatchAPI, techAPI } from '../api';
import { Button, Badge, LoadingScreen, ServiceIcon, Divider, Textarea, Input, Select } from '../components/UI';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Plus, MapPin, XCircle, RefreshCw, CheckCircle, Star,
  Clock, FileText, ChevronLeft, ChevronRight, Wrench,
  TrendingUp, AlertCircle, Activity, Navigation2
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
        {/* glow blob */}
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
        position: 'fixed', inset: 0, zIndex: 200,
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

// ─── QUOTE BOX ────────────────────────────────────────────────
function QuoteBox({ request, onApprove, onReject, approveLoading, rejectLoading }) {
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
          Quote from {request.technicianName}
        </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> {request.estimatedHours}hrs × ₹{request.hourlyRate}/hr
          </span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>₹{(request.hourlyRate * request.estimatedHours).toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text3)' }}>Parts / Appliances</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>₹{request.applianceCharge?.toFixed(0)}</span>
          </div>
          {request.travelCharge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Navigation2 size={12} /> Travel ({request.distanceKm?.toFixed(1)}km)
            </span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>₹{request.travelCharge?.toFixed(0)}</span>
              </div>
          )}
          {request.travelCharge === 0 && request.distanceKm > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Navigation2 size={12} /> Travel ({request.distanceKm?.toFixed(1)}km)
            </span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>FREE</span>
              </div>
          )}
          <div style={{ borderTop: '1px solid rgba(167,139,250,0.2)', paddingTop: '8px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
            <span style={{ color: 'var(--text2)' }}>Estimated Total</span>
            <span style={{ color: '#a78bfa' }}>₹{request.totalAmount?.toFixed(0)}</span>
          </div>
        </div>

        {request.quoteNote && (
            <div style={{
              padding: '10px 14px', background: 'rgba(167,139,250,0.06)',
              borderRadius: '10px', fontSize: '12px', color: 'var(--text3)',
              marginBottom: '14px', fontStyle: 'italic',
              borderLeft: '3px solid rgba(167,139,250,0.4)',
            }}>
              "{request.quoteNote}"
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

function LiveTrackingMap({ userLat, userLon, technicianId }) {
  const [techLocation, setTechLocation] = useState(null);

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
        <MapContainer center={customerPos} zoom={13} style={{ height: '240px', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          <FitBoundsLive pos1={customerPos} pos2={techPos} />
          <Marker position={customerPos} icon={customerIcon}><Popup>📍 Your Location</Popup></Marker>
          {techPos && <Marker position={techPos} icon={technicianIcon}><Popup>🔧 Technician (live)</Popup></Marker>}
        </MapContainer>
      </div>
  );
}

// ─── REQUEST CARD ─────────────────────────────────────────────
function RequestCard({ request, onRefresh }) {
  const [cancelLoading,  setCancelLoading]  = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading,  setRejectLoading]  = useState(false);
  const [showReview,     setShowReview]     = useState(false);

  const meta = SERVICE_META[request.serviceType] || { icon: '🔨', color: 'var(--accent)', bg: 'var(--accentbg)' };

  const cancel = async () => {
    setCancelLoading(true);
    try { await dispatchAPI.cancel(request.id); toast.success('Request cancelled'); onRefresh(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed to cancel'); }
    finally { setCancelLoading(false); }
  };

  const approve = async () => {
    setApproveLoading(true);
    try { await dispatchAPI.approveQuote(request.id); toast.success('Quote approved! Technician is on the way 🚗'); onRefresh(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed to approve'); }
    finally { setApproveLoading(false); }
  };

  const reject = async () => {
    setRejectLoading(true);
    try { await dispatchAPI.rejectQuote(request.id); toast.success('Quote rejected.'); onRefresh(); }
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
            {['APPROVED', 'IN_PROGRESS'].includes(request.status) && request.estimatedArrivalTime && (
                <ETABox estimatedArrivalTime={request.estimatedArrivalTime} distanceKm={request.distanceKm} />
            )}

            {/* Live map */}
            {['APPROVED', 'IN_PROGRESS'].includes(request.status) && request.userLatitude && request.technicianId && (
                <LiveTrackingMap userLat={request.userLatitude} userLon={request.userLongitude} technicianId={request.technicianId} />
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

            {/* Quote box */}
            {request.status === 'QUOTED' && (
                <QuoteBox
                    request={request}
                    onApprove={approve} onReject={reject}
                    approveLoading={approveLoading} rejectLoading={rejectLoading}
                />
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
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(0);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await dispatchAPI.getByUser(user.id, { page: 0, size: 50 });
      setRequests(res.data.content || []);
    } catch (e) { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

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
            <StatCard label="Total"     value={stats.total}     color="#f0f0f8" icon={<Activity size={16}/>} />
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
                        {paged.map(r => <RequestCard key={r.id} request={r} onRefresh={load} />)}
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
export function NewRequestPage() {
  const [form, setForm] = useState({
    serviceType: 'ELECTRICIAN', description: '', address: '',
    userLatitude: '', userLongitude: '',
  });
  const [loading,    setLoading]    = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const navigate = useNavigate();

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

  const selectedMeta = SERVICE_META[form.serviceType] || { color: 'var(--accent)', icon: '🔨' };

  return (
      <PageLayout>
        <div style={{ maxWidth: '620px', animation: 'fadeUp 0.4s ease' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
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
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              New Service Request
            </h1>
            <p style={{ color: 'var(--text3)', marginTop: '6px', fontSize: '14px' }}>
              Technicians will send you quotes before visiting
            </p>
          </div>

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

                {/* Service type grid */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: '10px' }}>
                    Service Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {SERVICE_TYPES.map(s => {
                      const m = SERVICE_META[s] || { icon: '🔨', color: 'var(--accent)', bg: 'var(--accentbg)' };
                      const selected = form.serviceType === s;
                      return (
                          <button key={s} type="button" onClick={() => setForm(p => ({ ...p, serviceType: s }))} style={{
                            padding: '10px 8px', borderRadius: '12px',
                            border: `1px solid ${selected ? m.color + '60' : 'var(--border)'}`,
                            background: selected ? m.bg : 'var(--bg3)',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                            boxShadow: selected ? `0 4px 12px ${m.color}20` : 'none',
                          }}>
                            <span style={{ fontSize: '20px' }}>{m.icon}</span>
                            <span style={{ fontSize: '10px', fontFamily: 'var(--font)', color: selected ? m.color : 'var(--text3)', fontWeight: selected ? 600 : 400, textAlign: 'center', lineHeight: 1.2 }}>
                          {s.replace(/_/g, ' ')}
                        </span>
                          </button>
                      );
                    })}
                  </div>
                </div>

                <Textarea label="Describe the problem"
                          placeholder="Describe the issue in detail (min 10 characters)..."
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

                <button type="button" onClick={getLocation} disabled={locLoading} style={{
                  padding: '10px 16px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg3)',
                  color: 'var(--text2)', cursor: locLoading ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontFamily: 'var(--font)', fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  opacity: locLoading ? 0.7 : 1, transition: 'all 0.2s ease',
                  alignSelf: 'flex-start',
                }}>
                  {locLoading ? <RefreshCw size={13} className="spin" /> : <MapPin size={13} />}
                  Use GPS Instead
                </button>

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
        </div>
      </PageLayout>
  );
}

// ─── USER REQUESTS PAGE ───────────────────────────────────────
export function UserRequestsPage() {
  const { user }  = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');
  const [page,     setPage]     = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await dispatchAPI.getByUser(user.id, { page: 0, size: 50 });
      setRequests(res.data.content || []);
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const STATUS_FILTERS = ['ALL','PENDING','QUOTED','APPROVED','IN_PROGRESS','COMPLETED','CANCELLED'];
  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);
  const handleFilterChange = (f) => { setFilter(f); setPage(0); };

  // Count per status for filter badges
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
                        {paged.map(r => <RequestCard key={r.id} request={r} onRefresh={load} />)}
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