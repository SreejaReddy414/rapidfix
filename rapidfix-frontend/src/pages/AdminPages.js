import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, techAPI, dispatchAPI, authAPI } from '../api';
import { Button, Badge, LoadingScreen, Divider, Input } from '../components/UI';
import toast from 'react-hot-toast';
import {
  Users, Wrench, FileText, CheckCircle, TrendingUp,
  XCircle, Trash2, Star, Activity, LogOut, Lock, Mail
} from 'lucide-react';

// ─── ADMIN DASHBOARD ───────────────────────────────────────────
export function AdminDashboard() {
  const { user, login, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics'); // metrics, users, technicians, requests

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Dashboard Data states
  const [usersList, setUsersList] = useState([]);
  const [techList, setTechList] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Check role on mount or user state change
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      setIsAdmin(true);
      loadDashboardData();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const data = res.data;
      if (data.role !== 'ADMIN') {
        toast.error('Access Denied. Only Admins can log in here.');
        return;
      }
      login({ id: data.id, name: data.name, email: data.email, role: data.role }, data.token);
      setIsAdmin(true);
      toast.success('Welcome to Admin Control Center 🛡️');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Users
      const usersRes = await userAPI.getAllUsers({ page: 0, size: 100 });
      setUsersList(usersRes.data.content || []);

      // 2. Fetch Technicians
      const techRes = await techAPI.getAll({ page: 0, size: 100 });
      setTechList(techRes.data.content || []);

      // 3. Fetch Requests across all statuses
      const statuses = ['PENDING', 'QUOTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      const requestsPromises = statuses.map(status =>
        dispatchAPI.getRequestsByStatus(status, { page: 0, size: 50 }).catch(() => ({ data: { content: [] } }))
      );
      const results = await Promise.all(requestsPromises);
      const flatRequests = results.flatMap((res, index) => {
        const content = res.data.content || [];
        return content.map(r => ({ ...r, status: statuses[index] }));
      });
      // Sort by creation or ID descending
      flatRequests.sort((a, b) => b.id - a.id);
      setAllRequests(flatRequests);
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? All associated data will be removed.')) return;
    try {
      await userAPI.deleteUser(userId);
      toast.success('User deleted successfully.');
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #09090b 100%)',
        padding: '24px', fontFamily: 'var(--font)'
      }}>
        <div style={{
          width: '100%', maxWidth: '420px', background: 'rgba(30, 30, 40, 0.65)',
          backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px', padding: '40px 32px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '16px', background: 'rgba(255,107,43,0.15)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', marginBottom: '16px', border: '1px solid rgba(255,107,43,0.3)'
            }}>
              <Lock size={24} />
            </div>
            <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-head)', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              Admin Console
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '6px' }}>
              Security authorization required to access dashboard
            </p>
          </div>

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '8px' }}>
                Admin Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text3)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="email"
                  placeholder="admin@rapidfix.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                    background: 'var(--bg3)', border: '1px solid var(--border)', color: '#fff',
                    fontSize: '14px', fontFamily: 'var(--font)', outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text3)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                    background: 'var(--bg3)', border: '1px solid var(--border)', color: '#fff',
                    fontSize: '14px', fontFamily: 'var(--font)', outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                background: 'var(--accent)', color: '#fff', fontWeight: 700,
                fontSize: '14px', fontFamily: 'var(--font)', cursor: authLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(255,107,43,0.3)', transition: 'all 0.2s ease',
                marginTop: '10px'
              }}
            >
              {authLoading ? 'Authorizing...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate Request stats
  const pendingRequests = allRequests.filter(r => r.status === 'PENDING' || r.status === 'QUOTED');
  const activeRequests = allRequests.filter(r => ['APPROVED', 'IN_PROGRESS'].includes(r.status));
  const completedRequests = allRequests.filter(r => r.status === 'COMPLETED');
  const cancelledRequests = allRequests.filter(r => r.status === 'CANCELLED');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)' }}>
      {/* Navbar */}
      <header style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🛡️</span>
          <span style={{ fontWeight: 800, fontSize: '18px', fontFamily: 'var(--font-head)', letterSpacing: '-0.5px' }}>
            RapidFix Admin Workspace
          </span>
        </div>
        <button
          onClick={() => { logout(); setIsAdmin(false); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
            borderRadius: '10px', border: '1px solid rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.06)',
            color: '#e74c3c', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease'
          }}
        >
          <LogOut size={14} /> Exit Admin Mode
        </button>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '32px' }}>
          {[
            { id: 'metrics', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: 'Users Management', icon: Users },
            { id: 'technicians', label: 'Technicians Profiles', icon: Wrench },
            { id: 'requests', label: 'Service Requests', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                  borderRadius: '10px', border: 'none',
                  background: active ? 'rgba(255,107,43,0.1)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text3)',
                  fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {loadingData ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0', gap: '16px' }}>
            <Activity size={32} style={{ animation: 'spin 1.5s linear infinite' }} />
            <span style={{ color: 'var(--text3)', fontSize: '14px' }}>Loading Control Panel Data...</span>
          </div>
        ) : (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            
            {/* Overview / Metrics Tab */}
            {activeTab === 'metrics' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>
                  Platform Statistics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                  <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text3)', fontSize: '13px', fontWeight: 600 }}>Total Registered Users</div>
                    <div style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', color: '#fff' }}>{usersList.length}</div>
                  </div>
                  <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text3)', fontSize: '13px', fontWeight: 600 }}>Total Technicians</div>
                    <div style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', color: 'var(--accent)' }}>{techList.length}</div>
                  </div>
                  <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text3)', fontSize: '13px', fontWeight: 600 }}>All Service Requests</div>
                    <div style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>{allRequests.length}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>
                  Requests Status Breakdown
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '20px', background: 'rgba(245,158,11,0.06)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>Pending Bidding</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#f59e0b' }}>{pendingRequests.length}</div>
                  </div>
                  <div style={{ padding: '20px', background: 'rgba(59,130,246,0.06)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 600 }}>Active Jobs</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#3b82f6' }}>{activeRequests.length}</div>
                  </div>
                  <div style={{ padding: '20px', background: 'rgba(16,185,129,0.06)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>Completed Jobs</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>{completedRequests.length}</div>
                  </div>
                  <div style={{ padding: '20px', background: 'rgba(107,114,128,0.06)', borderRadius: '12px', border: '1px solid rgba(107,114,128,0.2)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: 600 }}>Cancelled Jobs</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text3)' }}>{cancelledRequests.length}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Users List Tab */}
            {activeTab === 'users' && (
              <div style={{ background: 'var(--bg2)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text3)', fontWeight: 600 }}>
                      <th style={{ padding: '14px 20px' }}>User ID</th>
                      <th style={{ padding: '14px 20px' }}>Name</th>
                      <th style={{ padding: '14px 20px' }}>Email</th>
                      <th style={{ padding: '14px 20px' }}>Role</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text3)' }}>No users registered.</td>
                      </tr>
                    ) : (
                      usersList.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                          <td style={{ padding: '14px 20px', fontFamily: 'monospace' }}>#{u.id}</td>
                          <td style={{ padding: '14px 20px', fontWeight: 600, color: '#fff' }}>{u.name}</td>
                          <td style={{ padding: '14px 20px' }}>{u.email}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                              background: u.role === 'ADMIN' ? 'rgba(231,76,60,0.1)' : (u.role === 'TECHNICIAN' ? 'rgba(255,107,43,0.1)' : 'rgba(59,130,246,0.1)'),
                              color: u.role === 'ADMIN' ? '#e74c3c' : (u.role === 'TECHNICIAN' ? 'var(--accent)' : '#3b82f6'),
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                style={{
                                  background: 'transparent', border: 'none', color: '#e74c3c',
                                  padding: '4px', cursor: 'pointer', opacity: 0.8, transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Technicians List Tab */}
            {activeTab === 'technicians' && (
              <div style={{ background: 'var(--bg2)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text3)', fontWeight: 600 }}>
                      <th style={{ padding: '14px 20px' }}>ID</th>
                      <th style={{ padding: '14px 20px' }}>Name</th>
                      <th style={{ padding: '14px 20px' }}>Expertise / Service Types</th>
                      <th style={{ padding: '14px 20px' }}>Rating</th>
                      <th style={{ padding: '14px 20px' }}>Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techList.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text3)' }}>No technician profiles registered.</td>
                      </tr>
                    ) : (
                      techList.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                          <td style={{ padding: '14px 20px', fontFamily: 'monospace' }}>#{t.id}</td>
                          <td style={{ padding: '14px 20px', fontWeight: 600, color: '#fff' }}>
                            <div>{t.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 400, marginTop: '2px' }}>{t.email} | {t.phone}</div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {t.serviceTypes?.map(skill => (
                                <span key={skill} style={{
                                  background: 'var(--bg3)', color: 'var(--text2)', padding: '2px 6px',
                                  borderRadius: '4px', fontSize: '10px', fontWeight: 600, border: '1px solid var(--border)'
                                }}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#f59e0b' }}>
                              <Star size={13} fill="#f59e0b" color="#f59e0b" />
                              {t.rating?.toFixed(1)} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({t.totalRatings} ratings)</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                              background: t.availabilityStatus === 'AVAILABLE' ? 'rgba(16,185,129,0.1)' : (t.availabilityStatus === 'BUSY' ? 'rgba(255,107,43,0.1)' : 'rgba(107,114,128,0.1)'),
                              color: t.availabilityStatus === 'AVAILABLE' ? '#10b981' : (t.availabilityStatus === 'BUSY' ? 'var(--accent)' : 'var(--text3)'),
                            }}>
                              {t.availabilityStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Service Requests Tab */}
            {activeTab === 'requests' && (
              <div style={{ background: 'var(--bg2)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text3)', fontWeight: 600 }}>
                      <th style={{ padding: '14px 20px' }}>Order ID</th>
                      <th style={{ padding: '14px 20px' }}>User</th>
                      <th style={{ padding: '14px 20px' }}>Category</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px' }}>Assigned Tech</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text3)' }}>No service requests placed.</td>
                      </tr>
                    ) : (
                      allRequests.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                          <td style={{ padding: '14px 20px', fontFamily: 'monospace' }}>#{r.id}</td>
                          <td style={{ padding: '14px 20px', fontWeight: 600, color: '#fff' }}>
                            <div>{r.userName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 400, marginTop: '2px' }}>{r.address}</div>
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: 700 }}>{r.serviceType}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                              background: r.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : (r.status === 'CANCELLED' ? 'rgba(231,76,60,0.1)' : 'rgba(245,158,11,0.1)'),
                              color: r.status === 'COMPLETED' ? '#10b981' : (r.status === 'CANCELLED' ? '#e74c3c' : '#f59e0b')
                            }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            {r.technicianName ? (
                              <div>{r.technicianName} <span style={{ fontSize: '11px', color: 'var(--text3)' }}>({r.technicianPhone})</span></div>
                            ) : (
                              <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Unassigned</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                            {r.totalAmount ? `₹${r.totalAmount.toFixed(0)}` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
