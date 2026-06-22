import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Shield, MapPin, Star, ChevronRight, Wrench, Droplets, Wind, Paintbrush, Plug, Bug, Hammer, ArrowRight, Sun, Moon, Scissors, Wifi, Sparkles, Heart, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── CONSTANTS ────────────────────────────────────────────────
const SERVICES = [
    { icon: Zap,        label: 'Electrician',    desc: 'Wiring, panels, outlets',   color: '#f39c12' },
    { icon: Droplets,   label: 'Plumber',        desc: 'Pipes, leaks, drainage',    color: '#3498db' },
    { icon: Wind,       label: 'AC Repair',      desc: 'Install, service, repair',  color: '#2ecc71' },
    { icon: Hammer,     label: 'Carpenter',      desc: 'Furniture, fixtures, doors',color: '#e67e22' },
    { icon: Paintbrush, label: 'Painter',        desc: 'Interior, exterior, touch-ups', color: '#9b59b6' },
    { icon: Wrench,     label: 'Appliance Repair',desc: 'Washing machine, fridge, AC', color: '#ff6b2b' },
    { icon: Plug,       label: 'Cleaner',        desc: 'Deep clean, regular service', color: '#1abc9c' },
    { icon: Bug,        label: 'Pest Control',   desc: 'Insects, rodents, termites', color: '#e74c3c' },
    { icon: Scissors,   label: 'Tailoring',      desc: 'Alterations & stitching',   color: '#ec4899' },
    { icon: Wifi,       label: 'Networking Tech',desc: 'Router & Wi-Fi configuration',color: '#14b8a6' },
    { icon: Sparkles,   label: 'Beautician',     desc: 'Salon & grooming at home',  color: '#d946ef' },
    { icon: Heart,      label: 'Mehandi Artist', desc: 'Beautiful henna designs',   color: '#84cc16' },
    { icon: Users,      label: 'General Helper', desc: 'Shifting & heavy lifting support',color: '#6366f1' },
];

const STATS = [
    { value: '50K+', label: 'Jobs Completed' },
    { value: '4.9★', label: 'Avg. Rating' },
    { value: '15min', label: 'Avg. Response' },
    { value: '2000+', label: 'Service Pros' },
];

const HOW_IT_WORKS = [
    { step: '01', title: 'Describe your service', desc: 'Tell us what you need — tailoring, beauty, repairs, and more.' },
    { step: '02', title: 'Get matched instantly', desc: 'Our system finds the nearest available verified professional.' },
    { step: '03', title: 'Track in real time', desc: 'Watch your service provider en-route. Live map, live updates.' },
    { step: '04', title: 'Service completed', desc: 'Rate your experience and pay — all in the app.' },
];

const REVIEWS = [
    { name: 'Priya S.', role: 'Homeowner', text: 'AC stopped working at 11pm. Technician arrived in 20 minutes. Lifesaver!', rating: 5 },
    { name: 'Rahul M.', role: 'Apartment Tenant', text: 'Plumbing leak fixed same afternoon. Super professional and clean.', rating: 5 },
    { name: 'Ananya K.', role: 'Office Manager', text: 'Booked 3 electricians for our new office setup. All showed up on time.', rating: 5 },
];

// ─── ANIMATED COUNTER ─────────────────────────────────────────
function AnimatedCounter({ value }) {
    const [display, setDisplay] = useState('0');
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setDisplay(value);
                observer.disconnect();
            }
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value]);
    return <span ref={ref} style={{ transition: 'all 0.5s ease' }}>{display}</span>;
}

// ─── NOISE TEXTURE SVG ────────────────────────────────────────
function NoiseOverlay() {
    return (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none', zIndex: 1 }} xmlns="http://www.w3.org/2000/svg">
            <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
    );
}

// ─── HERO SECTION ─────────────────────────────────────────────
function Hero({ onGetStarted }) {
    const { isLoggedIn, user } = useAuth();
    const navigate = useNavigate();

    const handleAction = () => {
        if (isLoggedIn) {
            navigate(user?.role === 'TECHNICIAN' ? '/technician/dashboard' : '/user/dashboard');
        } else {
            onGetStarted();
        }
    };

    return (
        <section style={{
            position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center',
            overflow: 'hidden', padding: '0 24px',
            background: 'radial-gradient(ellipse 100% 80% at 50% -10%, rgba(255,107,43,0.18) 0%, transparent 65%), var(--bg)',
        }}>
            <NoiseOverlay />
            {/* Grid lines */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '80px 80px',
            }} />

            {/* Glow orbs */}
            <div style={{ position: 'absolute', top: '20%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,43,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,152,219,0.08) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 2, paddingTop: '80px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
                    {/* Left: Text */}
                    <div>
                        {/* Badge */}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '28px',
                            padding: '6px 14px 6px 8px', borderRadius: '100px',
                            background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.25)',
                            fontSize: '13px', color: 'var(--accent)', fontWeight: 500,
                            animation: 'fadeUp 0.4s ease both',
                        }}>
              <span style={{ background: 'var(--accent)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={11} color="#fff" fill="#fff" />
              </span>
                            Now available in Hyderabad
                        </div>

                        <h1 style={{
                            fontFamily: 'var(--font-head)', fontSize: 'clamp(42px, 5vw, 72px)', fontWeight: 900,
                            lineHeight: 1.05, letterSpacing: '-2px', marginBottom: '24px',
                            animation: 'fadeUp 0.5s 0.1s ease both',
                        }}>
                            Home services,<br />
                            <span style={{ color: 'var(--accent)', position: 'relative' }}>
                done fast.
                <svg style={{ position: 'absolute', bottom: -4, left: 0, width: '100%' }} viewBox="0 0 300 12" preserveAspectRatio="none">
                  <path d="M0 10 Q75 2 150 10 Q225 18 300 10" stroke="var(--accent)" strokeWidth="3" fill="none" opacity="0.4" />
                </svg>
              </span>
                        </h1>

                        <p style={{
                            fontSize: '18px', color: 'var(--text2)', lineHeight: 1.7, maxWidth: '480px',
                            marginBottom: '40px', animation: 'fadeUp 0.5s 0.2s ease both',
                        }}>
                            On-demand services — from tailoring and grooming to plumbing and repairs. Verified pros at your door in under 30 minutes.
                        </p>

                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', animation: 'fadeUp 0.5s 0.3s ease both' }}>
                            <button onClick={handleAction} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '10px',
                                padding: '15px 32px', borderRadius: '12px',
                                background: 'var(--accent)', color: '#fff', border: 'none',
                                fontFamily: 'var(--font)', fontSize: '16px', fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s ease',
                                boxShadow: '0 8px 32px rgba(255,107,43,0.35)',
                            }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,107,43,0.45)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,107,43,0.35)'; }}>
                                {isLoggedIn ? 'Go to Dashboard' : 'Book a Service'} <ArrowRight size={18} />
                            </button>

                            <a href="#how-it-works" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '15px 28px', borderRadius: '12px',
                                background: 'var(--bg2)', color: 'var(--text)',
                                border: '1px solid var(--border)', textDecoration: 'none',
                                fontFamily: 'var(--font)', fontSize: '16px', fontWeight: 500,
                                cursor: 'pointer', transition: 'all 0.2s ease',
                            }}
                               onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                               onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                How it works
                            </a>
                        </div>

                        {/* Trust strip */}
                        <div style={{ display: 'flex', gap: '24px', marginTop: '48px', animation: 'fadeUp 0.5s 0.4s ease both' }}>
                            {[
                                { icon: Shield, text: 'Verified pros' },
                                { icon: Clock, text: '30-min response' },
                                { icon: Star, text: '4.9 avg rating' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text2)' }}>
                                    <Icon size={15} color="var(--accent)" />
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Visual card */}
                    <div style={{ animation: 'fadeUp 0.6s 0.2s ease both' }}>
                        <LiveJobCard />
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── MOCK LIVE JOB CARD ───────────────────────────────────────
function LiveJobCard() {
    const [progress, setProgress] = useState(35);
    useEffect(() => {
        const t = setInterval(() => setProgress(p => p >= 85 ? 35 : p + 1), 120);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '28px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Glow */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, rgba(255,107,43,0.08), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Active Job</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700 }}>AC Repair</div>
                </div>
                <span style={{
                    padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
                    background: 'rgba(255,107,43,0.12)', color: 'var(--accent)', border: '1px solid rgba(255,107,43,0.25)',
                    display: 'flex', alignItems: 'center', gap: '6px',
                }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
          En Route
        </span>
            </div>

            {/* Technician */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg3)', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{
                    width: 46, height: 46, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #e74c3c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 800, color: '#fff',
                }}>A</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>Arjun Sharma</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text2)' }}>
                        <Star size={12} fill="var(--yellow)" color="var(--yellow)" />
                        4.9 · 312 jobs
                    </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>~8 min</div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text2)' }}>Service pro approaching</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{progress}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg3)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: '100px', transition: 'width 0.3s ease' }} />
                </div>
            </div>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text2)', padding: '12px', background: 'var(--bg3)', borderRadius: '10px' }}>
                <MapPin size={14} color="var(--accent)" />
                <span>Madhapur, Hyderabad — 2.3 km away</span>
            </div>
        </div>
    );
}

// ─── STATS BAR ────────────────────────────────────────────────
function StatsBar() {
    return (
        <section style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '48px 24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
                {STATS.map(({ value, label }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: '42px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-1px', marginBottom: '4px' }}>
                            <AnimatedCounter value={value} />
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text2)' }}>{label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── SERVICES ─────────────────────────────────────────────────
function Services({ onGetStarted }) {
    const [hovered, setHovered] = useState(null);
    const { isLoggedIn, user } = useAuth();
    const navigate = useNavigate();

    const handleAction = () => {
        if (isLoggedIn) {
            navigate(user?.role === 'TECHNICIAN' ? '/technician/dashboard' : '/user/dashboard');
        } else {
            onGetStarted();
        }
    };

    return (
        <section style={{ padding: '96px 24px', background: 'var(--bg)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <SectionLabel text="Services" />
                    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '16px' }}>
                        Whatever's broken,<br />we've got someone for it.
                    </h2>
                    <p style={{ color: 'var(--text2)', fontSize: '17px', maxWidth: '480px', margin: '0 auto' }}>
                        8 service categories. Hundreds of verified pros. Ready when you are.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {SERVICES.map(({ icon: Icon, label, desc, color }) => (
                        <div key={label}
                             onMouseEnter={() => setHovered(label)}
                             onMouseLeave={() => setHovered(null)}
                             onClick={handleAction}
                             style={{
                                 padding: '28px 24px', borderRadius: '16px', cursor: 'pointer',
                                 background: hovered === label ? 'var(--bg3)' : 'var(--bg2)',
                                 border: `1px solid ${hovered === label ? 'var(--border2)' : 'var(--border)'}`,
                                 transition: 'all 0.2s ease',
                                 transform: hovered === label ? 'translateY(-4px)' : 'none',
                                 boxShadow: hovered === label ? 'var(--shadow)' : 'none',
                             }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '12px', marginBottom: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `${color}18`, border: `1px solid ${color}30`,
                            }}>
                                <Icon size={22} color={color} />
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>{label}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>{desc}</div>
                            {hovered === label && (
                                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>
                                    {isLoggedIn ? 'Go to Dashboard' : 'Book now'} <ChevronRight size={13} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────
function HowItWorks() {
    return (
        <section id="how-it-works" style={{ padding: '96px 24px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <SectionLabel text="How it works" />
                    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-1.5px' }}>
                        From request to<br />resolved — in minutes.
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', position: 'relative' }}>
                    {/* Connector line */}
                    <div style={{ position: 'absolute', top: '36px', left: '12.5%', right: '12.5%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--border2), var(--border2), transparent)', zIndex: 0 }} />

                    {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
                        <div key={step} style={{ padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
                                background: i === 0 ? 'var(--accent)' : 'var(--bg3)',
                                border: `2px solid ${i === 0 ? 'var(--accent)' : 'var(--border2)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: 900,
                                color: i === 0 ? '#fff' : 'var(--text2)',
                            }}>{step}</div>
                            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>{title}</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── REVIEWS ──────────────────────────────────────────────────
function Reviews() {
    return (
        <section style={{ padding: '96px 24px', background: 'var(--bg)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <SectionLabel text="Reviews" />
                    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-1.5px' }}>
                        Trusted by thousands.
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    {REVIEWS.map(({ name, role, text, rating }) => (
                        <div key={name} style={{
                            padding: '28px', borderRadius: '16px',
                            background: 'var(--bg2)', border: '1px solid var(--border)',
                        }}>
                            <div style={{ display: 'flex', gap: '3px', marginBottom: '16px' }}>
                                {Array(rating).fill(0).map((_, i) => <Star key={i} size={15} fill="var(--yellow)" color="var(--yellow)" />)}
                            </div>
                            <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text)', marginBottom: '20px', fontStyle: 'italic' }}>"{text}"</p>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── CTA ──────────────────────────────────────────────────────
function CTA({ onGetStarted }) {
    const { isLoggedIn, user } = useAuth();
    const navigate = useNavigate();

    const handleAction = () => {
        if (isLoggedIn) {
            navigate(user?.role === 'TECHNICIAN' ? '/technician/dashboard' : '/user/dashboard');
        } else {
            onGetStarted();
        }
    };

    return (
        <section style={{
            padding: '96px 24px', position: 'relative', overflow: 'hidden',
            background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,107,43,0.12) 0%, var(--bg2) 60%)',
            borderTop: '1px solid var(--border)',
        }}>
            <NoiseOverlay />
            <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                <div style={{
                    width: 72, height: 72, background: 'var(--accent)', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px', boxShadow: '0 16px 48px rgba(255,107,43,0.4)',
                }}>
                    <Zap size={36} color="#fff" fill="#fff" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '16px' }}>
                    Need a service?
                </h2>
                <p style={{ fontSize: '18px', color: 'var(--text2)', marginBottom: '40px', lineHeight: 1.7 }}>
                    Join thousands who trust RapidFix for fast, reliable home services.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={handleAction} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px',
                        padding: '16px 36px', borderRadius: '12px',
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        fontFamily: 'var(--font)', fontSize: '17px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        boxShadow: '0 8px 32px rgba(255,107,43,0.4)',
                    }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                        {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight size={18} />
                    </button>
                    {!isLoggedIn && (
                        <button onClick={() => navigate('/login')} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '16px 32px', borderRadius: '12px',
                            background: 'transparent', color: 'var(--text)',
                            border: '1px solid var(--border)', cursor: 'pointer',
                            fontFamily: 'var(--font)', fontSize: '17px', fontWeight: 500,
                            transition: 'all 0.2s ease',
                        }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}

// ─── SECTION LABEL ────────────────────────────────────────────
function SectionLabel({ text }) {
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 14px', borderRadius: '100px', marginBottom: '16px',
            background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.2)',
            fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '1.5px', color: 'var(--accent)',
        }}>{text}</div>
    );
}

// ─── NAVBAR (Landing) ─────────────────────────────────────────
function LandingNav({ onGetStarted }) {
    const [scrolled, setScrolled] = useState(false);
    const { isLoggedIn, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('rapidfix-theme') || 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('rapidfix-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
            padding: '0 24px', height: '64px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: scrolled ? 'rgba(var(--nav-bg),0.9)' : 'transparent',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
            transition: 'all 0.3s ease',
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 34, height: 34, background: 'var(--accent)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={19} color="#fff" fill="#fff" />
                </div>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>
          Rapid<span style={{ color: 'var(--accent)' }}>Fix</span>
        </span>
            </div>

            {/* Nav links */}
            <div style={{ display: 'flex', gap: '4px' }}>
                {[['Services', '#services'], ['How it works', '#how-it-works'], ['Reviews', '#reviews']].map(([label, href]) => (
                    <a key={href} href={href} style={{
                        padding: '6px 14px', borderRadius: '8px',
                        color: 'var(--text2)', textDecoration: 'none', fontSize: '14px',
                        transition: 'color 0.2s',
                    }}
                       onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                       onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>{label}</a>
                ))}
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={toggleTheme} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '9px',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                {isLoggedIn ? (
                    <button onClick={() => navigate(user?.role === 'TECHNICIAN' ? '/technician/dashboard' : '/user/dashboard')} style={{
                        padding: '8px 20px', borderRadius: '9px',
                        background: 'var(--accent)', color: '#fff',
                        border: 'none', fontSize: '14px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'var(--font)',
                        transition: 'all 0.2s',
                    }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        Dashboard
                    </button>
                ) : (
                    <>
                        <a href="/login" style={{
                            padding: '8px 18px', borderRadius: '9px', textDecoration: 'none',
                            color: 'var(--text2)', fontSize: '14px', fontWeight: 500,
                            border: '1px solid var(--border)', transition: 'all 0.2s',
                            fontFamily: 'var(--font)',
                        }}
                           onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                           onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>Sign in</a>

                        <button onClick={onGetStarted} style={{
                            padding: '8px 20px', borderRadius: '9px',
                            background: 'var(--accent)', color: '#fff',
                            border: 'none', fontSize: '14px', fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'var(--font)',
                            transition: 'all 0.2s',
                        }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Get Started</button>
                    </>
                )}
            </div>
        </nav>
    );
}

// ─── FOOTER ───────────────────────────────────────────────────
function Footer() {
    return (
        <footer style={{ padding: '40px 24px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={15} color="#fff" fill="#fff" />
                    </div>
                    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '16px' }}>
            Rapid<span style={{ color: 'var(--accent)' }}>Fix</span>
          </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text3)' }}>© 2025 RapidFix. On-demand home services.</p>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {['Privacy', 'Terms', 'Support'].map(l => (
                        <a key={l} href="#" style={{ fontSize: '13px', color: 'var(--text3)', textDecoration: 'none' }}
                           onMouseEnter={e => e.currentTarget.style.color = 'var(--text2)'}
                           onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>{l}</a>
                    ))}
                </div>
            </div>
        </footer>
    );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────
export default function LandingPage() {
    const navigate = useNavigate();
    const handleGetStarted = () => navigate('/register');

    return (
        <div style={{ fontFamily: 'var(--font)', background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
            <LandingNav onGetStarted={handleGetStarted} />
            <Hero onGetStarted={handleGetStarted} />
            <StatsBar />
            <section id="services"><Services onGetStarted={handleGetStarted} /></section>
            <HowItWorks />
            <section id="reviews"><Reviews /></section>
            <CTA onGetStarted={handleGetStarted} />
            <Footer />
        </div>
    );
}