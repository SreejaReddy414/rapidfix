import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { Input, Select } from '../components/UI';
import { Zap, Mail, Lock, User, ChevronRight, MapPin, Clock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── SPLIT AUTH LAYOUT ────────────────────────────────────────
function AuthLayout({ children }) {
  return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '860px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          animation: 'fadeUp 0.4s ease',
          minHeight: '560px',
        }}>
          {/* Left panel */}
          <div style={{
            background: '#0c0c0c',
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Glow blobs */}
            <div style={{
              position: 'absolute', top: -80, left: -80,
              width: 240, height: 240, borderRadius: '50%',
              background: 'rgba(255,107,43,0.15)', filter: 'blur(60px)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -60, right: -60,
              width: 180, height: 180, borderRadius: '50%',
              background: 'rgba(255,107,43,0.08)', filter: 'blur(40px)',
              pointerEvents: 'none',
            }} />

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(255,107,43,0.4)',
              }}>
                <Zap size={20} color="#fff" fill="#fff" />
              </div>
              <span style={{
                fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: 800,
                color: '#fff', letterSpacing: '-0.3px',
              }}>
              Rapid<span style={{ color: 'var(--accent)' }}>Fix</span>
            </span>
            </div>

            {/* Tagline + features */}
            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 0' }}>
              <p style={{
                fontSize: '24px', fontFamily: 'var(--font-head)', fontWeight: 800,
                color: '#fff', lineHeight: 1.25, letterSpacing: '-0.5px', marginBottom: '8px',
              }}>
                On-demand<br />technicians,<br />
                <span style={{ color: 'var(--accent)' }}>at your door.</span>
              </p>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '28px' }}>
                Get quotes before you commit. No surprises.
              </p>

              {[
                { icon: <Clock size={14} />, label: 'Fast quotes', sub: 'Technicians respond in minutes' },
                { icon: <MapPin size={14} />, label: 'Live tracking', sub: 'See your technician en route' },
                { icon: <ShieldCheck size={14} />, label: 'Transparent pricing', sub: 'Approve before any work begins' },
              ].map(({ icon, label, sub }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                      background: 'rgba(255,107,43,0.12)',
                      border: '1px solid rgba(255,107,43,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent)', marginTop: '1px',
                    }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{sub}</div>
                    </div>
                  </div>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: '#444', letterSpacing: '0.06em', textTransform: 'uppercase', position: 'relative' }}>
              Hyderabad · India
            </div>
          </div>

          {/* Right: form */}
          <div style={{
            background: 'var(--bg2)',
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            {children}
          </div>
        </div>
      </div>
  );
}

// ─── SHARED SUBMIT BUTTON ─────────────────────────────────────
function SubmitButton({ loading, children }) {
  return (
      <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: '12px',
            border: 'none', background: 'var(--accent)', color: '#fff',
            fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 4px 20px rgba(255,107,43,0.35)',
            transition: 'all 0.2s ease',
            marginTop: '4px',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(255,107,43,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,107,43,0.35)'; }}
      >
        {loading ? 'Please wait…' : <>{children} <ChevronRight size={15} /></>}
      </button>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      const data = res.data;
      login({ id: data.id, name: data.name, email: data.email, role: data.role }, data.token);
      toast.success(`Welcome back, ${data.name}!`);
      navigate(data.role === 'TECHNICIAN' ? '/technician/dashboard' : '/user/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
      <AuthLayout>
        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '28px',
        }}>
          {[
            { label: 'Sign in', to: '/login', active: true },
            { label: 'Register', to: '/register', active: false },
          ].map(({ label, to, active }) => (
              <Link key={label} to={to} style={{
                flex: 1, padding: '9px', textAlign: 'center',
                fontSize: '13px', fontWeight: active ? 700 : 400,
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--text3)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font)',
              }}>
                {label}
              </Link>
          ))}
        </div>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: '6px' }}>
            Welcome back
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text)' }}>
            Sign in to your account
          </h1>
        </div>

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Email address" type="email" placeholder="you@example.com"
                 icon={<Mail size={15} />} value={form.email}
                 onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />

          <div>
            <Input label="Password" type="password" placeholder="••••••••"
                   icon={<Lock size={15} />} value={form.password}
                   onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            <div style={{ textAlign: 'right', marginTop: '6px' }}>

            </div>
          </div>

          <SubmitButton loading={loading}>Sign in</SubmitButton>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text3)', marginTop: '20px' }}>
          By signing in you agree to our{' '}
          <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms of Service</span>
        </p>
      </AuthLayout>
  );
}

// ─── REGISTER ────────────────────────────────────────────────
export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      const data = res.data;
      login({ id: data.id, name: data.name, email: data.email, role: data.role }, data.token);
      toast.success(`Account created! Welcome, ${data.name}`);
      navigate(data.role === 'TECHNICIAN' ? '/technician/dashboard' : '/user/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
      <AuthLayout>
        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '28px',
        }}>
          {[
            { label: 'Sign in', to: '/login', active: false },
            { label: 'Register', to: '/register', active: true },
          ].map(({ label, to, active }) => (
              <Link key={label} to={to} style={{
                flex: 1, padding: '9px', textAlign: 'center',
                fontSize: '13px', fontWeight: active ? 700 : 400,
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--text3)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font)',
              }}>
                {label}
              </Link>
          ))}
        </div>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: '6px' }}>
            Get started
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text)' }}>
            Create your account
          </h1>
        </div>

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Full name" placeholder="John Doe"
                 icon={<User size={15} />} value={form.name}
                 onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          <Input label="Email address" type="email" placeholder="you@example.com"
                 icon={<Mail size={15} />} value={form.email}
                 onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          <Input label="Password" type="password" placeholder="Min 6 characters"
                 icon={<Lock size={15} />} value={form.password}
                 onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />

          {/* Role toggle */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>
              I want to…
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { value: 'USER', label: 'Request services', sub: 'As a customer', icon: '🛠️' },
                { value: 'TECHNICIAN', label: 'Provide services', sub: 'As a technician', icon: '👷' },
              ].map(({ value, label, sub, icon }) => {
                const active = form.role === value;
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, role: value }))}
                        style={{
                          padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                          border: `1px solid ${active ? 'rgba(255,107,43,0.5)' : 'var(--border)'}`,
                          background: active ? 'rgba(255,107,43,0.08)' : 'var(--bg3)',
                          transition: 'all 0.2s ease', textAlign: 'left',
                          boxShadow: active ? '0 2px 10px rgba(255,107,43,0.15)' : 'none',
                        }}
                    >
                      <div style={{ fontSize: '16px', marginBottom: '3px' }}>{icon}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text2)', fontFamily: 'var(--font)' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font)' }}>{sub}</div>
                    </button>
                );
              })}
            </div>
          </div>

          <SubmitButton loading={loading}>Create account</SubmitButton>
        </form>


      </AuthLayout>
  );
}
