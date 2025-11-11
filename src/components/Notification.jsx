// src/components/Notification.jsx

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const icons = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const colorSchemes = {
  success: { bg: 'bg-green-500', text: 'text-white', progress: 'bg-green-200' },
  error: { bg: 'bg-red-500', text: 'text-white', progress: 'bg-red-200' },
  warning: { bg: 'bg-yellow-500', text: 'text-white', progress: 'bg-yellow-200' },
};

const Notification = ({ message, type, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    const interval = setInterval(() => {
        setProgress(prev => Math.max(prev - (100 / 250), 0));
    }, 20);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onClose]);

  const scheme = colorSchemes[type] || colorSchemes.warning;

  return (
    <div className="fixed top-5 left-0 w-full flex justify-center z-[100]">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          // "relative" sınıfını ekleyerek ilerleme çubuğunun bu dive göre konumlanmasını sağlıyoruz.
          className={`relative w-full max-w-sm p-4 rounded-lg shadow-2xl ${scheme.bg} ${scheme.text} overflow-hidden`}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">{icons[type]}</div>
            <p className="flex-grow font-medium">{message}</p>
            <button onClick={onClose} className="ml-4 flex-shrink-0 opacity-70 hover:opacity-100">&times;</button>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
            <motion.div 
                className={`h-full ${scheme.progress}`}
                style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
    </div>
  );
};

export default Notification;
