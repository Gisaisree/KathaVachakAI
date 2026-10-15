import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from './tokenStorage';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  if (!getToken()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: 'Please log in to continue.', from: location }}
      />
    );
  }
  return children;
};

export default ProtectedRoute;
