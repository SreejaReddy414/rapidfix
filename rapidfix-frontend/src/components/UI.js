import React from 'react';

// ─── BUTTON ──────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, icon, fullWidth, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', fontFamily: 'var(--font)', fontWeight: 500, cursor: 'pointer',
    border: 'none', borderRadius: 'var(--radius2)', transition: 'all var(--transition)',
    width: fullWidth ? '100%' : undefined, position: 'relative', whiteSpace: 'nowrap',
  };
  const sizes = {
    sm: { padding: '6px 14px', fontSize: '13px' },
    md: { padding: '10px 20px', fontSize: '14px' },
    lg: { padding: '13px 28px', fontSize: '15px' },
  };
  const variants = {
    primary:   { background: 'var(--accent)', color: '#fff' },
    secondary: { background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)' },
    ghost:     { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)' },
    danger:    { background: 'var(--redbg)', color: 'var(--red)', border: '1px solid rgba(231,76,60,0.3)' },
    success:   { background: 'var(--greenbg)', color: 'var(--green)', border: '1px solid rgba(46,204,113,0.3)' },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant], opacity: loading ? 0.7 : 1 }}
      disabled={loading || props.disabled} {...props}>
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  );
}

// ─── INPUT ───────────────────────────────────────────────────
export function Input({ label, error, icon, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', display: 'flex' }}>{icon}</span>}
        <input style={{
          width: '100%', padding: icon ? '10px 14px 10px 38px' : '10px 14px',
          background: 'var(--bg3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius2)', color: 'var(--text)', fontSize: '14px',
          fontFamily: 'var(--font)', outline: 'none', transition: 'border-color var(--transition)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}
        {...props} />
      </div>
      {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ─── SELECT ──────────────────────────────────────────────────
export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <select style={{
        width: '100%', padding: '10px 14px',
        background: 'var(--bg3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius2)', color: 'var(--text)', fontSize: '14px',
        fontFamily: 'var(--font)', outline: 'none', cursor: 'pointer',
      }} {...props}>{children}</select>
      {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ─── TEXTAREA ────────────────────────────────────────────────
export function Textarea({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <textarea style={{
        width: '100%', padding: '10px 14px', minHeight: '100px', resize: 'vertical',
        background: 'var(--bg3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius2)', color: 'var(--text)', fontSize: '14px',
        fontFamily: 'var(--font)', outline: 'none', lineHeight: 1.6,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}
      {...props} />
      {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ─── CARD ────────────────────────────────────────────────────
export function Card({ children, style, hover, ...props }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px',
      transition: 'all var(--transition)',
      ...(hover && hovered ? { borderColor: 'var(--border2)', transform: 'translateY(-2px)', boxShadow: 'var(--shadow)' } : {}),
      ...style,
    }}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    {...props}>{children}</div>
  );
}

// ─── BADGE ───────────────────────────────────────────────────
export function Badge({ children, variant = 'default' }) {
  const variants = {
    default:       { bg: 'var(--bg3)',     color: 'var(--text2)',  border: 'var(--border)' },
    pending:       { bg: 'var(--yellowbg)',color: 'var(--yellow)', border: 'rgba(243,156,18,0.3)' },
    accepted:      { bg: 'var(--bluebg)', color: 'var(--blue)',   border: 'rgba(52,152,219,0.3)' },
    auto_assigned: { bg: 'var(--bluebg)', color: 'var(--blue)',   border: 'rgba(52,152,219,0.3)' },
    in_progress:   { bg: 'var(--accentbg)',color:'var(--accent)',  border: 'rgba(255,107,43,0.3)' },
    completed:     { bg: 'var(--greenbg)', color: 'var(--green)',  border: 'rgba(46,204,113,0.3)' },
    cancelled:     { bg: 'var(--redbg)',   color: 'var(--red)',    border: 'rgba(231,76,60,0.3)' },
    available:     { bg: 'var(--greenbg)', color: 'var(--green)',  border: 'rgba(46,204,113,0.3)' },
    busy:          { bg: 'var(--yellowbg)',color: 'var(--yellow)', border: 'rgba(243,156,18,0.3)' },
    offline:       { bg: 'var(--bg3)',     color: 'var(--text3)',  border: 'var(--border)' },
  };
  const v = variants[children?.toLowerCase()] || variants[variant] || variants.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
      {children}
    </span>
  );
}

// ─── SPINNER ─────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'var(--accent)' }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid ${color}20`,
      borderTopColor: color, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────
export function Empty({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '13px' }}>{subtitle}</div>}
    </div>
  );
}

// ─── LOADING SCREEN ──────────────────────────────────────────
export function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <Spinner size={32} />
    </div>
  );
}

// ─── SERVICE TYPE ICON ───────────────────────────────────────
export function ServiceIcon({ type }) {
  const icons = {
    ELECTRICIAN: '⚡', PLUMBER: '🔧', AC_REPAIR: '❄️',
    CARPENTER: '🪚', PAINTER: '🎨', CLEANER: '🧹',
    APPLIANCE_REPAIR: '🔌', PEST_CONTROL: '🐛',
  };
  return <span>{icons[type] || '🔨'}</span>;
}

// ─── DIVIDER ─────────────────────────────────────────────────
export function Divider({ style }) {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', ...style }} />;
}
