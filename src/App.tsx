import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthScreen from './components/auth/AuthScreen';
import Dashboard from './components/layout/Dashboard';
import CalendarScreen from './components/calendar/CalendarScreen';
import ClientsScreen from './components/screens/ClientsScreen';
import FinancesScreen from './components/screens/FinancesScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/calendar" element={<CalendarScreen />} />
            <Route path="/dashboard/clients" element={<ClientsScreen />} />
            <Route path="/dashboard/finances" element={<FinancesScreen />} />
            <Route path="/dashboard/settings" element={<SettingsScreen />} />
            <Route path="/" element={<Navigate to="/auth" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
