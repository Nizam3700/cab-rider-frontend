import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DriverDashboard() {
  const [location, setLocation] = useState({ x: '', y: '' });
  const [isAvailable, setIsAvailable] = useState(true);
  const [message, setMessage] = useState('');
  const [rides, setRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDriverData();
    const interval = setInterval(() => {
      fetchActiveRide();
      fetchRideHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to format distance safely
  const formatDistance = (distance) => {
    if (!distance && distance !== 0) return 'N/A';
    const num = parseFloat(distance);
    return isNaN(num) ? 'N/A' : num.toFixed(2);
  };

  const fetchDriverData = async () => {
    try {
      const profileRes = await axios.get('https://cab-ride-five.vercel.app/api/drivers/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLocation({ 
        x: profileRes.data.current_x, 
        y: profileRes.data.current_y 
      });
      setIsAvailable(profileRes.data.is_available === 1);
      
      await fetchRideHistory();
      await fetchActiveRide();
      setFetching(false);
    } catch (err) {
      console.error('Failed to fetch driver data:', err);
      if (err.response?.status === 403) {
        setMessage('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      }
      setFetching(false);
    }
  };

  const fetchActiveRide = async () => {
    try {
      const response = await axios.get('https://cab-ride-five.vercel.app/api/rides/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveRide(response.data.active_ride);
    } catch (err) {
      console.error('Failed to fetch active ride:', err);
    }
  };

  const fetchRideHistory = async () => {
    try {
      const response = await axios.get('https://cab-ride-five.vercel.app/api/rides/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRides(response.data);
    } catch (err) {
      console.error('Failed to fetch rides:', err);
    }
  };

  const updateLocation = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('https://cab-ride-five.vercel.app/api/drivers/location',
        { x: parseFloat(location.x), y: parseFloat(location.y) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Location updated');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update location');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async () => {
    try {
      await axios.put('https://cab-ride-five.vercel.app/api/drivers/availability',
        { is_available: !isAvailable },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsAvailable(!isAvailable);
      setMessage(`You are now ${!isAvailable ? 'available' : 'unavailable'}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update availability');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const completeRide = async (rideId) => {
    const dropX = prompt('Enter dropoff X:');
    const dropY = prompt('Enter dropoff Y:');
    
    if (!dropX || !dropY) return;
    
    try {
      await axios.post(`https://cab-ride-five.vercel.app/api/rides/${rideId}/complete`,
        { drop_x: parseFloat(dropX), drop_y: parseFloat(dropY) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Ride completed');
      await fetchDriverData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to complete ride');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'assigned': 'bg-blue-500',
      'completed': 'bg-green-500'
    };
    const color = colors[status] || 'bg-gray-500';
    return (
      <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Driver Dashboard</h1>

          {activeRide && (
            <div className="bg-green-100 border-l-4 border-green-500 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-green-800 mb-3">Current Ride</h2>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">User:</span> {activeRide.user_name}</p>
                <p><span className="font-semibold">Pickup:</span> ({activeRide.pickup_x}, {activeRide.pickup_y})</p>
                <p><span className="font-semibold">Fare:</span> ₹{activeRide.fare}</p>
                <p><span className="font-semibold">Distance:</span> {formatDistance(activeRide.distance)} units</p>
                <button
                  onClick={() => completeRide(activeRide.id)}
                  className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Complete Ride
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Location & Status</h2>
            <form onSubmit={updateLocation}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Current X</label>
                  <input
                    type="number"
                    step="any"
                    value={location.x}
                    onChange={(e) => setLocation({ ...location, x: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Current Y</label>
                  <input
                    type="number"
                    step="any"
                    value={location.y}
                    onChange={(e) => setLocation({ ...location, y: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition mb-3"
              >
                {loading ? 'Updating...' : 'Update Location'}
              </button>
            </form>
            
            <button
              onClick={updateAvailability}
              className={`w-full py-2 rounded-lg text-white font-semibold transition ${isAvailable ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isAvailable ? 'Go Offline' : 'Go Online'}
            </button>
            
            {message && (
              <div className="mt-3 p-2 bg-blue-100 text-blue-700 rounded text-center">
                {message}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ride History</h2>
            {fetching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : rides.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No rides yet</p>
            ) : (
              <div className="space-y-4">
                {rides.map(ride => (
                  <div key={ride.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-lg">Ride #{ride.id}</span>
                      {getStatusBadge(ride.status)}
                    </div>
                    <div className="space-y-1 text-gray-700">
                      <p><span className="font-semibold">User:</span> {ride.user_name}</p>
                      <p><span className="font-semibold">Pickup:</span> ({ride.pickup_x}, {ride.pickup_y})</p>
                      {ride.fare && <p><span className="font-semibold">Fare:</span> ₹{ride.fare}</p>}
                      <p className="text-xs text-gray-400 mt-2">{new Date(ride.requested_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;