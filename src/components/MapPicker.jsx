import { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin as PinIcon, Loader2, Sparkles, Search, Maximize2, Minimize2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [17.9892, -92.9281]; // Default fallback location

export default function MapPicker({ lat, lng, onChange }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);

  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const initialLat = Number(lat) || DEFAULT_CENTER[0];
  const initialLng = Number(lng) || DEFAULT_CENTER[1];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: lat && lng ? 15 : 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const newLat = Number(pos.lat.toFixed(6));
        const newLng = Number(pos.lng.toFixed(6));
        onChange({ lat: newLat, lng: newLng });
      });

      map.on('click', (e) => {
        const clickedLat = Number(e.latlng.lat.toFixed(6));
        const clickedLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([clickedLat, clickedLng]);
        onChange({ lat: clickedLat, lng: clickedLng });
      });

      mapRef.current = map;
      markerRef.current = marker;
    } else {
      if (lat && lng && markerRef.current) {
        const curPos = markerRef.current.getLatLng();
        if (Math.abs(curPos.lat - Number(lat)) > 0.0001 || Math.abs(curPos.lng - Number(lng)) > 0.0001) {
          markerRef.current.setLatLng([Number(lat), Number(lng)]);
          mapRef.current.setView([Number(lat), Number(lng)], mapRef.current.getZoom());
        }
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Invalidate map size when expanded state changes
  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = Number(position.coords.latitude.toFixed(6));
        const userLng = Number(position.coords.longitude.toFixed(6));

        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([userLat, userLng]);
          mapRef.current.setView([userLat, userLng], 16);
        }

        onChange({ lat: userLat, lng: userLng });
        setLocating(false);
      },
      (err) => {
        alert('Could not retrieve your location: ' + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleReverseGeocode = async () => {
    const curLat = lat || (markerRef.current ? markerRef.current.getLatLng().lat : null);
    const curLng = lng || (markerRef.current ? markerRef.current.getLatLng().lng : null);

    if (!curLat || !curLng) {
      alert('Please place a pin on the map first.');
      return;
    }

    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${curLat}&lon=${curLng}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        onChange({ lat: Number(curLat), lng: Number(curLng), address: data.display_name });
      } else {
        alert('Address not found for these coordinates.');
      }
    } catch (err) {
      alert('Geocoding error: ' + err.message);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setSearchResults(data.slice(0, 5));
        selectSearchResult(data[0]);
      } else {
        alert('No locations found matching "' + searchQuery + '"');
      }
    } catch (err) {
      alert('Search error: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const itemLat = Number(parseFloat(item.lat).toFixed(6));
    const itemLng = Number(parseFloat(item.lon).toFixed(6));

    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([itemLat, itemLng]);
      mapRef.current.setView([itemLat, itemLng], 16);
    }

    onChange({ lat: itemLat, lng: itemLng, address: item.display_name });
    setSearchResults([]);
  };

  return (
    <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '0.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search address, city, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchSubmit(e);
                }
              }}
              style={{ paddingRight: '2rem' }}
            />
            {searching && (
              <Loader2
                size={14}
                style={{
                  position: 'absolute',
                  right: '0.625rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  animation: 'spin 0.7s linear infinite',
                  color: 'var(--c-text-muted)',
                }}
              />
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary flex items-center gap-1"
            disabled={searching}
            onClick={handleSearchSubmit}
          >
            <Search size={14} /> Search
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'var(--c-bg-card)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              marginTop: '4px',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            {searchResults.map((item) => (
              <div
                key={item.place_id}
                onClick={() => selectSearchResult(item)}
                style={{
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  borderBottom: '1px solid var(--c-border)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-bg-surface)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontWeight: 600 }}>{item.display_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
        <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
          <PinIcon size={14} style={{ color: 'var(--c-primary)' }} /> Click or drag pin on map
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn btn-xs btn-ghost flex items-center gap-1"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            style={{ fontSize: '0.75rem', padding: '2px 8px' }}
            title="Center map on your current GPS location"
          >
            {locating ? <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Navigation size={12} />}
            My Location
          </button>
          <button
            type="button"
            className="btn btn-xs btn-ghost flex items-center gap-1"
            onClick={handleReverseGeocode}
            disabled={geocoding}
            style={{ fontSize: '0.75rem', padding: '2px 8px', color: 'var(--c-primary)' }}
            title="Auto-fill address from pin location"
          >
            {geocoding ? <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Sparkles size={12} />}
            Auto-fill Address
          </button>
          <button
            type="button"
            className="btn btn-xs btn-secondary flex items-center gap-1"
            onClick={() => setIsExpanded((prev) => !prev)}
            style={{ fontSize: '0.75rem', padding: '2px 8px' }}
            title={isExpanded ? 'Collapse map' : 'Make map bigger'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            {isExpanded ? 'Smaller' : 'Bigger Map'}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          height: isExpanded ? '460px' : '220px',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--c-border)',
          overflow: 'hidden',
          zIndex: 1,
          transition: 'height 0.3s ease',
        }}
      />
    </div>
  );
}
