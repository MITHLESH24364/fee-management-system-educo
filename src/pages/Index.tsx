
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import Students from './Students';
import FeeCollection from './FeeCollection';
import Reports from './Reports';
import PrintReceipt from './PrintReceipt';
import NotFound from './NotFound';
import Auth from './Auth';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';

const Index = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/fee-collection" element={<FeeCollection />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/print-receipt" element={<PrintReceipt />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
        
        {/* Redirect any unmatched routes to /auth */}
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </AuthProvider>
  );
};

export default Index;
