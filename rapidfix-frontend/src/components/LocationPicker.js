import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix broken leaflet default marker icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Moves map when position changes externally (e.g. GPS button) ──
function MapMover({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.setView(position, 16);
    }, [position, map]);
    return null;
}

// ── Handles click on map to drop pin ──
function ClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) { onMapClick(e.latlng); },
    });
    return null;
}

export default function LocationPicker({ value, onChange }) {
    // value = { lat, lng, address }
    // onChange = ({ lat, lng, address }) => void

    const [query,       setQuery]       = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searching,   setSearching]   = useState(false);
    const [position,    setPosition]    = useState(
        value?.lat ? [value.lat, value.lng] : [17.385, 78.4867] // Default: Hyderabad
    );
    const debounceRef = useRef(null);

    // ── Search address via Nominatim ──
    const searchAddress = (q) => {
        setQuery(q);
        setSuggestions([]);
        if (q.length < 3) return;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res  = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const data = await res.json();
                setSuggestions(data);
            } catch { /* silent */ }
            finally { setSearching(false); }
        }, 500);
    };

    // ── User picks a suggestion from dropdown ──
    const pickSuggestion = (place) => {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        const address = place.display_name;
        setPosition([lat, lng]);
        setQuery(address);
        setSuggestions([]);
        onChange({ lat, lng, address });
    };

    // ── User clicks on map ──
    const handleMapClick = async ({ lat, lng }) => {
        setPosition([lat, lng]);
        // Reverse geocode to get address
        try {
            const res  = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setQuery(address);
            onChange({ lat, lng, address });
        } catch {
            onChange({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        }
    };

    // ── User drags the marker ──
    const handleDragEnd = async (e) => {
        const { lat, lng } = e.target.getLatLng();
        setPosition([lat, lng]);
        try {
            const res  = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setQuery(address);
            onChange({ lat, lng, address });
        } catch {
            onChange({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* ── Address search box ── */}
            <div style={{ position: 'relative' }}>
                <label style={{
                    fontSize: '13px', fontWeight: 500,
                    color: 'var(--text2)', display: 'block', marginBottom: '6px'
                }}>
                    Address
                </label>
                <input
                    value={query}
                    onChange={e => searchAddress(e.target.value)}
                    placeholder="Type your address or landmark..."
                    style={{
                        width: '100%', padding: '10px 14px',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius2)',
                        background: 'var(--bg2)', color: 'var(--text)',
                        fontSize: '14px', fontFamily: 'var(--font)',
                        outline: 'none', boxSizing: 'border-box',
                    }}
                />
                {searching && (
                    <span style={{
                        position: 'absolute', right: '12px', top: '38px',
                        fontSize: '11px', color: 'var(--text3)'
                    }}>
            Searching...
          </span>
                )}

                {/* ── Suggestions dropdown ── */}
                {suggestions.length > 0 && (
                    <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius2)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        maxHeight: '200px', overflowY: 'auto', marginTop: '2px',
                    }}>
                        {suggestions.map((place, i) => (
                            <div key={i} onClick={() => pickSuggestion(place)} style={{
                                padding: '10px 14px', cursor: 'pointer', fontSize: '13px',
                                color: 'var(--text)', display: 'flex', alignItems: 'flex-start', gap: '8px',
                                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border3)' : 'none',
                            }}
                                 onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <MapPin size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent)' }} />
                                <span style={{ lineHeight: 1.4 }}>{place.display_name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Map ── */}
            <div style={{ borderRadius: 'var(--radius2)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <MapContainer
                    center={position}
                    zoom={14}
                    style={{ height: '280px', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    <MapMover position={position} />
                    <ClickHandler onMapClick={handleMapClick} />
                    <Marker
                        position={position}
                        draggable={true}
                        eventHandlers={{ dragend: handleDragEnd }}
                    />
                </MapContainer>
            </div>

            {/* ── Hint text ── */}
            <p style={{ fontSize: '11px', color: 'var(--text3)', margin: 0 }}>
                📍 Click on the map or drag the pin to set your exact location
            </p>

            {/* ── Coordinates display ── */}
            {value?.lat && (
                <div style={{
                    fontSize: '11px', color: 'var(--text3)',
                    padding: '6px 10px', background: 'var(--bg3)',
                    borderRadius: 'var(--radius2)', fontFamily: 'monospace'
                }}>
                    {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
                </div>
            )}
        </div>
    );
}