import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage, RegisterPage } from './pages/Auth';
import { UserDashboard, NewRequestPage, UserRequestsPage } from './pages/UserPages';
import { TechnicianDashboard, BrowseJobsPage, MyJobsPage, TechnicianEarningsPage } from './pages/TechnicianPages';
import { AdminDashboard } from './pages/AdminPages';
import LandingPage from './pages/LandingPage';
import './index.css';

function ProtectedRoute({ children, allowedRole }) {
    const { isLoggedIn, user } = useAuth();
    if (!isLoggedIn) return <Navigate to="/" replace />;
    if (allowedRole && user?.role !== allowedRole) {
        return <Navigate to={user?.role === 'TECHNICIAN' ? '/technician/dashboard' : '/user/dashboard'} replace />;
    }
    return children;
}

function RootRedirect() {
    return <LandingPage />;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public landing page */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* User routes */}
            <Route path="/user/dashboard" element={<ProtectedRoute allowedRole="USER"><UserDashboard /></ProtectedRoute>} />
            <Route path="/user/new-request" element={<ProtectedRoute allowedRole="USER"><NewRequestPage /></ProtectedRoute>} />
            <Route path="/user/requests" element={<ProtectedRoute allowedRole="USER"><UserRequestsPage /></ProtectedRoute>} />

            {/* Technician routes */}
            <Route path="/technician/dashboard" element={<ProtectedRoute allowedRole="TECHNICIAN"><TechnicianDashboard /></ProtectedRoute>} />
            <Route path="/technician/jobs" element={<ProtectedRoute allowedRole="TECHNICIAN"><BrowseJobsPage /></ProtectedRoute>} />
            <Route path="/technician/my-jobs" element={<ProtectedRoute allowedRole="TECHNICIAN"><MyJobsPage /></ProtectedRoute>} />
            <Route path="/technician/earnings" element={<ProtectedRoute allowedRole="TECHNICIAN"><TechnicianEarningsPage /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'var(--bg2)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            fontFamily: 'var(--font)',
                            fontSize: '14px',
                        },
                        success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg)' } },
                        error:   { iconTheme: { primary: 'var(--red)',   secondary: 'var(--bg)' } },
                    }}
                />
            </BrowserRouter>
        </AuthProvider>
    );
}