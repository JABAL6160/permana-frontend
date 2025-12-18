// src/main.jsx - Complete RBAC Routes
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ProtectedRoute from './ProtectedRoute';
import Login from './Login';
import Register from './Register';
import Map from './Map';
import Data from './Data';
import Cuaca from './Cuaca';
import AdminDashboard from './admin/AdminDashboard';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Map - Guest, Staff, Admin bisa akses */}
        <Route 
          path="/map" 
          element={
            <ProtectedRoute routePath="/map">
              <Map />
            </ProtectedRoute>
          } 
        />
        
        {/* Data Tiang - Hanya Staff & Admin */}
        <Route 
          path="/data" 
          element={
            <ProtectedRoute routePath="/data">
              <Data />
            </ProtectedRoute>
          } 
        />
        
        {/* Cuaca - Guest, Staff, Admin bisa akses */}
        <Route 
          path="/cuaca" 
          element={
            <ProtectedRoute routePath="/cuaca">
              <Cuaca />
            </ProtectedRoute>
          } 
        />

        {/* Admin Dashboard - Hanya Admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute routePath="/admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);