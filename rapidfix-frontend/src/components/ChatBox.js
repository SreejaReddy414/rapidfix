import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function ChatBox({ requestId, currentUser, status, onChatActiveChange }) {
    const [open,       setOpen]       = useState(false);
    const [messages,   setMessages]   = useState([]);
    const [input,      setInput]      = useState('');
    const [connected,  setConnected]  = useState(false);
    const [loading,    setLoading]    = useState(false);
    const clientRef  = useRef(null);
    const bottomRef  = useRef(null);
    const token      = localStorage.getItem('token');

    const isActive = ['APPROVED', 'IN_PROGRESS'].includes(status);

    // ─── Notify parent when chat opens / closes ──────────────────
    const openChat = () => {
        setOpen(true);
        onChatActiveChange?.(true);
    };
    const closeChat = () => {
        setOpen(false);
        onChatActiveChange?.(false);
    };

    // ─── Connect / Disconnect when modal opens / closes ─────────
    useEffect(() => {
        if (!open || !isActive) return;

        setLoading(true);

        // Load chat history via REST
        fetch(`/api/requests/${requestId}/chat`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => setMessages(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setLoading(false));

        // Connect WebSocket — go directly to dispatch-service (bypass gateway for WS)
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8083/ws'),
            reconnectDelay: 5000,
            onConnect: () => {
                setConnected(true);
                client.subscribe(`/topic/chat/${requestId}`, (msg) => {
                    try {
                        const parsed = JSON.parse(msg.body);
                        setMessages(prev => [...prev, parsed]);
                    } catch (e) {}
                });
            },
            onDisconnect: () => setConnected(false),
            onStompError:  () => setConnected(false),
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
            clientRef.current = null;
            setConnected(false);
        };
    }, [open, requestId, isActive]);

    // ─── Cleanup: notify parent if unmounted while open ─────────
    useEffect(() => {
        return () => {
            if (open) onChatActiveChange?.(false);
        };
    }, [open]);

    // ─── Auto-scroll to latest message ──────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        const text = input.trim();
        if (!text) return;

        if (!clientRef.current?.active || !connected) {
            alert('Chat is still connecting, please wait a moment and try again.');
            return;
        }

        clientRef.current.publish({
            destination: `/app/chat/${requestId}`,
            body: JSON.stringify({
                senderId:   currentUser.id,
                senderName: currentUser.name,
                senderRole: currentUser.role,
                content:    text,
            }),
        });
        setInput('');
    };

    if (!isActive) return null;

    return (
        <>
            {/* ─── Chat Button ──────────────────────────────────────── */}
            <button
                onClick={openChat}
                style={{
                    width: '100%', padding: '11px', borderRadius: '12px',
                    border: '1px solid rgba(99,102,241,0.4)',
                    background: 'rgba(99,102,241,0.08)',
                    color: '#818cf8', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.14)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
            >
                💬 Chat with {currentUser.role === 'USER' ? 'Technician' : 'Customer'}
            </button>

            {/* ─── Chat Modal ───────────────────────────────────────── */}
            {open && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 300,
                        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '24px',
                    }}
                    onClick={closeChat}
                >
                    <div
                        style={{
                            width: '100%', maxWidth: '480px', height: '520px',
                            background: 'var(--bg2)', borderRadius: '20px',
                            border: '1px solid var(--border2)',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column',
                            animation: 'fadeUp 0.25s ease',
                            overflow: 'hidden',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'var(--bg3)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: 34, height: 34, borderRadius: '10px',
                                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                                }}>💬</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                                        Chat
                                    </div>
                                    <div style={{ fontSize: '11px', color: connected ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
                                        {connected ? 'Connected' : 'Connecting...'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={closeChat}
                                style={{
                                    width: 30, height: 30, borderRadius: '8px',
                                    border: '1px solid var(--border)', background: 'transparent',
                                    color: 'var(--text3)', cursor: 'pointer', fontSize: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >✕</button>
                        </div>

                        {/* Messages */}
                        <div style={{
                            flex: 1, overflowY: 'auto', padding: '16px',
                            display: 'flex', flexDirection: 'column', gap: '10px',
                        }}>
                            {loading && (
                                <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', marginTop: '20px' }}>
                                    Loading messages...
                                </div>
                            )}
                            {!loading && messages.length === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', marginTop: '40px' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                                    No messages yet. Say hello!
                                </div>
                            )}
                            {messages.map((m, i) => {
                                const isMe = String(m.senderId) === String(currentUser.id);
                                return (
                                    <div key={m.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px', paddingLeft: isMe ? 0 : '4px', paddingRight: isMe ? '4px' : 0 }}>
                                            {m.senderName}
                                        </div>
                                        <div style={{
                                            maxWidth: '75%', padding: '8px 12px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                            background: isMe ? '#6366f1' : 'var(--bg3)',
                                            color: isMe ? '#fff' : 'var(--text)',
                                            fontSize: '13px', lineHeight: 1.5,
                                            border: isMe ? 'none' : '1px solid var(--border)',
                                        }}>
                                            {m.content}
                                        </div>
                                        {m.createdAt && (
                                            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px', paddingLeft: isMe ? 0 : '4px', paddingRight: isMe ? '4px' : 0 }}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div style={{
                            padding: '12px 16px',
                            borderTop: '1px solid var(--border)',
                            display: 'flex', gap: '10px', alignItems: 'center',
                            background: 'var(--bg3)',
                        }}>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                placeholder={connected ? 'Type a message...' : 'Connecting...'}
                                disabled={!connected}
                                style={{
                                    flex: 1, padding: '10px 14px', borderRadius: '10px',
                                    border: '1px solid var(--border)',
                                    background: connected ? 'var(--bg2)' : 'var(--bg3)',
                                    color: 'var(--text)', fontSize: '13px',
                                    fontFamily: 'var(--font)', outline: 'none',
                                    opacity: connected ? 1 : 0.6,
                                }}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!connected || !input.trim()}
                                style={{
                                    padding: '10px 18px', borderRadius: '10px', border: 'none',
                                    background: connected && input.trim() ? '#6366f1' : 'var(--bg2)',
                                    color: connected && input.trim() ? '#fff' : 'var(--text3)',
                                    cursor: connected && input.trim() ? 'pointer' : 'not-allowed',
                                    fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font)',
                                    transition: 'all 0.2s ease', flexShrink: 0,
                                }}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}