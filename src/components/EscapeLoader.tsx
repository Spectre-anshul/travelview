import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { BookingData } from './BookingModal';

export interface Place {
  name: string; description: string; lat: number; lon: number;
  durationHours: number; estimatedCost: number; category: string; explorationTip: string;
}
export interface DayPlan { day: number; date: string; title: string; city: string; places: Place[]; }
export interface WeatherInfo { city: string; tempHighC: number; tempLowC: number; condition: string; humidity: number; windKmh: number; icon: string; }
export interface Review { author: string; authorCountry: string; rating: number; text: string; tip: string; }
export interface ItineraryData { country: string; summary: string; weatherOverview: WeatherInfo[]; days: DayPlan[]; reviews: Review[]; }

const GROQ_BACKEND = import.meta.env.VITE_GROQ_BACKEND_URL
  || (window.location.hostname !== 'localhost' ? 'https://travelview-groq.onrender.com' : 'http://localhost:5001');

async function generateItinerary(data: BookingData): Promise<ItineraryData> {
  const res = await fetch(`${GROQ_BACKEND}/groq/itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      country: data.country,
      days: data.days,
      budget: data.budget,
      entryCity: data.entryCity,
      startDate: data.startDate,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Server error (${res.status})`);
  }

  if (!json.itinerary) {
    throw new Error('No itinerary data received from server.');
  }

  return json.itinerary as ItineraryData;
}

const MSGS = ['Scanning hidden gems…','Mapping local secrets…','Crafting your perfect route…','Consulting local insiders…','Optimizing your budget…','Curating experiences…','Checking weather forecasts…','Finding best viewpoints…','Building your itinerary…','Almost there…'];

interface Props { bookingData: BookingData; onComplete: (d: ItineraryData) => void; onError: () => void; }

const EscapeLoader: React.FC<Props> = ({ bookingData, onComplete, onError }) => {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let p = 0;
    const pi = setInterval(() => { p += Math.random()*4+1; if(p>92) p=92; setProgress(p); }, 300);
    const mi = setInterval(() => setMsgIdx(i=>(i+1)%MSGS.length), 2800);

    generateItinerary(bookingData).then(data => {
      clearInterval(pi); clearInterval(mi);
      setProgress(100); setTimeout(() => onComplete(data), 900);
    }).catch(err => {
      clearInterval(pi); clearInterval(mi);
      setError(err.message || 'Something went wrong.');
    });
    return () => { clearInterval(pi); clearInterval(mi); };
  }, [bookingData, onComplete, onError]);

  return (
    <motion.div className="loader-fullscreen escape-loader" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5}}>
      <div className="escape-loader-bg">
        <div className="escape-loader-ring escape-loader-ring-1"/>
        <div className="escape-loader-ring escape-loader-ring-2"/>
        <div className="escape-loader-ring escape-loader-ring-3"/>
      </div>
      {error ? (
        <div className="escape-loader-error">
          <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>⚠</div>
          <h3 style={{color:'var(--tv-white)',fontSize:'1.3rem',fontWeight:700,marginBottom:'0.5rem'}}>
            {error.includes('Failed to fetch') || error.includes('NetworkError')
              ? 'Backend Unreachable'
              : error.includes('429') || error.includes('rate')
                ? 'API Rate Limit Reached'
                : 'Generation Failed'}
          </h3>
          <p style={{color:'var(--tv-muted)',marginBottom:'0.3rem',fontSize:'0.9rem',maxWidth:'480px',margin:'0 auto 0.3rem'}}>
            {error.includes('Failed to fetch') || error.includes('NetworkError')
              ? 'Could not reach the Groq backend server. Make sure the Flask server is running on port 5001.'
              : error.includes('429') || error.includes('rate')
                ? 'The Groq AI service is temporarily rate-limited. Please wait a moment and try again.'
                : 'Something went wrong while generating your itinerary. Please try again.'}
          </p>
          <p style={{color:'rgba(255,255,255,0.2)',fontSize:'0.72rem',marginBottom:'1.5rem'}}>Error: {error.length > 120 ? error.slice(0,120)+'…' : error}</p>
          <button className="btn-pill btn-pill-gold" onClick={onError}>← Try Again</button>
        </div>
      ) : (
        <>
          <div className="escape-loader-destination">
            <span className="escape-loader-tag">DESTINATION</span>
            <h2 className="escape-loader-country">{bookingData.country}</h2>
          </div>
          <div className="loader-percent">{Math.round(progress)}%</div>
          <div className="loader-bar-track" style={{width:'320px'}}>
            <motion.div className="loader-bar-fill" animate={{width:`${progress}%`}} transition={{duration:0.3,ease:'easeOut'}}/>
          </div>
          <motion.div className="escape-loader-message" key={msgIdx} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>
            {MSGS[msgIdx]}
          </motion.div>
          <div className="escape-loader-meta">{bookingData.days} Days • ${bookingData.budget.toLocaleString()} Budget • From {bookingData.entryCity}</div>
        </>
      )}
    </motion.div>
  );
};

export default EscapeLoader;
