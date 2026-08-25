import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ActiveBatch from './pages/ActiveBatch';
import AddBatch from './pages/AddBatch';
import DailyLog from './pages/DailyLog';
import WeightTracking from './pages/WeightTracking';
import FeedManagement from './pages/FeedManagement';
import Mortality from './pages/Mortality';
import Environment from './pages/Environment';
import Supervisor from './pages/Supervisor';
import Settlement from './pages/Settlement';
import BatchComparison from './pages/BatchComparison';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Supplements from './pages/Supplements';
import Expenses from './pages/Expenses';
import SyncQueue from './pages/SyncQueue';
import ProtectedRoute from './components/ProtectedRoute';

// Wraps a page in both ProtectedRoute and DashboardLayout
function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard"   element={<ProtectedPage><Dashboard /></ProtectedPage>} />
        <Route path="/batches"     element={<ProtectedPage><ActiveBatch /></ProtectedPage>} />
        <Route path="/add-batch"   element={<ProtectedPage><AddBatch /></ProtectedPage>} />
        <Route path="/logs"        element={<ProtectedPage><DailyLog /></ProtectedPage>} />
        <Route path="/feed"        element={<ProtectedPage><FeedManagement /></ProtectedPage>} />
        <Route path="/weight"      element={<ProtectedPage><WeightTracking /></ProtectedPage>} />
        <Route path="/water"       element={<ProtectedPage><DailyLog /></ProtectedPage>} />
        <Route path="/mortality"   element={<ProtectedPage><Mortality /></ProtectedPage>} />
        <Route path="/supplements" element={<ProtectedPage><Supplements /></ProtectedPage>} />
        <Route path="/expenses"    element={<ProtectedPage><Expenses /></ProtectedPage>} />
        <Route path="/environment" element={<ProtectedPage><Environment /></ProtectedPage>} />
        <Route path="/supervisor"  element={<ProtectedPage><Supervisor /></ProtectedPage>} />
        <Route path="/reports"     element={<ProtectedPage><Reports /></ProtectedPage>} />
        <Route path="/comparison"  element={<ProtectedPage><BatchComparison /></ProtectedPage>} />
        <Route path="/settlement"  element={<ProtectedPage><Settlement /></ProtectedPage>} />
        <Route path="/settings"    element={<ProtectedPage><Settings /></ProtectedPage>} />
        <Route path="/sync-queue"  element={<ProtectedPage><SyncQueue /></ProtectedPage>} />

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
