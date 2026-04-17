import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserDashboard() {
  const [pickupX, setPickupX] = useState('');
  const [pickupY, setPickupY] = useState('');
  const [message, setMessage] = useState('');
  const [rides, setRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRideHistory();
    fetchActiveRide();
    const interval = setInterval(fetchActiveRide, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRideHistory = async () => {
    try {
      const response = await axios.get('https://cab-ride-five.vercel.app/api/rides/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRides(response.data);
      setFetching(false);
    } catch (err) {
      console.error('Failed to fetch rides:', err);
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

  const requestRide = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('https://cab-ride-five.vercel.app/api/rides/request',
        { pickup_x: parseFloat(pickupX), pickup_y: parseFloat(pickupY) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage(response.data.message);
      setPickupX('');
      setPickupY('');
      fetchRideHistory();
      fetchActiveRide();
      
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to request ride');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'assigned': 'bg-blue-500',
      'completed': 'bg-green-500'
    };
    const color = colors[status] || 'bg-gray-500';
    const text = status === 'assigned' ? 'Assigned' : status === 'completed' ? 'Completed' : status;
    return (
      <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${color}`}>
        {text}
      </span>
    );
  };

  // Helper function to format distance safely
  const formatDistance = (distance) => {
    if (!distance && distance !== 0) return 'N/A';
    const num = parseFloat(distance);
    return isNaN(num) ? 'N/A' : num.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Request a Ride</h1>
          
          {activeRide && (
            <div className="bg-green-100 border-l-4 border-green-500 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-green-800 mb-3">Active Ride</h2>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">Driver:</span> {activeRide.driver_name}</p>
                <p><span className="font-semibold">Vehicle:</span> {activeRide.vehicle_number}</p>
                <p><span className="font-semibold">Pickup:</span> ({activeRide.pickup_x}, {activeRide.pickup_y})</p>
                <p><span className="font-semibold">Fare:</span> ₹{activeRide.fare}</p>
                <p><span className="font-semibold">Distance:</span> {formatDistance(activeRide.distance)} units</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Where to?</h2>
            <form onSubmit={requestRide}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Pickup X</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter X coordinate"
                    value={pickupX}
                    onChange={(e) => setPickupX(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Pickup Y</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter Y coordinate"
                    value={pickupY}
                    onChange={(e) => setPickupY(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || activeRide}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Requesting...' : 'Request Ride'}
              </button>
            </form>
            {message && (
              <div className={`mt-4 p-3 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
              <p className="text-gray-500 text-center py-8">No rides yet. Request your first ride!</p>
            ) : (
              <div className="space-y-4">
                {rides.map(ride => (
                  <div key={ride.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-lg">Ride #{ride.id}</span>
                      {getStatusBadge(ride.status)}
                    </div>
                    <div className="space-y-1 text-gray-700">
                      <p><span className="font-semibold">Pickup:</span> ({ride.pickup_x}, {ride.pickup_y})</p>
                      {ride.driver_name && <p><span className="font-semibold">Driver:</span> {ride.driver_name}</p>}
                      {ride.vehicle_number && <p><span className="font-semibold">Vehicle:</span> {ride.vehicle_number}</p>}
                      {ride.fare && <p><span className="font-semibold">Fare:</span> ₹{ride.fare}</p>}
                      {ride.distance && <p><span className="font-semibold">Distance:</span> {formatDistance(ride.distance)} units</p>}
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

export default UserDashboard;