import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  useScroll,
  useTransform,
  useSpring,
  motion,
  useMotionValueEvent,
  AnimatePresence,
} from 'framer-motion';
import Loader from './Loader';
import Marquee from './Marquee';
import MapOverlay from './MapOverlay';
import Chatbot from './Chatbot';
import BookingModal from './BookingModal';
import type { BookingData } from './BookingModal';

const TOTAL_FRAMES = 192;

function getFramePath(index: number): string {
  const padded = String(index).padStart(3, '0');
  return `/frames/frame_${padded}.jpg`;
}

/* =============================
   Feature Card Data
   ============================= */
interface Feature {
  icon: string;
  title: string;
  text: string;
}

const features: Feature[] = [
  {
    icon: '✦',
    title: 'AI Concierge',
    text: 'Describe your dream trip in one sentence. Our AI crafts a bespoke itinerary within seconds.',
  },
  {
    icon: '◎',
    title: 'Soul Matching',
    text: 'We go beyond preferences. Our algorithm reads your travel DNA to suggest experiences you never knew existed.',
  },
  {
    icon: '⟡',
    title: 'Live Local Intel',
    text: 'Real-time weather, events, and insider tips from local agents at your destination.',
  },
  {
    icon: '◈',
    title: 'Seamless Booking',
    text: 'From chat to check-in. One conversation, one tap, your entire trip handled.',
  },
];

/* =============================
   Main Travel Page Component
   ============================= */
interface TravelPageProps {
  onBookEscape: (data: BookingData) => void;
}

const TravelPage: React.FC<TravelPageProps> = ({ onBookEscape }) => {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [navScrolled, setNavScrolled] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  /* -------- Preload Images -------- */
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let loaded = 0;

    const preload = () => {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getFramePath(i);
        img.onload = () => {
          loaded++;
          loadedImages[i] = img;
          setLoadProgress((loaded / TOTAL_FRAMES) * 100);
          if (loaded === TOTAL_FRAMES) {
            setImages([...loadedImages]);
            setTimeout(() => setIsLoading(false), 600);
          }
        };
        img.onerror = () => {
          loaded++;
          setLoadProgress((loaded / TOTAL_FRAMES) * 100);
          if (loaded === TOTAL_FRAMES) {
            setImages([...loadedImages]);
            setTimeout(() => setIsLoading(false), 600);
          }
        };
      }
    };

    preload();
  }, []);

  /* -------- Canvas Resize -------- */
  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  /* -------- Navbar scroll effect -------- */
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* -------- Scroll → Frame -------- */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const frameIndex = useTransform(smoothProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

  /* -------- Beat opacities -------- */
  const beatAOpacity = useTransform(smoothProgress, [0, 0.05, 0.15, 0.22], [0, 1, 1, 0]);
  const beatAY = useTransform(smoothProgress, [0, 0.05, 0.15, 0.22], [40, 0, 0, -40]);

  const beatBOpacity = useTransform(smoothProgress, [0.22, 0.28, 0.45, 0.52], [0, 1, 1, 0]);
  const beatBY = useTransform(smoothProgress, [0.22, 0.28, 0.45, 0.52], [60, 0, 0, -40]);

  const beatCOpacity = useTransform(smoothProgress, [0.52, 0.58, 0.70, 0.77], [0, 1, 1, 0]);
  const beatCY = useTransform(smoothProgress, [0.52, 0.58, 0.70, 0.77], [60, 0, 0, -40]);

  const beatDOpacity = useTransform(smoothProgress, [0.77, 0.84, 0.95, 1], [0, 1, 1, 1]);
  const beatDY = useTransform(smoothProgress, [0.77, 0.84, 0.95, 1], [60, 0, 0, 0]);

  const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.05], [1, 0]);

  /* -------- Canvas draw -------- */
  const drawFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = images[Math.round(Math.max(0, Math.min(index, TOTAL_FRAMES - 1)))];
      if (!img || !img.complete) return;

      const { width: cw, height: ch } = canvas;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, cw, ch);

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = cw / ch;

      let drawW: number, drawH: number, offsetX: number, offsetY: number;
      if (canvasRatio > imgRatio) {
        drawW = cw;
        drawH = cw / imgRatio;
        offsetX = 0;
        offsetY = (ch - drawH) / 2;
      } else {
        drawH = ch;
        drawW = ch * imgRatio;
        offsetX = (cw - drawW) / 2;
        offsetY = 0;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    },
    [images]
  );

  useMotionValueEvent(frameIndex, 'change', (latest) => {
    drawFrame(latest);
  });

  useEffect(() => {
    if (images.length > 0 && canvasSize.width > 0) {
      drawFrame(0);
    }
  }, [images, canvasSize, drawFrame]);

  return (
    <>
      {/* === Loader === */}
      <AnimatePresence>
        {isLoading && <Loader progress={loadProgress} isVisible={isLoading} />}
      </AnimatePresence>

      {/* === Navbar === */}
      <nav className={`tv-navbar ${navScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a href="#" className="tv-brand">
            Travel<span>View</span>
          </a>
          <ul className="tv-nav-links">
            <li><a href="#features">Discover</a></li>
            <li><a href="#testimonials">Stories</a></li>
            <li>
              <a href="#cta" className="btn-pill btn-pill-outline" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}>
                Get Started
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* === Scroll Canvas + Beats === */}
      <div ref={containerRef} className="scroll-canvas-wrapper">
        <div className="scroll-canvas-sticky">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
          />

          {/* Overlay container */}
          <div className="scroll-overlay">

            {/* Beat A: The Vision (0–20%) */}
            <motion.div
              className="scroll-beat"
              style={{ opacity: beatAOpacity, y: beatAY }}
            >
              <div className="container text-center">
                <h1 className="display-hero display-hero-lg mb-3">
                  See The World<br />
                  <span className="text-gold">Differently.</span>
                </h1>
                <p className="text-subtitle mx-auto" style={{ maxWidth: 520 }}>
                  Your journey starts from the big picture. Let AI plan the details.
                </p>
              </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              className="scroll-indicator"
              style={{ opacity: scrollIndicatorOpacity }}
            >
              <span>Scroll to explore</span>
              <div className="scroll-indicator-line" />
            </motion.div>

            {/* Beat B: Core Features (25–50%) */}
            <motion.div
              id="features"
              className="scroll-beat"
              style={{ opacity: beatBOpacity, y: beatBY }}
            >
              <div className="container">
                <div className="text-center mb-5">
                  <h2 className="display-hero display-hero-md mb-3">
                    Hyper-Personalized<br />
                    <span className="text-gold">Discovery.</span>
                  </h2>
                  <p className="text-subtitle mx-auto" style={{ maxWidth: 560 }}>
                    Beyond grids and filters. We use AI to curate experiences that match your soul's rhythm.
                  </p>
                </div>
                <div className="row g-4">
                  {features.map((f, i) => (
                    <div key={i} className="col-md-6 col-lg-3">
                      <div className="feature-card h-100">
                        <div className="feature-card-icon">{f.icon}</div>
                        <h4>{f.title}</h4>
                        <p>{f.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Beat C: Testimonials (55–75%) */}
            <motion.div
              id="testimonials"
              className="scroll-beat"
              style={{ opacity: beatCOpacity, y: beatCY }}
            >
              <div className="container-fluid px-0">
                <div className="text-center mb-4">
                  <h2 className="display-hero display-hero-sm mb-2">
                    Trusted by <span className="text-gold">Global Voyagers.</span>
                  </h2>
                  <p className="text-subtitle">
                    Hear from travelers who've experienced the difference.
                  </p>
                </div>
                <Marquee />
              </div>
            </motion.div>

            {/* Beat D: The Reveal / CTA (80–100%) */}
            <motion.div
              id="cta"
              className="scroll-beat"
              style={{ opacity: beatDOpacity, y: beatDY }}
            >
              <div className="container text-center">
                <h2 className="display-hero display-hero-lg mb-3">
                  Your Oasis<br />
                  <span className="text-gold">Awaits.</span>
                </h2>
                <p className="text-subtitle mx-auto mb-4" style={{ maxWidth: 480 }}>
                  From chat to check-in. Experience the new standard of luxury travel.
                </p>
                <button
                  className="btn-pill btn-pill-gold"
                  style={{ fontSize: '1.05rem', padding: '1.1rem 3rem' }}
                  onClick={() => setIsBookingOpen(true)}
                >
                  Book Your Curated Escape
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* === Footer === */}
      <footer className="tv-footer">
        <div className="container">
          <div className="row">
            <div className="col-md-4 mb-4 mb-md-0">
              <div className="tv-footer-brand">
                Travel<span>View</span>
              </div>
              <p className="tv-footer-text">
                An elite AI-powered travel concierge. From dream to destination in a single conversation.
              </p>
            </div>
            <div className="col-md-2 offset-md-2 mb-4 mb-md-0">
              <h6 className="text-gold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Explore</h6>
              <ul className="list-unstyled" style={{ fontSize: '0.85rem' }}>
                <li className="mb-2"><a href="#" style={{ color: 'var(--tv-muted)', textDecoration: 'none' }}>Destinations</a></li>
                <li className="mb-2"><a href="#" style={{ color: 'var(--tv-muted)', textDecoration: 'none' }}>How It Works</a></li>
                <li className="mb-2"><a href="#" style={{ color: 'var(--tv-muted)', textDecoration: 'none' }}>Pricing</a></li>
              </ul>
            </div>
            <div className="col-md-2 mb-4 mb-md-0">
              <h6 className="text-gold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Company</h6>
              <ul className="list-unstyled" style={{ fontSize: '0.85rem' }}>
                <li className="mb-2"><a href="#" style={{ color: 'var(--tv-muted)', textDecoration: 'none' }}>About</a></li>
                <li className="mb-2"><a href="#" style={{ color: 'var(--tv-muted)', textDecoration: 'none' }}>Careers</a></li>
                <li className="mb-2"><a href="#" style={{ color: 'var(--tv-muted)', textDecoration: 'none' }}>Contact</a></li>
              </ul>
            </div>
            <div className="col-md-2">
              <h6 className="text-gold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Legal</h6>
              <ul className="list-unstyled" style={{ fontSize: '0.85rem' }}>
                <li className="mb-2"><a href="#" style={{ color: 'var(--tv-muted)', textDecoration: 'none' }}>Privacy</a></li>
                <li className="mb-2"><a href="#" style={{ color: 'var(--tv-muted)', textDecoration: 'none' }}>Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="tv-footer-bottom">
            <span>© 2026 TravelView. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* === Map Button + Overlay === */}
      <MapOverlay />

      {/* === AI Chatbot === */}
      <Chatbot />

      {/* === Booking Modal === */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSubmit={(data) => {
          setIsBookingOpen(false);
          onBookEscape(data);
        }}
      />
    </>
  );
};

export default TravelPage;
