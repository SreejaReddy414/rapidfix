import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Zap, Sun, Moon, User, Phone, Wrench, Lock, Edit2, Check, X } from 'lucide-react';
import { Badge } from './UI';
import { techAPI } from '../api';
import toast from 'react-hot-toast';

const SERVICE_TYPES = ['ELECTRICIAN','PLUMBER','AC_REPAIR','CARPENTER','PAINTER','CLEANER','APPLIANCE_REPAIR','PEST_CONTROL','TAILORING','NETWORKING_TECH','BEAUTICIAN','MEHANDI_SERVICES','GENERAL_HELPER'];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('rapidfix-theme') || 'light';
  });

  // Profile states
  const [profile, setProfile] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editSkills, setEditSkills] = useState([]);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rapidfix-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user?.role === 'TECHNICIAN') {
      techAPI.getByUserId(user.id)
        .then(res => {
          setProfile(res.data);
          setEditPhone(res.data.phone || '');
          setEditSkills(res.data.serviceTypes ? [...res.data.serviceTypes] : []);
        })
        .catch(() => {});
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSavePhone = async () => {
    if (!/^[0-9]{10}$/.test(editPhone)) {
      toast.error('Phone number must be exactly 10 digits.');
      return;
    }
    setLoadingPhone(true);
    try {
      const res = await techAPI.updateProfile({ phone: editPhone });
      setProfile(res.data);
      setIsEditingPhone(false);
      toast.success('Phone number updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update phone number.');
    } finally {
      setLoadingPhone(false);
    }
  };

  const handleSaveSkills = async () => {
    if (editSkills.length === 0) {
      toast.error('Please select at least one skill.');
      return;
    }
    setLoadingSkills(true);
    try {
      const res = await techAPI.updateProfile({ serviceTypes: editSkills });
      setProfile(res.data);
      setIsEditingSkills(false);
      toast.success('Skills updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update skills.');
    } finally {
      setLoadingSkills(false);
    }
  };

  const toggleSkillSelection = (skill) => {
    setEditSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

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
        { label: 'Earnings', path: '/technician/earnings' },
      ]
    : [];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(var(--nav-bg),0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px', height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        onClick={() => navigate('/')}>
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

      {/* User info + Theme Toggle + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        <button onClick={toggleTheme} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px', borderRadius: 'var(--radius2)',
          border: '1px solid var(--border)', background: 'transparent',
          color: 'var(--text2)', cursor: 'pointer', transition: 'all var(--transition)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div 
          onClick={() => { if (user?.role === 'TECHNICIAN') setShowProfileDropdown(p => !p); }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: user?.role === 'TECHNICIAN' ? 'pointer' : 'default',
            padding: '4px 8px',
            borderRadius: 'var(--radius2)',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={e => { if (user?.role === 'TECHNICIAN') e.currentTarget.style.background = 'var(--bg3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          {user?.role === 'TECHNICIAN' && (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '14px'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{user?.name}</div>
            <Badge>{user?.role}</Badge>
          </div>
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

        {/* Technician Profile Popover */}
        {showProfileDropdown && user?.role === 'TECHNICIAN' && (
          <div style={{
            position: 'absolute', right: 0, top: '50px', width: '320px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '20px', zIndex: 1000,
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            animation: 'fadeUp 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-head)', margin: 0, fontSize: '16px', fontWeight: 700 }}>Technician Profile</h3>
              <button 
                onClick={() => setShowProfileDropdown(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Email Field (Read Only) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Email</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg3)', padding: '8px 12px', borderRadius: '8px' }}>
                <Lock size={12} color="var(--text3)" />
                <span style={{ fontSize: '13px', color: 'var(--text3)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.email}</span>
                <span style={{ fontSize: '9px', background: 'var(--border)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text3)', marginLeft: 'auto' }}>LOCK</span>
              </div>
            </div>

            {/* Phone Field */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>Phone</span>
                {!isEditingPhone && (
                  <button 
                    onClick={() => { setIsEditingPhone(true); setEditPhone(profile?.phone || ''); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                  >
                    <Edit2 size={10} /> Edit
                  </button>
                )}
              </div>

              {isEditingPhone ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="text" 
                    value={editPhone} 
                    maxLength={10}
                    onChange={e => setEditPhone(e.target.value.replace(/\D/g, ''))}
                    style={{
                      flex: 1, padding: '6px 10px', fontSize: '13px', background: 'var(--bg3)',
                      border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', outline: 'none'
                    }}
                  />
                  <button 
                    onClick={handleSavePhone} 
                    disabled={loadingPhone}
                    style={{ background: 'var(--accent)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                  >
                    {loadingPhone ? '...' : <Check size={14} />}
                  </button>
                  <button 
                    onClick={() => setIsEditingPhone(false)}
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <Phone size={12} color="var(--text2)" />
                  <span style={{ fontSize: '13px', color: 'var(--text)' }}>{profile?.phone || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Skills Field */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>Services/Skills</span>
                {!isEditingSkills && (
                  <button 
                    onClick={() => { setIsEditingSkills(true); setEditSkills(profile?.serviceTypes ? [...profile.serviceTypes] : []); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                  >
                    <Edit2 size={10} /> Edit
                  </button>
                )}
              </div>

              {isEditingSkills ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '120px', overflowY: 'auto', padding: '4px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '8px' }}>
                    {SERVICE_TYPES.map(s => {
                      const selected = editSkills.includes(s);
                      return (
                        <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', color: selected ? 'var(--text)' : 'var(--text3)' }}>
                          <input 
                            type="checkbox" 
                            checked={selected}
                            onChange={() => toggleSkillSelection(s)}
                            style={{ accentColor: 'var(--accent)' }}
                          />
                          {s.replace(/_/g, ' ')}
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => setIsEditingSkills(false)}
                      style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveSkills} 
                      disabled={loadingSkills}
                      style={{ padding: '4px 12px', fontSize: '11px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {loadingSkills ? 'Saving...' : 'Save Skills'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {profile?.serviceTypes && profile.serviceTypes.length > 0 ? (
                    profile.serviceTypes.map(s => (
                      <Badge key={s}>{s.replace(/_/g, ' ')}</Badge>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text3)' }}>No skills listed</span>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </nav>
  );
}
