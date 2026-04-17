import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import UserDashboard from './components/UserDashboard';
import DriverDashboard from './components/DriverDashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, [token]);

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500">
        {token && user && (
          <nav className="bg-white shadow-lg">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🚕</span>
                <span className="text-xl font-bold text-purple-600">Cab System</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  {user.role === 'driver' ? '🚗' : '👤'} {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>
        )}
        
        <Routes>
          <Route path="/login" element={
            !token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />
          } />
          <Route path="/register" element={
            !token ? <Register /> : <Navigate to="/" />
          } />
          <Route path="/" element={
            token && user ? (
              user.role === 'user' ? 
                <UserDashboard /> : 
                <DriverDashboard />
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;