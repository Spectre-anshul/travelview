import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ============================================
   Country List + Flag Helper
   ============================================ */
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Bhutan','Bolivia','Bosnia and Herzegovina',
  'Botswana','Brazil','Brunei','Bulgaria','Cambodia','Cameroon','Canada','Chile','China','Colombia',
  'Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Dominican Republic','Ecuador','Egypt','El Salvador',
  'Estonia','Ethiopia','Fiji','Finland','France','Georgia','Germany','Ghana','Greece','Guatemala',
  'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel',
  'Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Laos','Latvia','Lebanon',
  'Libya','Lithuania','Luxembourg','Madagascar','Malaysia','Maldives','Mali','Malta','Mexico','Moldova',
  'Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Nepal','Netherlands','New Zealand','Nicaragua',
  'Nigeria','North Macedonia','Norway','Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Poland',
  'Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia',
  'Slovenia','South Africa','South Korea','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan',
  'Tanzania','Thailand','Tunisia','Turkey','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay',
  'Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

const COUNTRY_CODES: Record<string, string> = {
  'Afghanistan':'AF','Albania':'AL','Algeria':'DZ','Andorra':'AD','Angola':'AO','Argentina':'AR','Armenia':'AM',
  'Australia':'AU','Austria':'AT','Azerbaijan':'AZ','Bahamas':'BS','Bahrain':'BH','Bangladesh':'BD','Barbados':'BB',
  'Belarus':'BY','Belgium':'BE','Belize':'BZ','Bhutan':'BT','Bolivia':'BO','Bosnia and Herzegovina':'BA',
  'Botswana':'BW','Brazil':'BR','Brunei':'BN','Bulgaria':'BG','Cambodia':'KH','Cameroon':'CM','Canada':'CA',
  'Chile':'CL','China':'CN','Colombia':'CO','Costa Rica':'CR','Croatia':'HR','Cuba':'CU','Cyprus':'CY',
  'Czech Republic':'CZ','Denmark':'DK','Dominican Republic':'DO','Ecuador':'EC','Egypt':'EG','El Salvador':'SV',
  'Estonia':'EE','Ethiopia':'ET','Fiji':'FJ','Finland':'FI','France':'FR','Georgia':'GE','Germany':'DE',
  'Ghana':'GH','Greece':'GR','Guatemala':'GT','Haiti':'HT','Honduras':'HN','Hungary':'HU','Iceland':'IS',
  'India':'IN','Indonesia':'ID','Iran':'IR','Iraq':'IQ','Ireland':'IE','Israel':'IL','Italy':'IT',
  'Jamaica':'JM','Japan':'JP','Jordan':'JO','Kazakhstan':'KZ','Kenya':'KE','Kuwait':'KW','Laos':'LA',
  'Latvia':'LV','Lebanon':'LB','Libya':'LY','Lithuania':'LT','Luxembourg':'LU','Madagascar':'MG','Malaysia':'MY',
  'Maldives':'MV','Mali':'ML','Malta':'MT','Mexico':'MX','Moldova':'MD','Monaco':'MC','Mongolia':'MN',
  'Montenegro':'ME','Morocco':'MA','Mozambique':'MZ','Myanmar':'MM','Nepal':'NP','Netherlands':'NL',
  'New Zealand':'NZ','Nicaragua':'NI','Nigeria':'NG','North Macedonia':'MK','Norway':'NO','Oman':'OM',
  'Pakistan':'PK','Panama':'PA','Paraguay':'PY','Peru':'PE','Philippines':'PH','Poland':'PL','Portugal':'PT',
  'Qatar':'QA','Romania':'RO','Russia':'RU','Rwanda':'RW','Saudi Arabia':'SA','Senegal':'SN','Serbia':'RS',
  'Singapore':'SG','Slovakia':'SK','Slovenia':'SI','South Africa':'ZA','South Korea':'KR','Spain':'ES',
  'Sri Lanka':'LK','Sudan':'SD','Sweden':'SE','Switzerland':'CH','Syria':'SY','Taiwan':'TW','Tanzania':'TZ',
  'Thailand':'TH','Tunisia':'TN','Turkey':'TR','Uganda':'UG','Ukraine':'UA','United Arab Emirates':'AE',
  'United Kingdom':'GB','United States':'US','Uruguay':'UY','Uzbekistan':'UZ','Venezuela':'VE','Vietnam':'VN',
  'Yemen':'YE','Zambia':'ZM','Zimbabwe':'ZW',
};

function getCountryFlag(country: string): string {
  const code = COUNTRY_CODES[country];
  if (!code) return '🌍';
  return String.fromCodePoint(
    ...code.split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

/* ============================================
   Types
   ============================================ */
export interface BookingData {
  country: string;
  days: number;
  budget: number;
  entryCity: string;
  startDate: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingData) => void;
}

/* ============================================
   BookingModal Component
   ============================================ */
const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState(2000);
  const [entryCity, setEntryCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  /* ---- Filtered country suggestions ---- */
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES.slice(0, 10);
    return COUNTRIES.filter((c) =>
      c.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
  }, [searchQuery]);

  /* ---- Focus search on open ---- */
  useEffect(() => {
    if (isOpen && step === 1) {
      setTimeout(() => searchRef.current?.focus(), 400);
    }
  }, [isOpen, step]);

  /* ---- Reset on close ---- */
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearchQuery('');
      setSelectedCountry('');
      setDays(5);
      setBudget(2000);
      setEntryCity('');
      setStartDate('');
    }
  }, [isOpen]);

  /* ---- Handlers ---- */
  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setSearchQuery(country);
    setStep(2);
  };

  const handleSubmit = () => {
    if (!selectedCountry || !entryCity.trim() || !startDate) return;
    onSubmit({
      country: selectedCountry,
      days,
      budget,
      entryCity: entryCity.trim(),
      startDate,
    });
  };

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="booking-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Close */}
        <button className="booking-close-btn" onClick={onClose} aria-label="Close booking">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          {/* ======== Step 1: Country Search ======== */}
          {step === 1 && (
            <motion.div
              key="step1"
              className="booking-step"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="booking-step-icon">✦</div>
              <h2 className="booking-title">
                Where do you want to <span className="text-gold">explore?</span>
              </h2>
              <p className="booking-subtitle">
                Enter your dream destination country
              </p>

              <div className="booking-search-wrapper">
                <svg className="booking-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  className="booking-search-input"
                  placeholder="Search a country…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="booking-suggestions">
                {filteredCountries.map((country) => (
                  <motion.button
                    key={country}
                    className="booking-suggestion-item"
                    onClick={() => handleCountrySelect(country)}
                    whileHover={{ scale: 1.02, x: 6 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="booking-suggestion-flag">{getCountryFlag(country)}</span>
                    <span>{country}</span>
                    <svg className="booking-suggestion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ======== Step 2: Trip Details Form ======== */}
          {step === 2 && (
            <motion.div
              key="step2"
              className="booking-step"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <button className="booking-back-btn" onClick={() => setStep(1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Change Country
              </button>

              <h2 className="booking-title">
                Plan your trip to{' '}
                <span className="text-gold">
                  {getCountryFlag(selectedCountry)} {selectedCountry}
                </span>
              </h2>
              <p className="booking-subtitle">Tell us about your dream escape</p>

              <div className="booking-form">
                {/* Days */}
                <div className="booking-field">
                  <label className="booking-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Duration of Stay
                  </label>
                  <div className="booking-stepper">
                    <button
                      className="booking-stepper-btn"
                      onClick={() => setDays((d) => Math.max(1, d - 1))}
                    >
                      −
                    </button>
                    <span className="booking-stepper-value">
                      {days} {days === 1 ? 'Day' : 'Days'}
                    </span>
                    <button
                      className="booking-stepper-btn"
                      onClick={() => setDays((d) => Math.min(30, d + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Budget */}
                <div className="booking-field">
                  <label className="booking-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Exploration Budget
                  </label>
                  <input
                    type="range"
                    className="booking-range"
                    min="200"
                    max="15000"
                    step="100"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                  />
                  <div className="booking-budget-display">
                    ${budget.toLocaleString()} <span className="text-muted-sm">USD</span>
                  </div>
                </div>

                {/* Entry City */}
                <div className="booking-field">
                  <label className="booking-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Starting City
                  </label>
                  <input
                    type="text"
                    className="booking-text-input"
                    placeholder="e.g., Mumbai, New York, London…"
                    value={entryCity}
                    onChange={(e) => setEntryCity(e.target.value)}
                  />
                </div>

                {/* Start Date */}
                <div className="booking-field">
                  <label className="booking-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Trip Start Date
                  </label>
                  <input
                    type="date"
                    className="booking-text-input"
                    min={tomorrow}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {/* Submit */}
                <motion.button
                  className="btn-pill btn-pill-gold booking-submit-btn"
                  onClick={handleSubmit}
                  disabled={!selectedCountry || !entryCity.trim() || !startDate}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  ✦ Generate My Escape
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingModal;
