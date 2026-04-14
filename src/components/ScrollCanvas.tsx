import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useScroll, useTransform, useSpring, motion, useMotionValueEvent } from 'framer-motion';

const TOTAL_FRAMES = 192;

function getFramePath(index: number): string {
  const padded = String(index).padStart(3, '0');
  return `/frames/frame_${padded}.jpg`;
}

interface ScrollCanvasProps {
  images: HTMLImageElement[];
}

const ScrollCanvas: React.FC<ScrollCanvasProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Track scroll progress over the 500vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth the scroll with a spring for a luxury flight feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Map progress [0,1] to frame index [0, TOTAL_FRAMES - 1]
  const frameIndex = useTransform(smoothProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

  // Handle canvas resize
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

  // Draw image on canvas (cover fit)
  const drawFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = images[Math.round(index)];
      if (!img || !img.complete) return;

      const { width: cw, height: ch } = canvas;

      // Clear
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, cw, ch);

      // "cover" fit calculation
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

  // Update canvas on every frame change
  useMotionValueEvent(frameIndex, 'change', (latest) => {
    drawFrame(latest);
  });

  // Draw initial frame
  useEffect(() => {
    if (images.length > 0 && canvasSize.width > 0) {
      drawFrame(0);
    }
  }, [images, canvasSize, drawFrame]);

  return (
    <div ref={containerRef} className="scroll-canvas-wrapper">
      <div className="scroll-canvas-sticky">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
        />
        {/* Content overlays are rendered as children via TravelPage */}
      </div>
    </div>
  );
};

export { ScrollCanvas, TOTAL_FRAMES, getFramePath };
export type { ScrollCanvasProps };
