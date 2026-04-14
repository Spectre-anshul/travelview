import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* =============================
   Types
   ============================= */
interface CityWeather {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  lat: number;
  lon: number;
}

/* =============================
   Weather Icon Helper
   ============================= */
function getWeatherEmoji(icon: string): string {
  const map: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[icon] || '🌡️';
}

/* =============================
   Main MapOverlay Component
   Uses vanilla Leaflet (no react-leaflet)
   to avoid React 18 context issues
   ============================= */
const MapOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cities, setCities] = useState<CityWeather[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
const SPRING_BACKEND = import.meta.env.VITE_SPRING_BACKEND_URL
  || (window.location.hostname !== 'localhost' ? 'https://travelview-weather.onrender.com' : 'http://localhost:8080');

  // Fetch all cities on mount
  useEffect(() => {
    fetch(`${SPRING_BACKEND}/api/cities`)
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch(() => {
        setCities([
          { city: 'Paris', country: 'FR', temp: 18.5, feelsLike: 17.2, humidity: 62, windSpeed: 12.3, description: 'Partly cloudy', icon: '02d', lat: 48.8566, lon: 2.3522 },
          { city: 'Tokyo', country: 'JP', temp: 24.8, feelsLike: 25.3, humidity: 70, windSpeed: 6.2, description: 'Scattered clouds', icon: '03d', lat: 35.6762, lon: 139.6503 },
          { city: 'New York', country: 'US', temp: 22.1, feelsLike: 21.5, humidity: 55, windSpeed: 8.7, description: 'Clear sky', icon: '01d', lat: 40.7128, lon: -74.006 },
          { city: 'Dubai', country: 'AE', temp: 38.4, feelsLike: 40.1, humidity: 35, windSpeed: 14.8, description: 'Clear sky', icon: '01d', lat: 25.2048, lon: 55.2708 },
          { city: 'Sydney', country: 'AU', temp: 21.6, feelsLike: 20.9, humidity: 65, windSpeed: 18.4, description: 'Broken clouds', icon: '04d', lat: -33.8688, lon: 151.2093 },
          { city: 'Bali', country: 'ID', temp: 29.7, feelsLike: 31.2, humidity: 82, windSpeed: 7.3, description: 'Tropical showers', icon: '09d', lat: -8.3405, lon: 115.092 },
          { city: 'London', country: 'GB', temp: 14.2, feelsLike: 12.8, humidity: 78, windSpeed: 15.1, description: 'Light rain', icon: '10d', lat: 51.5074, lon: -0.1278 },
          { city: 'Maldives', country: 'MV', temp: 30.1, feelsLike: 32.0, humidity: 78, windSpeed: 10.5, description: 'Partly cloudy', icon: '02d', lat: 3.2028, lon: 73.2207 },
          { city: 'Singapore', country: 'SG', temp: 31.0, feelsLike: 34.2, humidity: 80, windSpeed: 8.1, description: 'Partly cloudy', icon: '02d', lat: 1.3521, lon: 103.8198 },
          { city: 'Rome', country: 'IT', temp: 26.3, feelsLike: 26.8, humidity: 48, windSpeed: 9.1, description: 'Sunny', icon: '01d', lat: 41.9028, lon: 12.4964 },
        ]);
      });
  }, []);

  // Build weather tooltip HTML
  const buildPopupHTML = useCallback((city: CityWeather): string => {
    return `
      <div class="weather-tooltip">
        <div class="weather-tooltip-header">
          <span class="weather-tooltip-city">${city.city}</span>
          <span class="weather-tooltip-country">${city.country}</span>
        </div>
        <div class="weather-tooltip-temp">
          <span class="weather-emoji">${getWeatherEmoji(city.icon)}</span>
          <span class="temp-value">${Math.round(city.temp)}°C</span>
        </div>
        <div class="weather-tooltip-desc">${city.description}</div>
        <div class="weather-tooltip-details">
          <span>💧 ${city.humidity}%</span>
          <span>💨 ${city.windSpeed} m/s</span>
          <span>🌡️ Feels ${Math.round(city.feelsLike)}°C</span>
        </div>
      </div>
    `;
  }, []);

  // Initialize map when overlay opens
  useEffect(() => {
    if (!isOpen || !mapRef.current || cities.length === 0) return;

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      // Import CSS
      import('leaflet/dist/leaflet.css');

      // Destroy previous map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Wait a frame for DOM to be ready
      requestAnimationFrame(() => {
        if (!mapRef.current) return;

        const map = L.map(mapRef.current, {
          center: [25, 20],
          zoom: 2,
          minZoom: 2,
          maxZoom: 10,
          zoomControl: false,
          attributionControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CARTO',
        }).addTo(map);

        // Custom gold marker icon
        const goldMarkerSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
            <defs>
              <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#dfc99a"/>
                <stop offset="100%" stop-color="#c9a96e"/>
              </linearGradient>
            </defs>
            <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="url(#g)"/>
            <circle cx="14" cy="14" r="6" fill="#050505"/>
            <circle cx="14" cy="14" r="3" fill="#dfc99a"/>
          </svg>`;

        const goldIcon = L.icon({
          iconUrl: `data:image/svg+xml;base64,${btoa(goldMarkerSvg)}`,
          iconSize: [28, 40],
          iconAnchor: [14, 40],
          popupAnchor: [0, -42],
        });

        // Add markers
        const markers: any[] = [];
        cities.forEach((city) => {
          if (city.lat === 0 && city.lon === 0) return;

          const marker = L.marker([city.lat, city.lon], { icon: goldIcon }).addTo(map);

          // Bind popup with weather data
          marker.bindPopup(buildPopupHTML(city), {
            className: 'weather-popup',
            closeButton: false,
            maxWidth: 260,
          });

          // Open popup on hover
          marker.on('mouseover', function () {
            marker.openPopup();

            // Fetch fresh weather from backend
            fetch(`${SPRING_BACKEND}/api/weather?city=${encodeURIComponent(city.city)}`)
              .then((res) => res.json())
              .then((data: CityWeather) => {
                marker.setPopupContent(buildPopupHTML(data));
              })
              .catch(() => { /* Keep existing data */ });
          });

          marker.on('mouseout', function () {
            marker.closePopup();
          });

          markers.push(marker);
        });

        markersRef.current = markers;
        mapInstanceRef.current = map;

        // Force resize
        setTimeout(() => map.invalidateSize(), 200);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, cities, buildPopupHTML]);

  return (
    <>
      {/* FAB Button */}
      <motion.button
        className="map-fab"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Explore the Map"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </motion.button>

      {/* Map Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="map-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Close button */}
            <button className="map-close-btn" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="map-header">
              <h3 className="map-title">
                Explore <span className="text-gold">Destinations</span>
              </h3>
              <p className="map-subtitle">Hover over a city to see the weather</p>
            </div>

            {/* Leaflet Map Container */}
            <motion.div
              className="map-container"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                ref={mapRef}
                style={{ width: '100%', height: '100%', borderRadius: '16px' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MapOverlay;
