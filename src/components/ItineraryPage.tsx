import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { BookingData } from './BookingModal';
import type { ItineraryData } from './EscapeLoader';

const WEATHER_ICONS: Record<string, string> = {
  sunny:'☀️', cloudy:'☁️', partly_cloudy:'⛅', rainy:'🌧️', stormy:'⛈️', snowy:'❄️', foggy:'🌫️'
};
const CAT_ICONS: Record<string, string> = {
  landmark:'🏛️', food:'🍜', nature:'🌿', culture:'🎭', shopping:'🛍️', adventure:'🏔️', nightlife:'🌃'
};
const PARTNERS = [
  { name:'TripAdvisor', color:'#34e0a1', icon:'🦉', url:'https://www.tripadvisor.com', desc:'World\'s largest travel guidance platform with millions of reviews and opinions.' },
  { name:'Expedia', color:'#ffd54f', icon:'✈️', url:'https://www.expedia.com', desc:'Book flights, hotels, car rentals and activities at competitive prices.' },
  { name:'Booking.com', color:'#003580', icon:'🏨', url:'https://www.booking.com', desc:'Over 28 million accommodation listings including hotels, apartments, and more.' },
  { name:'Airbnb', color:'#FF5A5F', icon:'🏠', url:'https://www.airbnb.com', desc:'Unique homes, experiences, and places to stay around the world.' },
  { name:'Viator', color:'#396', icon:'🎫', url:'https://www.viator.com', desc:'Thousands of tours, activities, and attractions bookable in advance.' },
];

function formatDate(d: string) {
  try { return new Date(d+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); }
  catch { return d; }
}

function starString(r: number) {
  const full = Math.floor(r), half = r % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

interface Props { data: ItineraryData; bookingData: BookingData; onBack: () => void; }

const ItineraryPage: React.FC<Props> = ({ data, bookingData, onBack }) => {
  const [navScrolled, setNavScrolled] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const h = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* -------- Map + Route -------- */
  const allPlaces = data.days.flatMap(d => d.places).filter(p => p.lat && p.lon);

  useEffect(() => {
    if (!mapRef.current || allPlaces.length === 0) return;
    let cancelled = false;

    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css');
      if (cancelled || !mapRef.current) return;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }

      requestAnimationFrame(() => {
        if (!mapRef.current || cancelled) return;
        const map = L.map(mapRef.current, { center: [allPlaces[0].lat, allPlaces[0].lon], zoom: 6, zoomControl: false, attributionControl: false });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO' }).addTo(map);

        const goldSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#dfc99a"/><stop offset="100%" stop-color="#c9a96e"/></linearGradient></defs><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="url(#g)"/><circle cx="14" cy="14" r="6" fill="#050505"/><circle cx="14" cy="14" r="3" fill="#dfc99a"/></svg>`;
        const icon = L.icon({ iconUrl: `data:image/svg+xml;base64,${btoa(goldSvg)}`, iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -42] });

        allPlaces.forEach((p, i) => {
          const marker = L.marker([p.lat, p.lon], { icon }).addTo(map);
          const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}&query_place_id=${encodeURIComponent(p.name)}`;
          const popupHtml = `
            <div class="map-popup-card" style="min-width:220px;max-width:280px">
              <div class="map-popup-title">${i + 1}. ${p.name}</div>
              <div class="map-popup-cat">${CAT_ICONS[p.category] || '📍'} ${p.category} • ${p.durationHours}h visit</div>
              ${p.description ? `<div class="map-popup-desc">${p.description}</div>` : ''}
              <div class="map-popup-cost">~$${p.estimatedCost}</div>
              ${p.explorationTip ? `<div class="map-popup-tip">💡 ${p.explorationTip}</div>` : ''}
              <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="map-popup-gmaps-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Open in Google Maps →
              </a>
            </div>`;
          marker.bindPopup(popupHtml, { closeButton: false, maxWidth: 300, className: 'tv-map-popup' });
        });

        // Fit bounds
        const bounds = L.latLngBounds(allPlaces.map(p => [p.lat, p.lon] as [number, number]));
        map.fitBounds(bounds, { padding: [50, 50] });

        // Draw route via OSRM
        if (allPlaces.length >= 2) {
          const coords = allPlaces.map(p => `${p.lon},${p.lat}`).join(';');
          fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
            .then(r => r.json()).then(d => {
              if (d.code === 'Ok' && d.routes?.[0]) {
                const routeCoords = d.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
                L.polyline(routeCoords, { color: '#c9a96e', weight: 3, opacity: 0.8, dashArray: '8 6' }).addTo(map);

                // Add duration info to markers
                if (d.routes[0].legs) {
                  d.routes[0].legs.forEach((leg: any, idx: number) => {
                    if (idx + 1 < allPlaces.length) {
                      const mins = Math.round(leg.duration / 60);
                      const km = (leg.distance / 1000).toFixed(1);
                      const p = allPlaces[idx + 1];
                      map.eachLayer((layer: any) => {
                        if (layer.getLatLng && Math.abs(layer.getLatLng().lat - p.lat) < 0.001) {
                          const prevContent = layer.getPopup()?.getContent() || '';
                          const travelInfo = `<div class="map-popup-travel">🚗 ${mins < 60 ? mins + ' min' : Math.floor(mins/60) + 'h ' + (mins%60) + 'min'} • ${km} km from previous</div>`;
                          layer.setPopupContent(prevContent.replace('<a href=', travelInfo + '<a href='));
                        }
                      });
                    }
                  });
                }
              }
            }).catch(() => {
              // Fallback: draw straight lines
              const pts = allPlaces.map(p => [p.lat, p.lon] as [number, number]);
              L.polyline(pts, { color: '#c9a96e', weight: 2, opacity: 0.6, dashArray: '6 8' }).addTo(map);
            });
        }

        mapInstance.current = map;
        setTimeout(() => map.invalidateSize(), 300);
      });
    });

    return () => { cancelled = true; if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, []);

  const handleImgError = useCallback((name: string) => {
    setImgErrors(prev => new Set(prev).add(name));
  }, []);

  return (
    <div className="itin-page">
      {/* === Navbar === */}
      <nav className={`tv-navbar ${navScrolled ? 'scrolled' : ''}`} style={navScrolled ? {} : { background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="itin-back-btn" onClick={onBack} aria-label="Go back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <a href="#" className="tv-brand" onClick={(e) => { e.preventDefault(); onBack(); }}>Travel<span>View</span></a>
          </div>
          <div className="itin-nav-meta">
            <span>{bookingData.days} Days</span>
            <span className="itin-nav-dot">•</span>
            <span className="text-gold">{data.country}</span>
          </div>
        </div>
      </nav>

      {/* === Hero === */}
      <section className="itin-hero">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <div className="itin-hero-tag">YOUR CURATED ESCAPE</div>
          <h1 className="display-hero display-hero-lg">
            {data.country}<br /><span className="text-gold">Unveiled.</span>
          </h1>
          <p className="text-subtitle" style={{ maxWidth: 600, margin: '0 auto' }}>{data.summary}</p>
          <div className="itin-hero-meta">
            <div className="itin-meta-chip"><span>📅</span> {bookingData.days} Days</div>
            <div className="itin-meta-chip"><span>💰</span> ${bookingData.budget.toLocaleString()}</div>
            <div className="itin-meta-chip"><span>📍</span> From {bookingData.entryCity}</div>
            <div className="itin-meta-chip"><span>🗓️</span> {formatDate(bookingData.startDate)}</div>
          </div>
        </motion.div>
      </section>

      {/* === Weather Dashboard === */}
      <section className="itin-section">
        <div className="container">
          <h2 className="itin-section-title">Weather <span className="text-gold">Dashboard</span></h2>
          <p className="itin-section-sub">Forecast overview for your destinations</p>
          <div className="itin-weather-scroll">
            {data.weatherOverview.map((w, i) => (
              <motion.div key={i} className="weather-dash-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="wdc-icon">{WEATHER_ICONS[w.icon] || '🌡️'}</div>
                <div className="wdc-city">{w.city}</div>
                <div className="wdc-temp">{w.tempHighC}° <span className="wdc-temp-low">/ {w.tempLowC}°</span></div>
                <div className="wdc-condition">{w.condition}</div>
                <div className="wdc-details">
                  <span>💧 {w.humidity}%</span>
                  <span>💨 {w.windKmh} km/h</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === Day-by-Day Itinerary === */}
      <section className="itin-section">
        <div className="container">
          <h2 className="itin-section-title">Your <span className="text-gold">Itinerary</span></h2>
          <p className="itin-section-sub">A day-by-day guide to your perfect escape</p>
          <div className="itin-days-list">
            {data.days.map((day, di) => (
              <motion.div key={di} className="itin-day-card" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, delay: 0.1 }}>
                <div className="itin-day-header">
                  <div className="itin-day-badge">Day {day.day}</div>
                  <div>
                    <h3 className="itin-day-title">{day.title}</h3>
                    <div className="itin-day-info">📍 {day.city} • {formatDate(day.date)}</div>
                  </div>
                </div>
                <div className="itin-places-grid">
                  {day.places.map((place, pi) => {
                    const imgUrl = `https://source.unsplash.com/600x400/?${encodeURIComponent(place.name + ' ' + place.category)}`;
                    const hasError = imgErrors.has(place.name);
                    return (
                      <motion.div key={pi} className="itin-place-card" initial={{ opacity: 0, x: pi % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: pi * 0.08 }}>
                        <div className="itin-place-img-wrap">
                          {!hasError ? (
                            <img src={imgUrl} alt={place.name} className="itin-place-img" loading="lazy" onError={() => handleImgError(place.name)} />
                          ) : (
                            <div className="itin-place-img-fallback">
                              <span>{CAT_ICONS[place.category] || '📍'}</span>
                              <span>{place.name}</span>
                            </div>
                          )}
                          <div className="itin-place-cat-badge">{CAT_ICONS[place.category] || '📍'} {place.category}</div>
                        </div>
                        <div className="itin-place-body">
                          <h4 className="itin-place-name">{place.name}</h4>
                          <p className="itin-place-desc">{place.description}</p>
                          <div className="itin-place-meta-row">
                            <span>⏱️ {place.durationHours}h</span>
                            <span>💰 ${place.estimatedCost}</span>
                          </div>
                          {place.explorationTip && (
                            <div className="itin-place-tip">💡 <em>{place.explorationTip}</em></div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === Route Map === */}
      <section className="itin-section itin-map-section">
        <div className="container">
          <h2 className="itin-section-title">Route <span className="text-gold">Overview</span></h2>
          <p className="itin-section-sub">Your journey mapped with ETA & exploration times</p>
          <motion.div className="itin-map-wrap" initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '16px' }} />
          </motion.div>
        </div>
      </section>

      {/* === Reviews === */}
      <section className="itin-section">
        <div className="container">
          <h2 className="itin-section-title">Traveler <span className="text-gold">Reviews</span></h2>
          <p className="itin-section-sub">What visitors from around the world suggest</p>
          <div className="itin-reviews-grid">
            {data.reviews.map((rev, i) => (
              <motion.div key={i} className="itin-review-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="itin-review-header">
                  <div className="itin-review-avatar">{rev.author.charAt(0)}</div>
                  <div>
                    <div className="itin-review-author">{rev.author}</div>
                    <div className="itin-review-country">🌍 {rev.authorCountry}</div>
                  </div>
                  <div className="itin-review-rating">{starString(rev.rating)}</div>
                </div>
                <p className="itin-review-text">"{rev.text}"</p>
                {rev.tip && <div className="itin-review-tip">💡 {rev.tip}</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === Partner Links === */}
      <section className="itin-section itin-partners-section">
        <div className="container">
          <h2 className="itin-section-title">Premium <span className="text-gold">Packages</span></h2>
          <p className="itin-section-sub">Explore curated packages from trusted travel partners</p>
          <div className="itin-partners-grid">
            {PARTNERS.map((p, i) => (
              <motion.a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="itin-partner-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4, scale: 1.02 }}>
                <div className="itin-partner-accent" style={{ background: p.color }} />
                <div className="itin-partner-body">
                  <div className="itin-partner-top">
                    <span className="itin-partner-icon">{p.icon}</span>
                    <span className="itin-partner-name">{p.name}</span>
                  </div>
                  <p className="itin-partner-desc">{p.desc}</p>
                  <div className="itin-partner-link">
                    Explore Premium Packages →
                  </div>
                  <div className="itin-partner-url">{p.url.replace('https://', '')}</div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="tv-footer">
        <div className="container">
          <div className="tv-footer-bottom" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
            <span>© 2026 TravelView. All rights reserved.</span>
            <button className="btn-pill btn-pill-outline" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }} onClick={onBack}>
              ← Plan Another Trip
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ItineraryPage;
