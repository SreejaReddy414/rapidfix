import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// ─── Step 3a: Fix the broken marker icon issue in React ──────
// Without this, marker icons won't show up
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Step 3b: Create custom colored icons ────────────────────
// Red pin for customer location
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
});

// Blue pin for technician location
const technicianIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
});

// ─── Step 3c: Auto-fit map to show both markers ───────────────
// This component adjusts the map zoom automatically
function FitBounds({ customerPos, technicianPos }) {
  const map = useMap();

  useEffect(() => {
    if (customerPos && technicianPos) {
      // Fit both pins on screen with some padding
      const bounds = L.latLngBounds([customerPos, technicianPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (customerPos) {
      // Only customer location available — just center on it
      map.setView(customerPos, 14);
    }
  }, [customerPos, technicianPos, map]);

  return null;
}

// ─── Step 3d: Main Map Component ─────────────────────────────
export default function JobMap({ userLat, userLon, techLat, techLon, address }) {
  const [routePoints, setRoutePoints] = useState(null); // array of [lat, lon] for the route line
  const [routeInfo,   setRouteInfo]   = useState(null); // distance and duration text
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(false);

  // Only calculate positions if values exist
  const customerPos   = userLat  && userLon  ? [userLat,  userLon]  : null;
  const technicianPos = techLat  && techLon  ? [techLat,  techLon]  : null;

  // Default center — fallback to Hyderabad if no location
  const mapCenter = customerPos || [17.3850, 78.4867];

  // ─── Step 3e: Fetch the driving route ────────────────────────
  // Using OSRM — completely free, no API key needed
  useEffect(() => {
    // Only fetch route if we have BOTH locations
    if (!customerPos || !technicianPos) return;

    const fetchRoute = async () => {
      setLoading(true);
      setError(false);
      try {
        // OSRM public API — free, no key required
        // Format: /route/v1/driving/startLon,startLat;endLon,endLat
        const url = `https://router.project-osrm.org/route/v1/driving/` +
                    `${techLon},${techLat};${userLon},${userLat}` +
                    `?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data     = await response.json();

        if (data.code === 'Ok' && data.routes.length > 0) {
          const route = data.routes[0];

          // OSRM returns coordinates as [lon, lat] — Leaflet needs [lat, lon]
          // So we flip each coordinate pair
          const points = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          setRoutePoints(points);

          // Format distance and duration nicely
          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationMin = Math.round(route.duration / 60);
          setRouteInfo({ distanceKm, durationMin });
        } else {
          throw new Error('No route found');
        }
      } catch (err) {
        console.warn('Could not fetch route from OSRM:', err.message);
        setError(true);
        // Fallback — draw a straight dashed line between the two points
        if (customerPos && technicianPos) {
          setRoutePoints([technicianPos, customerPos]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [userLat, userLon, techLat, techLon]);

  // ─── Step 3f: Handle missing customer location ───────────────
  if (!customerPos) {
    return (
      <div style={{
        height: '280px', borderRadius: '12px',
        background: 'var(--bg3)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '8px', color: 'var(--text3)',
      }}>
        <span style={{ fontSize: '24px' }}>📍</span>
        <span style={{ fontSize: '13px' }}>Customer location not available</span>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>

      {/* ── Info bar above the map ── */}
      <div style={{
        padding: '10px 14px', background: 'var(--bg3)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '20px',
        fontSize: '13px',
      }}>
        {loading && (
          <span style={{ color: 'var(--text3)' }}>⏳ Calculating route...</span>
        )}
        {!loading && routeInfo && (
          <>
            <span>🛣️ <strong>{routeInfo.distanceKm} km</strong> away</span>
            <span>⏱️ ~<strong>{routeInfo.durationMin} min</strong> by car</span>
          </>
        )}
        {!loading && error && (
          <span style={{ color: 'var(--yellow)', fontSize: '12px' }}>
            ⚠️ Showing approximate path — route service unavailable
          </span>
        )}
        {!loading && !routeInfo && !technicianPos && (
          <span style={{ color: 'var(--text3)' }}>
            📍 Update your location to see the route
          </span>
        )}
      </div>

      {/* ── The actual map ── */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '300px', width: '100%' }}
        scrollWheelZoom={false}
      >
        {/* OpenStreetMap tiles — 100% free, no API key */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Auto-fit the map to show both pins */}
        <FitBounds customerPos={customerPos} technicianPos={technicianPos} />

        {/* Customer location — RED pin */}
        <Marker position={customerPos} icon={customerIcon}>
          <Popup>
            <div style={{ fontFamily: 'sans-serif', fontSize: '13px' }}>
              <strong>📍 Customer Location</strong><br />
              {address || `${Number(userLat).toFixed(5)}, ${Number(userLon).toFixed(5)}`}
            </div>
          </Popup>
        </Marker>

        {/* Technician location — BLUE pin */}
        {technicianPos && (
          <Marker position={technicianPos} icon={technicianIcon}>
            <Popup>
              <div style={{ fontFamily: 'sans-serif', fontSize: '13px' }}>
                <strong>🔧 Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route line — orange solid line or dashed fallback */}
        {routePoints && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color:     '#E8541A',
              weight:    4,
              opacity:   0.85,
              dashArray: error ? '10, 8' : undefined, // dashed if it's the fallback line
            }}
          />
        )}
      </MapContainer>

      {/* ── Navigate button below the map ── */}
      <div style={{
        padding: '10px 14px', background: 'var(--bg3)',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: '10px', flexWrap: 'wrap',
      }}>
       {/* Opens Google Maps with turn-by-turn navigation */}
        
       <a   href={
            technicianPos
              ? `https://www.google.com/maps/dir/${techLat},${techLon}/${userLat},${userLon}`
              : `https://www.google.com/maps/search/?api=1&query=${userLat},${userLon}`
          }
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px',
            background: 'var(--bluebg)', color: 'var(--blue)',
            border: '1px solid rgba(52,152,219,0.3)',
            borderRadius: 'var(--radius2)', fontSize: '13px',
            fontWeight: 500, textDecoration: 'none',
          }}
        >
          🗺️ Open in Google Maps
        </a>

        {/* Opens Apple Maps — useful on iPhone */}
        
         <a href={`https://maps.apple.com/?saddr=${techLat},${techLon}&daddr=${userLat},${userLon}&dirflg=d`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px',
            background: 'var(--bg3)', color: 'var(--text2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius2)', fontSize: '13px',
            fontWeight: 500, textDecoration: 'none',
          }}>
        
          🍎 Apple Maps
        </a>
      </div>

    </div>
  );
}