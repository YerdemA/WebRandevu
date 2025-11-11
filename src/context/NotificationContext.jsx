// src/context/NotificationContext.jsx

import React, { createContext, useContext, useState } from 'react';
import Notification from '../components/Notification';
import { AnimatePresence } from 'framer-motion';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null); // { message, type }

  const showNotification = (message, type = 'warning') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      <AnimatePresence>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={closeNotification}
          />
        )}
      </AnimatePresence>
      {children}
    </NotificationContext.Provider>
  );
};
