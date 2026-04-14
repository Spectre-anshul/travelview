import React, { useState } from 'react';
import TravelPage from './components/TravelPage';
import EscapeLoader from './components/EscapeLoader';
import ItineraryPage from './components/ItineraryPage';
import type { BookingData } from './components/BookingModal';
import type { ItineraryData } from './components/EscapeLoader';

const App: React.FC = () => {
  const [page, setPage] = useState<'home' | 'loading' | 'itinerary'>('home');
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);

  const handleBookEscape = (data: BookingData) => {
    setBookingData(data);
    setPage('loading');
  };

  const handleItineraryReady = (data: ItineraryData) => {
    setItineraryData(data);
    setPage('itinerary');
  };

  const handleBack = () => {
    setPage('home');
    setBookingData(null);
    setItineraryData(null);
    window.scrollTo(0, 0);
  };

  if (page === 'loading' && bookingData) {
    return (
      <EscapeLoader
        bookingData={bookingData}
        onComplete={handleItineraryReady}
        onError={handleBack}
      />
    );
  }

  if (page === 'itinerary' && itineraryData && bookingData) {
    return (
      <ItineraryPage
        data={itineraryData}
        bookingData={bookingData}
        onBack={handleBack}
      />
    );
  }

  return <TravelPage onBookEscape={handleBookEscape} />;
};

export default App;
