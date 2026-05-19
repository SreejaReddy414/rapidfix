import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Zap } from 'lucide-react';
import { Badge } from './UI';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = user?.role === 'USER'
    ? [
        { label: 'Dashboard', path: '/user/dashboard' },
        { label: 'New Request', path: '/user/new-request' },
        { label: 'My Requests', path: '/user/requests' },
      ]
    : user?.role === 'TECHNICIAN'
    ? [
        { label: 'Dashboard', path: '/technician/dashboard' },
        { label: 'Browse Jobs', path: '/technician/jobs' },
        { label: 'My Jobs', path: '/technician/my-jobs' },
      ]
    : [];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px', height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        onClick={() => navigate(user?.role === 'TECHNICIAN' ? '/technician/dashboard' : '/user/dashboard')}>
        <div style={{
          width: 32, height: 32, background: 'var(--accent)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>
          Rapid<span style={{ color: 'var(--accent)' }}>Fix</span>
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {navLinks.map(link => (
          <button key={link.path} onClick={() => navigate(link.path)} style={{
            padding: '6px 14px', borderRadius: 'var(--radius2)', border: 'none',
            background: location.pathname === link.path ? 'var(--bg3)' : 'transparent',
            color: location.pathname === link.path ? 'var(--text)' : 'var(--text2)',
            fontFamily: 'var(--font)', fontSize: '14px', cursor: 'pointer',
            borderBottom: location.pathname === link.path ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all var(--transition)',
          }}>{link.label}</button>
        ))}
      </div>

      {/* User info + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>{user?.name}</div>
          <Badge>{user?.role}</Badge>
        </div>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 12px', borderRadius: 'var(--radius2)',
          border: '1px solid var(--border)', background: 'transparent',
          color: 'var(--text2)', cursor: 'pointer', fontSize: '13px',
          fontFamily: 'var(--font)', transition: 'all var(--transition)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </nav>
  );
}
