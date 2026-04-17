import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DriverDashboard() {
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [isAvailable, setIsAvailable] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [rides, setRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDriverData();
    const interval = setInterval(() => {
    //   fetchActiveRide();
      fetchRideHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDriverData = async () => {
    try {
      const [profileRes, ridesRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/drivers/profile', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/rides/history', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/drivers/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setLocation({ 
        lat: profileRes.data.current_lat, 
        lng: profileRes.data.current_lng 
      });
      setIsAvailable(profileRes.data.is_available === 1);
      setRides(ridesRes.data);
      setStats(statsRes.data);
      setFetching(false);
      
      const active = ridesRes.data.find(r => ['assigned', 'in_progress'].includes(r.status));
      setActiveRide(active);
    } catch (err) {
      console.error('Failed to fetch driver data:', err);
      setFetching(false);
    }
  };

  const fetchActiveRide = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rides/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.active_ride) {
        setActiveRide(response.data.active_ride);
      }
    } catch (err) {
      console.error('Failed to fetch active ride:', err);
    }
  };

  const fetchRideHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rides/history', {
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
      await axios.post('http://localhost:5000/api/drivers/location',
        { lat: parseFloat(location.lat), lng: parseFloat(location.lng) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Location updated successfully!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update location');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (available) => {
    try {
      await axios.put('http://localhost:5000/api/drivers/availability',
        { is_available: available },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsAvailable(available);
      setMessage(`You are now ${available ? 'available' : 'unavailable'} for rides`);
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update availability');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const startRide = async (rideId) => {
    try {
      await axios.post(`http://localhost:5000/api/rides/${rideId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Ride started!');
      setMessageType('success');
      await fetchDriverData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to start ride');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const completeRide = async (rideId) => {
    const dropLat = prompt('Enter dropoff latitude (X):');
    const dropLng = prompt('Enter dropoff longitude (Y):');
    
    if (!dropLat || !dropLng) return;
    
    try {
      await axios.post(`http://localhost:5000/api/rides/${rideId}/complete`,
        { drop_lat: parseFloat(dropLat), drop_lng: parseFloat(dropLng) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Ride completed successfully!');
      setMessageType('success');
      await fetchDriverData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to complete ride');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-500',
      'assigned': 'bg-blue-500',
      'in_progress': 'bg-indigo-500',
      'completed': 'bg-green-500',
      'cancelled': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': '⏳ Pending',
      'assigned': '✅ Assigned',
      'in_progress': '🚗 In Progress',
      'completed': '🏁 Completed',
      'cancelled': '❌ Cancelled'
    };
    return texts[status] || status;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">🚗 Driver Dashboard</h1>
        
        {stats && (
          <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">{stats.total_rides}</div>
                <div className="text-sm">Total Rides</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">{stats.completed_rides}</div>
                <div className="text-sm">Completed</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">₹{stats.total_earnings}</div>
                <div className="text-sm">Earnings</div>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">⭐ {stats.average_rating.toFixed(1)}</div>
                <div className="text-sm">Rating</div>
              </div>
            </div>
          </div>
        )}
        
        {activeRide && (
          <div className="bg-white rounded-xl shadow-xl p-6 mb-8 border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🔄 Current Ride</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-lg">Ride #{activeRide.id}</span>
                <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(activeRide.status)}`}>
                  {getStatusText(activeRide.status)}
                </span>
              </div>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">👤 User:</span> {activeRide.user_name}</p>
                <p><span className="font-semibold">📍 Pickup:</span> ({activeRide.pickup_lat}, {activeRide.pickup_lng})</p>
                <p><span className="font-semibold">💰 Fare:</span> ₹{activeRide.fare}</p>
                <p><span className="font-semibold">📏 Distance:</span> {activeRide.distance?.toFixed(2)} units</p>
              </div>
              <div className="mt-4 flex gap-3">
                {activeRide.status === 'assigned' && (
                  <button
                    onClick={() => startRide(activeRide.id)}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                  >
                    Start Ride
                  </button>
                )}
                {activeRide.status === 'in_progress' && (
                  <button
                    onClick={() => completeRide(activeRide.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                  >
                    Complete Ride
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📍 Location & Availability</h2>
            <form onSubmit={updateLocation}>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Current Latitude (X)</label>
                  <input
                    type="number"
                    step="any"
                    value={location.lat}
                    onChange={(e) => setLocation({ ...location, lat: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Current Longitude (Y)</label>
                  <input
                    type="number"
                    step="any"
                    value={location.lng}
                    onChange={(e) => setLocation({ ...location, lng: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all mb-4"
              >
                {loading ? 'Updating...' : 'Update Location'}
              </button>
            </form>
            
            <div className="text-center">
              <p className="text-gray-700 mb-3">
                Status: 
                <span className={`font-semibold ml-2 ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </p>
              <button
                onClick={() => updateAvailability(!isAvailable)}
                className={`w-full font-semibold py-2 px-4 rounded-lg transition-all ${isAvailable ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
              >
                {isAvailable ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-white text-sm ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}>
                  {isAvailable ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold">Current Location:</span>
                <span>({location.lat || 0}, {location.lng || 0})</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold">Active Rides:</span>
                <span>{activeRide ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📜 Ride History</h2>
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
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(ride.status)}`}>
                      {getStatusText(ride.status)}
                    </span>
                  </div>
                  <div className="space-y-1 text-gray-700">
                    <p><span className="font-semibold">👤 User:</span> {ride.user_name}</p>
                    <p><span className="font-semibold">📍 Pickup:</span> ({ride.pickup_lat}, {ride.pickup_lng})</p>
                    {ride.fare && <p><span className="font-semibold">💰 Fare:</span> ₹{ride.fare}</p>}
                    <p><span className="font-semibold">📅 Requested:</span> {new Date(ride.requested_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {message && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${messageType === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white animate-bounce`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverDashboard;