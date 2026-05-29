import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dispatchAPI, techAPI } from '../api';
import { Card, Button, Badge, Empty, LoadingScreen, ServiceIcon, Divider, Textarea, Input, Select } from '../components/UI';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
// ─── LIVE TRACKING MAP ────────────────────────────────────────
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Plus, MapPin, XCircle, RefreshCw, CheckCircle, Star, IndianRupee, Clock, FileText } from 'lucide-react';

const SERVICE_TYPES = ['ELECTRICIAN','PLUMBER','AC_REPAIR','CARPENTER','PAINTER','CLEANER','APPLIANCE_REPAIR','PEST_CONTROL'];

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

// ─── REVIEW MODAL ─────────────────────────────────────────────
function ReviewModal({ request, onClose, onDone }) {
  const [rating,  setRating]  = useState(5);
  const [hovered, setHovered] = useState(0);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await techAPI.updateRating(request.technicianId, { rating });
      await dispatchAPI.markAsRated(request.id);
      toast.success('Review submitted! Thank you 🙏');
      onDone();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit review');
    } finally { setLoading(false); }
  };

  return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }} onClick={onClose}>
        <Card style={{ width: '100%', maxWidth: '400px', padding: '28px', animation: 'fadeUp 0.3s ease' }}
              onClick={e => e.stopPropagation()}>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>⭐</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: 700 }}>
              Rate your experience
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '6px' }}>
              How was <strong style={{ color: 'var(--text)' }}>{request.technicianName}</strong>?
            </p>
          </div>

          {/* Star rating picker */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button"
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHovered(s)}
                        onMouseLeave={() => setHovered(0)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                          transition: 'transform 0.1s ease',
                          transform: (hovered || rating) >= s ? 'scale(1.2)' : 'scale(1)',
                        }}>
                  <Star size={36}
                        fill={(hovered || rating) >= s ? 'var(--yellow)' : 'none'}
                        color={(hovered || rating) >= s ? 'var(--yellow)' : 'var(--border2)'}
                  />
                </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: 'var(--text2)' }}>
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating]}
          </div>

          {/* Price summary */}
          {request.finalAmount && (
              <div style={{
                padding: '14px', background: 'var(--bg3)', borderRadius: 'var(--radius2)',
                marginBottom: '20px', fontSize: '13px',
              }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text2)' }}>Job Summary</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text3)' }}>
                    Service ({request.actualHours}hrs × ₹{request.hourlyRate}/hr)
                  </span>
                  <span>₹{(request.hourlyRate * request.actualHours).toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text3)' }}>Parts / Appliances</span>
                  <span>₹{request.actualApplianceCharge?.toFixed(0)}</span>
                </div>
                {request.travelCharge > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> Travel charge
                      </span>
                      <span>₹{request.travelCharge?.toFixed(0)}</span>
                    </div>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px' }}>
                  <span>Total Paid</span>
                  <span style={{ color: 'var(--green)' }}>₹{request.finalAmount?.toFixed(0)}</span>
                </div>
              </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="ghost" fullWidth onClick={onClose}>Skip</Button>
            <Button fullWidth loading={loading} onClick={submit} icon={<Star size={14} />}>
              Submit Review
            </Button>
          </div>
        </Card>
      </div>
  );
}

// ─── QUOTE DETAILS BOX ────────────────────────────────────────
function QuoteBox({ request, onApprove, onReject, approveLoading, rejectLoading }) {
  return (
      <div style={{
        padding: '16px', background: 'var(--bg3)', borderRadius: 'var(--radius2)',
        border: '1px solid rgba(243,156,18,0.3)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '12px', color: 'var(--yellow)', fontWeight: 600, fontSize: '13px',
        }}>
          <FileText size={14} /> Quote from {request.technicianName}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              Service ({request.estimatedHours}hrs × ₹{request.hourlyRate}/hr)
            </span>
            <span>₹{(request.hourlyRate * request.estimatedHours).toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text3)' }}>Parts / Appliances (estimated)</span>
            <span>₹{request.applianceCharge?.toFixed(0)}</span>
          </div>
          {/* TRAVEL CHARGE */}
          {request.travelCharge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> Travel charge
                  {request.distanceKm && (
                      <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      ({request.distanceKm.toFixed(1)}km)
                    </span>
                  )}
                </span>
                <span>₹{request.travelCharge?.toFixed(0)}</span>
              </div>
          )}
          {/* Show FREE travel if within 3km */}
          {request.travelCharge === 0 && request.distanceKm > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> Travel charge ({request.distanceKm?.toFixed(1)}km)
                </span>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>FREE</span>
              </div>
          )}
          <Divider style={{ margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px' }}>
            <span>Estimated Total</span>
            <span style={{ color: 'var(--accent)' }}>₹{request.totalAmount?.toFixed(0)}</span>
          </div>
        </div>

        {request.quoteNote && (
            <div style={{
              padding: '8px 12px', background: 'var(--bg2)', borderRadius: 'var(--radius2)',
              fontSize: '12px', color: 'var(--text2)', marginBottom: '12px', fontStyle: 'italic',
            }}>
              "{request.quoteNote}"
            </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="success" size="sm" fullWidth loading={approveLoading}
                  icon={<CheckCircle size={13} />} onClick={onApprove}>
            Approve & Book
          </Button>
          <Button variant="danger" size="sm" fullWidth loading={rejectLoading}
                  icon={<XCircle size={13} />} onClick={onReject}>
            Reject
          </Button>
        </div>
      </div>
  );
}

// ─── ETA BOX ──────────────────────────────────────────────────
function ETABox({ estimatedArrivalTime, distanceKm }) {
  if (!estimatedArrivalTime) return null;

  const arrival = new Date(estimatedArrivalTime);
  const now = new Date();
  const diffMs = arrival - now;
  const diffMins = Math.max(0, Math.round(diffMs / 60000));

  return (
      <div style={{
        padding: '12px 16px',
        background: 'rgba(34,197,94,0.08)',
        borderRadius: 'var(--radius2)',
        border: '1px solid rgba(34,197,94,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
          }}>
            🚗
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>
              Technician is on the way
              {distanceKm && (
                  <span> · {distanceKm.toFixed(1)}km away</span>
              )}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>
              {diffMins > 0
                  ? `Arriving in ~${diffMins} min`
                  : 'Arriving any moment now'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>ETA</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>
            {arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
  );
}

// ─── LIVE TRACKING MAP ────────────────────────────────────────
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
    if (pos1 && pos2) {
      map.fitBounds(L.latLngBounds([pos1, pos2]), { padding: [40, 40] });
    }
  }, [pos1, pos2, map]);
  return null;
}

function LiveTrackingMap({ userLat, userLon, technicianId }) {
  const [techLocation, setTechLocation] = useState(null);

  useEffect(() => {
    if (!technicianId) return;

    const fetchLocation = async () => {
      try {
        const res = await techAPI.getByUserId(technicianId);
        if (res.data?.latitude && res.data?.longitude) {
          setTechLocation({ lat: res.data.latitude, lon: res.data.longitude });
        }
      } catch (e) {}
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 30000);
    return () => clearInterval(interval);
  }, [technicianId]);

  const customerPos    = userLat && userLon ? [userLat, userLon] : null;
  const techPos        = techLocation ? [techLocation.lat, techLocation.lon] : null;
  const mapCenter      = customerPos || [17.3850, 78.4867];

  if (!customerPos) return null;

  return (
      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Legend */}
        <div style={{
          padding: '8px 14px', background: 'var(--bg3)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between',
          fontSize: '12px', color: 'var(--text2)',
        }}>
          <span>
            🔴 Your location &nbsp;&nbsp; 🔵 Technician
          </span>
          <span style={{ color: 'var(--text3)' }}>
            {techPos ? '🟢 Live' : '⏳ Locating technician...'}
          </span>
        </div>

        <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '260px', width: '100%' }}
            scrollWheelZoom={false}
        >
          <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
          />

          <FitBoundsLive pos1={customerPos} pos2={techPos} />

          {/* Customer — red pin */}
          <Marker position={customerPos} icon={customerIcon}>
            <Popup>📍 Your Location</Popup>
          </Marker>

          {/* Technician — blue pin (updates every 30 sec) */}
          {techPos && (
              <Marker position={techPos} icon={technicianIcon}>
                <Popup>🔧 Technician (live)</Popup>
              </Marker>
          )}
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
  const statusKey = request.status?.toLowerCase();

  const cancel = async () => {
    setCancelLoading(true);
    try {
      await dispatchAPI.cancel(request.id);
      toast.success('Request cancelled');
      onRefresh();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to cancel'); }
    finally { setCancelLoading(false); }
  };

  const approve = async () => {
    setApproveLoading(true);
    try {
      await dispatchAPI.approveQuote(request.id);
      toast.success('Quote approved! Technician is on the way 🚗');
      onRefresh();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to approve'); }
    finally { setApproveLoading(false); }
  };

  const reject = async () => {
    setRejectLoading(true);
    try {
      await dispatchAPI.rejectQuote(request.id);
      toast.success('Quote rejected. Looking for other technicians...');
      onRefresh();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to reject'); }
    finally { setRejectLoading(false); }
  };

  return (
      <>
        <Card hover style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px', background: 'var(--accentbg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>
                <ServiceIcon type={request.serviceType} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>
                  {request.serviceType?.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  {new Date(request.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </div>
              </div>
            </div>
            <Badge variant={statusKey}>{request.status?.replace('_', ' ')}</Badge>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>
            {request.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text3)' }}>
            <MapPin size={12} /> {request.address}
          </div>

          {/* Technician assigned */}
          {request.technicianName && request.status !== 'QUOTED' && (
              <div style={{
                padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius2)',
                fontSize: '13px', display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ color: 'var(--text2)' }}>Technician</span>
                <span style={{ fontWeight: 500 }}>{request.technicianName}</span>
              </div>
          )}

          {/* ETA box — show when APPROVED or IN_PROGRESS */}
          {['APPROVED', 'IN_PROGRESS'].includes(request.status) && request.estimatedArrivalTime && (
              <ETABox
                  estimatedArrivalTime={request.estimatedArrivalTime}
                  distanceKm={request.distanceKm}
              />
          )}
          {/* Live tracking map ← ADD THIS */}
          {['APPROVED', 'IN_PROGRESS'].includes(request.status) &&
              request.userLatitude && request.technicianId && (
                  <LiveTrackingMap
                      userLat={request.userLatitude}
                      userLon={request.userLongitude}
                      technicianId={request.technicianId}
                  />
              )}
          {['APPROVED', 'IN_PROGRESS'].includes(request.status) && request.technicianPhone && (
              <div style={{
                padding: '10px 14px', background: 'var(--bg3)',
                borderRadius: 'var(--radius2)', fontSize: '13px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center'
              }}>
        <span style={{ color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📞 Contact Technician
        </span>
                <a href={`tel:${request.technicianPhone}`}
                   style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                  {request.technicianPhone}
                </a>
              </div>
          )}

          {/* Final amount for completed jobs */}
          {request.status === 'COMPLETED' && request.finalAmount && (
              <div style={{
                padding: '10px 14px', background: 'var(--greenbg)',
                borderRadius: 'var(--radius2)', border: '1px solid rgba(46,204,113,0.3)',
                fontSize: '13px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text3)' }}>
                    Service ({request.actualHours}hrs × ₹{request.hourlyRate}/hr)
                  </span>
                  <span>₹{(request.hourlyRate * request.actualHours).toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text3)' }}>Parts / Appliances</span>
                  <span>₹{request.actualApplianceCharge?.toFixed(0)}</span>
                </div>
                {request.travelCharge > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> Travel charge
                      </span>
                      <span>₹{request.travelCharge?.toFixed(0)}</span>
                    </div>
                )}
                <Divider style={{ margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total Paid</span>
                  <span style={{ color: 'var(--green)' }}>₹{request.finalAmount?.toFixed(0)}</span>
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

          {/* Cancel button */}
          {['PENDING'].includes(request.status) && (
              <Button variant="danger" size="sm" loading={cancelLoading}
                      onClick={cancel} icon={<XCircle size={13} />}>
                Cancel Request
              </Button>
          )}

          {/* Rate button */}
          {request.status === 'COMPLETED' && request.technicianId && !request.rated && (
              <Button variant="secondary" size="sm"
                      icon={<Star size={13} />} onClick={() => setShowReview(true)}>
                Rate Technician
              </Button>
          )}

          {/* Already rated */}
          {request.status === 'COMPLETED' && request.rated && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: 'var(--green)',
                padding: '6px 10px', background: 'var(--greenbg)',
                borderRadius: 'var(--radius2)',
              }}>
                <CheckCircle size={13} />
                You have already rated this job
              </div>
          )}
        </Card>

        {showReview && (
            <ReviewModal
                request={request}
                onClose={() => setShowReview(false)}
                onDone={onRefresh}
            />
        )}
      </>
  );
}

// ─── USER DASHBOARD ───────────────────────────────────────────
export function UserDashboard() {
  const { user }  = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
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
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                Hello, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p style={{ color: 'var(--text2)', marginTop: '4px' }}>Manage your service requests</p>
            </div>
            <Button icon={<Plus size={15} />} onClick={() => navigate('/user/new-request')}>
              New Request
            </Button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '32px' }}>
            {[
              { label: 'Total',     value: stats.total,     color: 'var(--text)'   },
              { label: 'Pending',   value: stats.pending,   color: 'var(--text2)'  },
              { label: 'Quoted',    value: stats.quoted,    color: 'var(--yellow)' },
              { label: 'Active',    value: stats.active,    color: 'var(--accent)' },
              { label: 'Completed', value: stats.completed, color: 'var(--green)'  },
            ].map(stat => (
                <Card key={stat.label} style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '26px', fontFamily: 'var(--font-head)', fontWeight: 800, color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>{stat.label}</div>
                </Card>
            ))}
          </div>

          {/* Pending quote alert */}
          {stats.quoted > 0 && (
              <div style={{
                padding: '12px 16px', background: 'var(--yellowbg)', borderRadius: 'var(--radius2)',
                border: '1px solid rgba(243,156,18,0.3)', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--yellow)',
              }}>
                <FileText size={14} />
                <strong>{stats.quoted} quote{stats.quoted > 1 ? 's' : ''}</strong> waiting for your approval
              </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700 }}>Recent Requests</h2>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={load}>Refresh</Button>
          </div>

          {loading ? <LoadingScreen /> : requests.length === 0
              ? <Empty icon="📋" title="No requests yet" subtitle="Create your first service request" />
              : <div style={{ display: 'grid', gap: '12px' }}>
                {requests.map(r => <RequestCard key={r.id} request={r} onRefresh={load} />)}
              </div>
          }
        </div>
      </PageLayout>
  );
}
// ─── ADDRESS AUTOCOMPLETE ─────────────────────────────────────
function AddressAutocomplete({ value, onChange, onLocationSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = React.useRef(null);

  const search = (query) => {
    onChange(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) { setSuggestions([]); setShowDropdown(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`;
        const url = `https://corsproxy.io/?${encodeURIComponent(nominatimUrl)}`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data);
        setShowDropdown(true);
      } catch (e) {
        console.error('Address search failed:', e);
      } finally { setLoading(false); }
    }, 500);
  };

  const select = (item) => {
    onChange(item.display_name);
    onLocationSelect(parseFloat(item.lat), parseFloat(item.lon));
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClick = () => setShowDropdown(false);
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
      <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
        <Input
            label="Address"
            placeholder="Start typing your address..."
            value={value}
            onChange={e => search(e.target.value)}
            icon={loading ? <RefreshCw size={15} className="spin" /> : <MapPin size={15} />}
        />
        {showDropdown && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius2)', zIndex: 100,
              maxHeight: '200px', overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
              {suggestions.map((s, i) => (
                  <div key={i} onClick={() => select(s)}
                       style={{
                         padding: '10px 14px', cursor: 'pointer',
                         fontSize: '13px', color: 'var(--text2)',
                         borderBottom: '1px solid var(--border)',
                       }}
                       onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <MapPin size={11} style={{ marginRight: '6px', opacity: 0.5 }} />
                    {s.display_name}
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}
// ─── NEW REQUEST ──────────────────────────────────────────────
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
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          setForm(p => ({
            ...p,
            userLatitude:  lat.toFixed(6),
            userLongitude: lon.toFixed(6),
          }));

          // Reverse geocode using allorigins proxy (works with Nominatim)
          try {
            const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
            const url = `https://api.allorigins.win/get?url=${encodeURIComponent(nominatimUrl)}`;
            const res = await fetch(url);
            const json = await res.json();
            const data = JSON.parse(json.contents);
            if (data.display_name) {
              setForm(p => ({ ...p, address: data.display_name }));
              toast.success('Location & address detected! ✅');
            } else {
              toast.success('Location detected!');
            }
          } catch (e) {
            console.error('Reverse geocode failed:', e);
            toast.success('Location detected! Please type your address manually.');
          }

          setLocLoading(false);
        },
        () => { toast.error('Could not get location'); setLocLoading(false); }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.userLatitude || !form.userLongitude) {
      toast.error('Please set your location first'); return;
    }
    setLoading(true);
    try {
      await dispatchAPI.createRequest({
        ...form,
        userLatitude:  parseFloat(form.userLatitude),
        userLongitude: parseFloat(form.userLongitude),
      });
      toast.success('Request created! Technicians will send you quotes shortly.');
      navigate('/user/requests');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create request'); }
    finally { setLoading(false); }
  };

  return (
      <PageLayout>
        <div style={{ maxWidth: '600px', animation: 'fadeUp 0.4s ease' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              New Service Request
            </h1>
            <p style={{ color: 'var(--text2)', marginTop: '6px' }}>
              Describe what you need — technicians will send you quotes before visiting
            </p>
          </div>

          <Card style={{ padding: '28px' }}>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Select label="Service Type" value={form.serviceType}
                      onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))}>
                {SERVICE_TYPES.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </Select>

              <Textarea label="Description"
                        placeholder="Describe the problem in detail (min 10 characters)..."
                        value={form.description} minLength={10}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />

              <AddressAutocomplete
                  value={form.address}
                  onChange={addr => setForm(p => ({ ...p, address: addr }))}
                  onLocationSelect={(lat, lon) => {
                    setForm(p => ({
                      ...p,
                      userLatitude: lat.toFixed(6),
                      userLongitude: lon.toFixed(6)
                    }));
                    toast.success('Location auto-detected! ✅');
                  }}
              />

              {/* Show confirmed coordinates */}
              {form.userLatitude && form.userLongitude && (
                  <div style={{
                    padding: '8px 12px', background: 'var(--bg3)',
                    borderRadius: 'var(--radius2)', fontSize: '12px',
                    color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <CheckCircle size={12} />
                    Location set: {form.userLatitude}, {form.userLongitude}
                  </div>
              )}

              {/* GPS fallback */}
              <Button type="button" variant="secondary" size="sm"
                      loading={locLoading} icon={<MapPin size={13} />}
                      onClick={getLocation}>
                Use GPS Instead
              </Button>

              <Divider />
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button type="button" variant="ghost" onClick={() => navigate('/user/dashboard')} fullWidth>
                  Cancel
                </Button>
                <Button type="submit" loading={loading} fullWidth icon={<Plus size={14} />}>
                  Submit Request
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </PageLayout>
  );
}

// ─── ALL USER REQUESTS ────────────────────────────────────────
export function UserRequestsPage() {
  const { user }  = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');

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

  return (
      <PageLayout>
        <div style={{ animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              My Requests
            </h1>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={load}>Refresh</Button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(s => (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: '5px 14px', borderRadius: '20px', border: '1px solid',
                  borderColor: filter === s ? 'var(--accent)' : 'var(--border)',
                  background:  filter === s ? 'var(--accentbg)' : 'transparent',
                  color:       filter === s ? 'var(--accent)' : 'var(--text2)',
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font)',
                  transition: 'all var(--transition)',
                }}>{s.replace(/_/g, ' ')}</button>
            ))}
          </div>

          {loading ? <LoadingScreen /> : filtered.length === 0
              ? <Empty icon="📋" title="No requests found" subtitle="Try a different filter" />
              : <div style={{ display: 'grid', gap: '12px' }}>
                {filtered.map(r => <RequestCard key={r.id} request={r} onRefresh={load} />)}
              </div>
          }
        </div>
      </PageLayout>
  );
}