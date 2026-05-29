import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { techAPI, dispatchAPI } from '../api';
import { Card, Button, Badge, Empty, LoadingScreen, ServiceIcon, Select, Input, Divider } from '../components/UI';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import JobMap from '../components/JobMap';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, PlayCircle, MapPin, Star,
  RefreshCw, ToggleLeft, ToggleRight, AlertCircle,
  Clock, FileText, Send, Navigation,
} from 'lucide-react';


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

// ─── SUBMIT QUOTE MODAL ───────────────────────────────────────
function QuoteModal({ job, onClose, onDone }) {
  const [form, setForm] = useState({ hourlyRate: '', estimatedHours: '', applianceCharge: '0', quoteNote: '' });
  const [loading, setLoading] = useState(false);

  // Calculate travel charge from distance (same formula as backend)
  const distKm = job.distanceKm || 0;
  const travelCharge = Math.max(0, distKm - 3.0) * 12.0;

  const laborCost = form.hourlyRate && form.estimatedHours
      ? parseFloat(form.hourlyRate) * parseFloat(form.estimatedHours)
      : null;

  const estimated = laborCost !== null
      ? laborCost + parseFloat(form.applianceCharge || 0)
      : null;

  const grandTotal = estimated !== null ? estimated + travelCharge : null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatchAPI.submitQuote(job.id, {
        hourlyRate:      parseFloat(form.hourlyRate),
        estimatedHours:  parseFloat(form.estimatedHours),
        applianceCharge: parseFloat(form.applianceCharge || 0),
        quoteNote:       form.quoteNote,
        technicianPhone: job.technicianPhone || ''
        // travelCharge removed — auto-calculated by system
      });
      toast.success('Quote submitted! Waiting for customer approval.');
      onDone();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit quote');
    } finally { setLoading(false); }
  };

  return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }} onClick={onClose}>
        <Card style={{ width: '100%', maxWidth: '440px', padding: '28px', animation: 'fadeUp 0.3s ease' }}
              onClick={e => e.stopPropagation()}>

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: 700 }}>Submit Quote</h2>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>
              For: <strong style={{ color: 'var(--text)' }}>{job.serviceType?.replace(/_/g,' ')}</strong> — {job.address}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="Hourly Rate (₹)" type="number" min="1" placeholder="e.g. 150"
                     value={form.hourlyRate}
                     onChange={e => setForm(p => ({ ...p, hourlyRate: e.target.value }))} required />
              <Input label="Estimated Hours" type="number" min="0.5" step="0.5" placeholder="e.g. 2"
                     value={form.estimatedHours}
                     onChange={e => setForm(p => ({ ...p, estimatedHours: e.target.value }))} required />
            </div>

            <Input label="Parts / Appliance Charge (₹)" type="number" min="0" placeholder="0 if no parts needed"
                   value={form.applianceCharge}
                   onChange={e => setForm(p => ({ ...p, applianceCharge: e.target.value }))} required />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text2)' }}>
                Notes for Customer
              </label>
              <textarea
                  placeholder="Describe what you think the issue is and what parts may be needed..."
                  value={form.quoteNote}
                  onChange={e => setForm(p => ({ ...p, quoteNote: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', minHeight: '80px', resize: 'vertical',
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius2)', color: 'var(--text)', fontSize: '13px',
                    fontFamily: 'var(--font)', outline: 'none', lineHeight: 1.6,
                  }}
              />
            </div>

            {/* Live total preview */}
            {grandTotal !== null && (
                <div style={{
                  padding: '12px 14px', background: 'var(--accentbg)',
                  borderRadius: 'var(--radius2)', border: '1px solid rgba(255,107,43,0.3)',
                }}>
                  {/* Labor */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text3)' }}>
                      {form.estimatedHours}hrs × ₹{form.hourlyRate}/hr
                    </span>
                    <span>₹{laborCost.toFixed(0)}</span>
                  </div>

                  {/* Parts */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text3)' }}>Parts / Appliances</span>
                    <span>₹{parseFloat(form.applianceCharge || 0).toFixed(0)}</span>
                  </div>

                  {/* Travel charge — read only, auto calculated */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text3)' }}>
                      Travel ({distKm.toFixed(1)}km)
                      {travelCharge === 0 ? ' — Free within 3km' : ''}
                    </span>
                    <span style={{ color: travelCharge === 0 ? '#22c55e' : 'inherit' }}>
                      {travelCharge === 0 ? 'FREE' : `₹${travelCharge.toFixed(0)}`}
                    </span>
                  </div>

                  <Divider style={{ margin: '6px 0' }} />

                  {/* Grand total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                    <span>Total Quote</span>
                    <span style={{ color: 'var(--accent)' }}>₹{grandTotal.toFixed(0)}</span>
                  </div>

                  {/* Travel charge info note */}
                  <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>
                    * Travel charge auto-calculated by system based on your distance from customer
                  </p>
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="button" variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
              <Button type="submit" fullWidth loading={loading} icon={<Send size={14} />}>
                Send Quote
              </Button>
            </div>
          </form>
        </Card>
      </div>
  );
}
// ─── COMPLETE JOB MODAL ───────────────────────────────────────
function CompleteModal({ job, onClose, onDone }) {
  const [actualHours,      setActualHours]      = useState(job.estimatedHours || '');
  const [applianceCharge,  setApplianceCharge]  = useState('');  // ← NEW: blank, technician fills after work
  const [completionNote,   setCompletionNote]   = useState('');
  const [loading,          setLoading]          = useState(false);

    const travelCharge = job.travelCharge || 0;

    const finalAmt = actualHours && applianceCharge !== ''
        ? (parseFloat(job.hourlyRate) * parseFloat(actualHours))
        + parseFloat(applianceCharge)
        + travelCharge  // ← ADD THIS
        : null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatchAPI.complete(job.id, {
        actualHours:          parseFloat(actualHours),
        actualApplianceCharge: parseFloat(applianceCharge || 0), // ← NEW
        completionNote,
      });
      toast.success('Job marked complete! 🎉');
      onDone();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to complete job');
    } finally { setLoading(false); }
  };

  return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }} onClick={onClose}>
        <Card style={{ width: '100%', maxWidth: '420px', padding: '28px', animation: 'fadeUp 0.3s ease' }}
              onClick={e => e.stopPropagation()}>

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: 700 }}>
              Complete Job
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>
              Enter actual details after completing the work
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <Input label="Actual Hours Worked" type="number" min="0.5" step="0.5"
                   placeholder={`Estimated was ${job.estimatedHours}hrs`}
                   value={actualHours}
                   onChange={e => setActualHours(e.target.value)} required />

            {/* ← NEW field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text2)' }}>
                Actual Parts / Appliance Charge (₹)
              </label>
              <input
                  type="number" min="0" step="0.01"
                  placeholder={`Estimated was ₹${job.applianceCharge} — enter actual cost`}
                  value={applianceCharge}
                  onChange={e => setApplianceCharge(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius2)', color: 'var(--text)',
                    fontSize: '14px', fontFamily: 'var(--font)', outline: 'none',
                  }}
              />
              {/* Show difference if it changed */}
              {applianceCharge !== '' &&
                  parseFloat(applianceCharge) !== job.applianceCharge && (
                      <span style={{ fontSize: '11px', color: 'var(--yellow)' }}>
                ⚠️ Differs from estimated ₹{job.applianceCharge}
              </span>
                  )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text2)' }}>
                Work Summary
              </label>
              <textarea
                  placeholder="What did you fix / replace?"
                  value={completionNote}
                  onChange={e => setCompletionNote(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', minHeight: '70px',
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius2)', color: 'var(--text)',
                    fontSize: '13px', fontFamily: 'var(--font)', outline: 'none',
                    resize: 'vertical',
                  }}
              />
            </div>

            {/* Live final amount preview */}
            {finalAmt !== null && (
                <div style={{
                  padding: '12px 14px', background: 'var(--greenbg)',
                  borderRadius: 'var(--radius2)', border: '1px solid rgba(46,204,113,0.3)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text3)' }}>
                  {actualHours}hrs × ₹{job.hourlyRate}/hr
                </span>
                    <span>₹{(parseFloat(job.hourlyRate) * parseFloat(actualHours)).toFixed(0)}</span>
                  </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text3)' }}>Actual Parts / Appliances</span>
                        <span>₹{parseFloat(applianceCharge).toFixed(0)}</span>
                    </div>

                    {/* Travel charge — read only, already saved */}
                    {travelCharge > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> Travel charge ({job.distanceKm?.toFixed(1)}km)
        </span>
                            <span>₹{travelCharge.toFixed(0)}</span>
                        </div>
                    )}
                    {travelCharge === 0 && job.distanceKm > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> Travel ({job.distanceKm?.toFixed(1)}km)
        </span>
                            <span style={{ color: '#22c55e' }}>FREE</span>
                        </div>
                    )}

                    <Divider style={{ margin: '6px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                    <span>Final Amount</span>
                    <span style={{ color: 'var(--green)' }}>₹{finalAmt.toFixed(0)}</span>
                  </div>
                  {/* Show how much it differs from the quote */}
                  {job.totalAmount && finalAmt !== job.totalAmount && (
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>
                        Quoted estimate was ₹{job.totalAmount?.toFixed(0)}
                        {finalAmt > job.totalAmount
                            ? ` (+₹${(finalAmt - job.totalAmount).toFixed(0)} over estimate)`
                            : ` (-₹${(job.totalAmount - finalAmt).toFixed(0)} under estimate)`}
                      </div>
                  )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="button" variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="success" fullWidth loading={loading}
                      icon={<CheckCircle size={14} />}>
                Mark Complete
              </Button>
            </div>
          </form>
        </Card>
      </div>
  );
}

// ─── JOB CARD ─────────────────────────────────────────────────
function JobCard({ job, mode, onRefresh, techProfile }) {
  const [loading,      setLoading]      = useState('');
  const [showQuote,    setShowQuote]    = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showMap,      setShowMap]      = useState(false);

  const statusKey = job.status?.toLowerCase();
  useEffect(() => {
    if (!['APPROVED', 'IN_PROGRESS'].includes(job.status) || !techProfile?.id) return;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(pos => {
        techAPI.updateLocation(techProfile.id, {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
        }).catch(() => {}); // silent fail
      }, () => {}); // silent fail if no GPS
    };

    sendLocation(); // send immediately on mount
    const interval = setInterval(sendLocation, 30000); // every 30 sec
    return () => clearInterval(interval); // cleanup on unmount
  }, [job.status, techProfile?.id]);

  const action = async (fn, label, successMsg) => {
    setLoading(label);
    try {
      await fn(job.id);
      toast.success(successMsg);
      onRefresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setLoading('');
    }
  };

  // Show map only when technician needs to travel or is on site
  const canShowMap = ['APPROVED', 'IN_PROGRESS'].includes(job.status) && job.userLatitude;

  return (
      <>
        <Card hover style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px', background: 'var(--accentbg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>
                <ServiceIcon type={job.serviceType} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>
                  {job.serviceType?.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <Badge variant={statusKey}>{job.status?.replace('_', ' ')}</Badge>
          </div>

          {/* ── Description ── */}
          <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>
            {job.description}
          </p>

          {/* ── Address ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: 'var(--text3)',
          }}>
            <MapPin size={12} /> {job.address}
          </div>

          {/* ── FIX 2+3: Distance and ETA — shown in browse mode when tech has location ── */}
          {mode === 'browse' && job.userLatitude && techProfile?.latitude && (() => {
            // Haversine distance calculation in frontend
            const R = 6371;
            const dLat = (job.userLatitude - techProfile.latitude) * Math.PI / 180;
            const dLon = (job.userLongitude - techProfile.longitude) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2)
                + Math.cos(techProfile.latitude * Math.PI / 180)
                * Math.cos(job.userLatitude * Math.PI / 180)
                * Math.sin(dLon/2) * Math.sin(dLon/2);
            const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const etaMin = Math.round((distKm / 30) * 60); // assuming 30km/h avg city speed
            return (
                <div style={{
                  display: 'flex', gap: '12px',
                  padding: '8px 12px', background: 'var(--bluebg)',
                  borderRadius: 'var(--radius2)', border: '1px solid rgba(52,152,219,0.3)',
                  fontSize: '12px',
                }}>
              <span style={{ color: 'var(--blue)' }}>
                📍 <strong>{distKm.toFixed(1)} km</strong> away
              </span>
                  <span style={{ color: 'var(--blue)' }}>
                ⏱️ ~<strong>{etaMin} min</strong> ETA
              </span>
                </div>
            );
          })()}

          {/* ── Customer name ── */}
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
            Customer:{' '}
            <span style={{ color: 'var(--text2)', fontWeight: 500 }}>
            {job.userName}
          </span>
          </div>

          {/* ── Quote summary (shown after quote submitted) ── */}
          {job.status !== 'PENDING' && job.totalAmount && (
              <div style={{
                padding: '10px 14px', background: 'var(--bg3)',
                borderRadius: 'var(--radius2)', fontSize: '12px',
                color: 'var(--text2)', display: 'flex', justifyContent: 'space-between',
              }}>
            <span>
              <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
              {job.estimatedHours}hrs × ₹{job.hourlyRate} + ₹{job.applianceCharge} parts
            </span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
              ₹{job.totalAmount?.toFixed(0)}
            </span>
              </div>
          )}

          {/* ── Final amount (shown after completion) ── */}
          {job.status === 'COMPLETED' && job.finalAmount && (
              <div style={{
                padding: '10px 14px', background: 'var(--greenbg)',
                borderRadius: 'var(--radius2)',
                border: '1px solid rgba(46,204,113,0.3)',
                fontSize: '13px', display: 'flex',
                justifyContent: 'space-between', fontWeight: 600,
              }}>
                <span style={{ color: 'var(--text2)' }}>Final Amount Charged</span>
                <span style={{ color: 'var(--green)' }}>₹{job.finalAmount?.toFixed(0)}</span>
              </div>
          )}

          {/* ── MAP SECTION ── */}
          {/* Shown only when status is APPROVED or IN_PROGRESS */}
          {canShowMap && (
              <div>
                <button
                    onClick={() => setShowMap(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius2)', padding: '7px 12px',
                      color: 'var(--text2)', cursor: 'pointer', fontSize: '13px',
                      fontFamily: 'var(--font)',
                      marginBottom: showMap ? '10px' : 0,
                      transition: 'all var(--transition)',
                    }}
                >
                  <Navigation size={13} />
                  {showMap ? 'Hide Map' : 'Show Map & Navigate'}
                </button>

                {showMap && (
                    <JobMap
                        userLat={job.userLatitude}
                        userLon={job.userLongitude}
                        techLat={techProfile?.latitude}
                        techLon={techProfile?.longitude}
                        address={job.address}
                    />
                )}
              </div>
          )}

          {/* ══════════════════════════════════════════════
            BROWSE MODE ACTIONS
            Technician is browsing open PENDING requests
        ══════════════════════════════════════════════ */}
          {mode === 'browse' && job.status === 'PENDING' && (
              <Button
                  variant="primary" size="sm" fullWidth
                  icon={<FileText size={13} />}
                  onClick={() => setShowQuote(true)}
              >
                Submit Quote
              </Button>
          )}

          {/* ══════════════════════════════════════════════
            MY JOBS MODE ACTIONS
            Technician is managing their own assigned jobs
        ══════════════════════════════════════════════ */}
          {mode === 'mine' && (
              <>
                {/* QUOTED — waiting for user to approve */}
                {job.status === 'QUOTED' && (
                    <div style={{
                      padding: '8px 12px', background: 'var(--yellowbg)',
                      borderRadius: 'var(--radius2)',
                      border: '1px solid rgba(243,156,18,0.3)',
                      fontSize: '12px', color: 'var(--yellow)', textAlign: 'center',
                    }}>
                      ⏳ Waiting for customer to approve your quote
                    </div>
                )}

                {/* APPROVED — user approved, technician should travel and start */}
                {job.status === 'APPROVED' && (
                    <Button
                        variant="primary" size="sm"
                        icon={<PlayCircle size={13} />}
                        loading={loading === 'progress'}
                        onClick={() => action(
                            dispatchAPI.markInProgress,
                            'progress',
                            'Job started! You are on site.'
                        )}
                    >
                      Arrived — Start Job
                    </Button>
                )}

                {/* IN_PROGRESS — technician is working, can mark complete */}
                {job.status === 'IN_PROGRESS' && (
                    <Button
                        variant="success" size="sm"
                        icon={<CheckCircle size={13} />}
                        onClick={() => setShowComplete(true)}
                    >
                      Mark Complete
                    </Button>
                )}
              </>
          )}

        </Card>

        {/* ── Modals ── */}
        {showQuote && (() => {
          const R = 6371;
          const dLat = (job.userLatitude - techProfile.latitude) * Math.PI / 180;
          const dLon = (job.userLongitude - techProfile.longitude) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2)
              + Math.cos(techProfile.latitude * Math.PI / 180)
              * Math.cos(job.userLatitude * Math.PI / 180)
              * Math.sin(dLon/2) * Math.sin(dLon/2);
          const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return (
              <QuoteModal
                  job={{ ...job, distanceKm: distKm, technicianPhone: techProfile?.phone || '' }}
                  onClose={() => setShowQuote(false)}
                  onDone={onRefresh}
              />
          );
        })()}
        {showComplete && (
            <CompleteModal
                job={job}
                onClose={() => setShowComplete(false)}
                onDone={onRefresh}
            />
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
          setForm(p => ({
            ...p,
            latitude:  pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }));
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
          <div style={{ width: '100%', maxWidth: '520px', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔧</div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '26px', fontWeight: 800 }}>
                Complete Your Profile
              </h1>
              <p style={{ color: 'var(--text2)', marginTop: '6px' }}>
                Set up your technician profile to start receiving jobs
              </p>
            </div>

            <Card style={{ padding: '28px' }}>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Input label="Phone Number" placeholder="10-digit phone number"
                       value={form.phone} maxLength={10}
                       onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: '10px' }}>
                    Services You Offer <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {SERVICE_TYPES.map(s => {
                      const selected = form.serviceTypes.includes(s);
                      return (
                          <button key={s} type="button" onClick={() => toggleService(s)} style={{
                            padding: '10px 12px', borderRadius: 'var(--radius2)',
                            border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                            background: selected ? 'var(--accentbg)' : 'var(--bg3)',
                            color: selected ? 'var(--accent)' : 'var(--text2)',
                            cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'all var(--transition)',
                          }}>
                            <ServiceIcon type={s} /> {s.replace(/_/g, ' ')}
                          </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
                    Your Location <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional, update later)</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <Input placeholder="Latitude" value={form.latitude}
                           onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} />
                    <Input placeholder="Longitude" value={form.longitude}
                           onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} />
                  </div>
                  <Button type="button" variant="secondary" size="sm" loading={locLoading}
                          icon={<MapPin size={13} />} onClick={getLocation}>
                    Use My Current Location
                  </Button>
                </div>

                <Button type="submit" loading={loading} fullWidth size="lg">Create Profile</Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
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

  const loadProfile = useCallback(async () => {
    try {
      const res = await techAPI.getByUserId(user.id);
      setProfile(res.data);
      setSetupNeeded(false);
    } catch (e) {
      if (e.response?.status === 404) setSetupNeeded(true);
    } finally { setProfileLoading(false); }
  }, [user.id]);

  // Load jobs AND refresh profile (for updated stats) together
  const loadJobs = useCallback(async (currentProfile) => {
    const p = currentProfile || profile;
    if (!p) return;
    try {
      const [jobsRes, profileRes] = await Promise.all([
        dispatchAPI.getByTechnician(p.userId, { page: 0, size: 50 }),
        techAPI.getByUserId(user.id),
      ]);
      setJobs(jobsRes.data.content || []);
      setProfile(profileRes.data); // ← refreshes completedJobs and rating from backend
    } catch (e) {}
  }, [profile, user.id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => {
    if (!profile) return;

    loadJobs(profile);                                    // load immediately

    const interval = setInterval(() => {                  // then every 15s
      loadJobs(profile);
    }, 10000);

    return () => clearInterval(interval);                 // cleanup on unmount

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
    navigator.geolocation.getCurrentPosition(
        async pos => {
          try {
            await techAPI.updateLocation(profile.id, {
              latitude:  pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            setProfile(p => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
            toast.success('Location updated!');
          } catch (e) { toast.error('Failed to update location'); }
          finally { setLocLoading(false); }
        },
        () => { toast.error('Could not get location'); setLocLoading(false); }
    );
  };

  if (profileLoading) return <><Navbar /><LoadingScreen /></>;
  if (setupNeeded)    return <TechnicianSetup onComplete={loadProfile} />;

  // Compute stats from LIVE jobs list — not hardcoded old statuses
  const activeJobs    = jobs.filter(j => ['QUOTED','APPROVED','IN_PROGRESS'].includes(j.status));
  const availStatus   = profile?.availabilityStatus;

  return (
      <PageLayout>
        <div style={{ animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                Hello, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p style={{ color: 'var(--text2)', marginTop: '4px' }}>
                {profile?.serviceTypes?.map(s => s.replace(/_/g,' ')).join(' · ')}
              </p>
            </div>
            <Badge variant={availStatus?.toLowerCase()}>{availStatus}</Badge>
          </div>

          {/* Stats — pulled from backend profile for accuracy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
            <Card style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--accent)' }}>
                {activeJobs.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>Active Jobs</div>
            </Card>
            <Card style={{ textAlign: 'center' }}>
              {/* completedJobs comes from technician-service profile — updated when rating is submitted */}
              <div style={{ fontSize: '26px', fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--green)' }}>
                {profile?.completedJobs ?? 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>Completed</div>
            </Card>
            <Card style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--yellow)' }}>
                {profile?.rating != null ? Number(profile.rating).toFixed(1) : '0.0'}
                <Star size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
                Rating ({profile?.totalRatings ?? 0} reviews)
              </div>
            </Card>
          </div>

          {/* Quick actions */}
          <Card style={{ marginBottom: '28px' }}>
            <div style={{ fontWeight: 600, marginBottom: '14px', fontFamily: 'var(--font-head)' }}>Quick Actions</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button
                  variant={availStatus === 'AVAILABLE' ? 'danger' : 'success'}
                  loading={availLoading}
                  icon={availStatus === 'AVAILABLE' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  onClick={toggleAvailability}>
                {availStatus === 'AVAILABLE' ? 'Go Offline' : 'Go Online'}
              </Button>
              <Button variant="secondary" loading={locLoading}
                      icon={<MapPin size={14} />} onClick={updateLocation}>
                Update Location
              </Button>
            </div>
            {availStatus === 'OFFLINE' && (
                <div style={{
                  marginTop: '14px', padding: '10px 14px', background: 'var(--yellowbg)',
                  borderRadius: 'var(--radius2)', border: '1px solid rgba(243,156,18,0.3)',
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--yellow)',
                }}>
                  <AlertCircle size={14} /> Go Online to start browsing and receiving job requests
                </div>
            )}
          </Card>

          {/* Recent jobs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700 }}>Recent Jobs</h2>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={handleRefresh}>
              Refresh
            </Button>
          </div>

          {jobs.length === 0
              ? <Empty icon="💼" title="No jobs yet" subtitle="Go online and browse available jobs" />
              : <div style={{ display: 'grid', gap: '12px' }}>
                {jobs.slice(0, 5).map(j => (
                    <JobCard key={j.id} job={j} mode="mine" onRefresh={handleRefresh} techProfile={profile} />
                ))}
              </div>
          }
        </div>
      </PageLayout>
  );
}

// ─── BROWSE JOBS ──────────────────────────────────────────────
export function BrowseJobsPage() {
  const { user }  = useAuth();
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    techAPI.getByUserId(user.id).then(r => {
      setProfile(r.data);
      if (r.data.serviceTypes && r.data.serviceTypes.length > 0) {
        const firstType = [...r.data.serviceTypes][0];
        setActiveTab(firstType);
        searchForType(firstType, r.data);
      }
    }).catch(() => {});
  }, [user.id]);

  const searchForType = async (type, profileData) => {
    const tech = profileData || profile;
    setActiveTab(type);
    setLoading(true);
    try {
      const res = await dispatchAPI.getAvailable(type, { page: 0, size: 100 });
      const allJobs = res.data.content || [];

      // Filter by 20km radius
      const filtered = tech?.latitude && tech?.longitude
          ? allJobs.filter(job => {
            if (!job.userLatitude || !job.userLongitude) return true;
            const R = 6371;
            const dLat = (job.userLatitude - tech.latitude) * Math.PI / 180;
            const dLon = (job.userLongitude - tech.longitude) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2)
                + Math.cos(tech.latitude * Math.PI / 180)
                * Math.cos(job.userLatitude * Math.PI / 180)
                * Math.sin(dLon/2) * Math.sin(dLon/2);
            const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return distKm <= 20;
          })
          : allJobs;

      setJobs(filtered);
    } catch (e) { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  // Block BUSY technicians from browsing
  if (profile && (profile.availabilityStatus === 'BUSY')) {
    return (
        <PageLayout>
          <div style={{ animation: 'fadeUp 0.4s ease', textAlign: 'center', marginTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔧</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
              You're currently on a job
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px' }}>
              Complete your current job before browsing new requests
            </p>
            <Button onClick={() => navigate('/technician/jobs')}>
              View My Current Job
            </Button>
          </div>
        </PageLayout>
    );}
    if (profile && (profile.availabilityStatus === 'OFFLINE')) {
      return (
          <PageLayout>
            <div style={{animation: 'fadeUp 0.4s ease', textAlign: 'center', marginTop: '60px'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>🔧</div>
              <h2 style={{fontFamily: 'var(--font-head)', fontSize: '22px', fontWeight: 700, marginBottom: '8px'}}>
                You're currently offline
              </h2>
              <p style={{color: 'var(--text2)', fontSize: '14px', marginBottom: '24px'}}>
                Please set your availability to online before browsing new requests
              </p>

            </div>
          </PageLayout>
      );
    }

  return (
      <PageLayout>
        <div style={{ animation: 'fadeUp 0.4s ease' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Browse Jobs
            </h1>
            <p style={{ color: 'var(--text2)', marginTop: '6px' }}>
              Showing open requests within 20km of your location
            </p>
          </div>

          {profile?.serviceTypes && profile.serviceTypes.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[...profile.serviceTypes].map(s => (
                    <button key={s} onClick={() => searchForType(s, profile)} style={{
                      padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                      borderColor: activeTab === s ? 'var(--accent)' : 'var(--border)',
                      background:  activeTab === s ? 'var(--accentbg)' : 'var(--bg3)',
                      color:       activeTab === s ? 'var(--accent)' : 'var(--text2)',
                      fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font)',
                      fontWeight: activeTab === s ? 600 : 400,
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'all var(--transition)',
                    }}>
                      <ServiceIcon type={s} />
                      {s.replace(/_/g, ' ')}
                    </button>
                ))}
              </div>
          )}

          {loading ? <LoadingScreen />
              : jobs.length === 0
                  ? <Empty icon="🔍" title="No open jobs within 20km"
                           subtitle="No pending requests in your area right now. Check back soon!" />
                  : (
                      <>
                        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
                          {jobs.length} open job{jobs.length !== 1 ? 's' : ''} within 20km for {activeTab?.replace(/_/g, ' ')}
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

  return (
      <PageLayout>
        <div style={{ animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              My Jobs
            </h1>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={reload}>Refresh</Button>
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
                }}>{s.replace('_', ' ')}</button>
            ))}
          </div>

          {loading ? <LoadingScreen /> : filtered.length === 0
              ? <Empty icon="💼" title="No jobs found" subtitle="Submit quotes from Browse Jobs tab" />
              : <div style={{ display: 'grid', gap: '12px' }}>
                {filtered.map(j => <JobCard key={j.id} job={j} mode="mine" onRefresh={reload} techProfile={profile}/>)}
              </div>
          }
        </div>
      </PageLayout>
  );
}