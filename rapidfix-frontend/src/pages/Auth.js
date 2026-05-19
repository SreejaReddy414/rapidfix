import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { Button, Input, Select, Card } from '../components/UI';
import { Zap, Mail, Lock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(255,107,43,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(52,152,219,0.06) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeUp 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)', borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            boxShadow: '0 8px 32px rgba(255,107,43,0.3)',
          }}>
            <Zap size={28} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
            Rapid<span style={{ color: 'var(--accent)' }}>Fix</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>{subtitle}</p>
        </div>

        <Card style={{ padding: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>{title}</h2>
          {children}
        </Card>
      </div>
    </div>
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
    <AuthLayout title="Sign in" subtitle="On-demand technician dispatch">
      <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input label="Email" type="email" placeholder="you@example.com"
          icon={<Mail size={15} />} value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
        <Input label="Password" type="password" placeholder="••••••••"
          icon={<Lock size={15} />} value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
        <Button type="submit" loading={loading} fullWidth size="lg" style={{ marginTop: '4px' }}>
          Sign In
        </Button>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text2)' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Register
          </Link>
        </p>
      </form>
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
    <AuthLayout title="Create account" subtitle="Join RapidFix today">
      <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input label="Full Name" placeholder="John Doe"
          icon={<User size={15} />} value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
        <Input label="Email" type="email" placeholder="you@example.com"
          icon={<Mail size={15} />} value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
        <Input label="Password" type="password" placeholder="Min 6 characters"
          icon={<Lock size={15} />} value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
        <Select label="I want to..." value={form.role}
          onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
          <option value="USER">Request services (Customer)</option>
          <option value="TECHNICIAN">Provide services (Technician)</option>
        </Select>
        <Button type="submit" loading={loading} fullWidth size="lg" style={{ marginTop: '4px' }}>
          Create Account
        </Button>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Sign In
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
