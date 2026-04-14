import React from 'react';
import { motion } from 'framer-motion';

interface LoaderProps {
  progress: number; // 0 to 100
  isVisible: boolean;
}

const Loader: React.FC<LoaderProps> = ({ progress, isVisible }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="loader-fullscreen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="loader-percent">{Math.round(progress)}%</div>
      <div className="loader-bar-track">
        <div
          className="loader-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="loader-text">Loading your destination…</div>
    </motion.div>
  );
};

export default Loader;
