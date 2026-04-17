import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserDashboard() {
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [rides, setRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [reassigning, setReassigning] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRideHistory();
    // fetchActiveRide();
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(() => {
    //   fetchActiveRide();
    //   fetchRideHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRideHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rides/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Show all rides including pending ones
      // Pending rides will be shown but with a special indicator
      setRides(response.data);
      setFetching(false);
    } catch (err) {
      console.error('Failed to fetch rides:', err);
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
      } else {
        setActiveRide(null);
      }
    } catch (err) {
      console.error('Failed to fetch active ride:', err);
    }
  };

  const requestRide = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await axios.post('http://localhost:5000/api/rides/request',
        { 
          pickup_lat: parseFloat(pickupLat), 
          pickup_lng: parseFloat(pickupLng) 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage(response.data.message);
      setMessageType('success');
      setPickupLat('');
      setPickupLng('');
      
      // Refresh data after successful ride request
      await fetchActiveRide();
      await fetchRideHistory();
      
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to request ride');
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;
    
    try {
      await axios.post(`http://localhost:5000/api/rides/${rideId}/cancel`,
        { reason: 'Cancelled by user' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Ride cancelled successfully');
      setMessageType('success');
      await fetchActiveRide();
      await fetchRideHistory();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to cancel ride');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const retryAssignment = async () => {
  setReassigning(true);
  try {
    const response = await axios.post(`http://localhost:5000/api/rides/retry-assignment`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    
    if (response.data.success) {
      setMessage(`Driver assigned successfully! ${response.data.message}`);
      setMessageType('success');
      await fetchActiveRide();
      await fetchRideHistory();
    } else {
      setMessage(response.data.error || 'Still looking for drivers. Please wait...');
      setMessageType('info');
    }
  } catch (err) {
    setMessage(err.response?.data?.error || 'Failed to find driver');
    setMessageType('error');
  } finally {
    setReassigning(false);
    setTimeout(() => setMessage(''), 5000);
  }
};
console.log("pending",message);
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
      'pending': '⏳ Pending (Looking for driver...)',
      'assigned': '✅ Driver Assigned',
      'in_progress': '🚗 In Progress',
      'completed': '🏁 Completed',
      'cancelled': '❌ Cancelled'
    };
    return texts[status] || status;
  };

  // Calculate waiting time for pending rides
  const getWaitingTime = (requestedAt) => {
    const requested = new Date(requestedAt);
    const now = new Date();
    const minutes = Math.floor((now - requested) / (1000 * 60));
    const seconds = Math.floor((now - requested) / 1000) % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">👤 User Dashboard</h1>
        
        {activeRide && activeRide.status !== 'completed' && activeRide.status !== 'cancelled' && (
          <div className="bg-white rounded-xl shadow-xl p-6 mb-8 border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🔄 Active Ride</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-lg">Ride #{activeRide.id}</span>
                <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(activeRide.status)}`}>
                  {getStatusText(activeRide.status)}
                </span>
              </div>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">📍 Pickup:</span> ({activeRide.pickup_lat}, {activeRide.pickup_lng})</p>
                {activeRide.status === 'pending' && (
                  <>
                    <p><span className="font-semibold">⏱️ Waiting time:</span> {getWaitingTime(activeRide.requested_at)}</p>
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">⚠️ Looking for available drivers in your area...</p>
                      <button
                        onClick={() => retryAssignment(activeRide.id, activeRide.pickup_lat, activeRide.pickup_lng)}
                        disabled={reassigning}
                        className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-lg text-sm transition-all"
                      >
                        {reassigning ? 'Searching...' : 'Try Again'}
                      </button>
                    </div>
                  </>
                )}
                {activeRide.driver_name && (
                  <>
                    <p><span className="font-semibold">👨‍✈️ Driver:</span> {activeRide.driver_name}</p>
                    <p><span className="font-semibold">🚕 Vehicle:</span> {activeRide.vehicle_number}</p>
                    <p><span className="font-semibold">📞 Driver Phone:</span> {activeRide.driver_phone}</p>
                    <p><span className="font-semibold">💰 Fare:</span> ₹{activeRide.fare}</p>
                    <p><span className="font-semibold">📏 Distance:</span> {activeRide.distance?.toFixed(2)} units</p>
                    {activeRide.estimated_time && (
                      <p><span className="font-semibold">⏱️ Est. Time:</span> {activeRide.estimated_time} minutes</p>
                    )}
                  </>
                )}
                {(activeRide.status === 'pending' || activeRide.status === 'assigned') && (
                  <button
                    onClick={() => cancelRide(activeRide.id)}
                    className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                  >
                    Cancel Ride
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🚖 Request New Ride</h2>
          <form onSubmit={requestRide}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Pickup Latitude (X)</label>
                <input
                  type="number"
                  step="any"
                  value={pickupLat}
                  onChange={(e) => setPickupLat(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                  placeholder="Enter X coordinate"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Pickup Longitude (Y)</label>
                <input
                  type="number"
                  step="any"
                  value={pickupLng}
                  onChange={(e) => setPickupLng(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                  placeholder="Enter Y coordinate"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || (activeRide && activeRide.status !== 'completed' && activeRide.status !== 'cancelled')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Requesting...
                </div>
              ) : (
                'Request Ride'
              )}
            </button>
          </form>
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              messageType === 'success' ? 'bg-green-100 text-green-700 border border-green-400' : 
              messageType === 'info' ? 'bg-blue-100 text-blue-700 border border-blue-400' :
              'bg-red-100 text-red-700 border border-red-400'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📜 Your Ride History</h2>
          {fetching ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : rides.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No rides yet. Request your first ride!</p>
          ) : (
            <div className="space-y-4">
              {rides.map(ride => (
                <div key={ride.id} className={`bg-gray-50 rounded-lg p-4 border-l-4 ${
                  ride.status === 'pending' ? 'border-yellow-500' : 'border-purple-500'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-lg">Ride #{ride.id}</span>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(ride.status)}`}>
                      {getStatusText(ride.status)}
                    </span>
                  </div>
                  <div className="space-y-1 text-gray-700">
                    <p><span className="font-semibold">📍 Pickup:</span> ({ride.pickup_lat}, {ride.pickup_lng})</p>
                    {ride.drop_lat && <p><span className="font-semibold">🏁 Dropoff:</span> ({ride.drop_lat}, {ride.drop_lng})</p>}
                    {ride.driver_name && <p><span className="font-semibold">👨‍✈️ Driver:</span> {ride.driver_name}</p>}
                    {ride.vehicle_number && <p><span className="font-semibold">🚕 Vehicle:</span> {ride.vehicle_number}</p>}
                    {ride.distance && <p><span className="font-semibold">📏 Distance:</span> {ride.distance.toFixed(2)} units</p>}
                    {ride.fare && <p><span className="font-semibold">💰 Fare:</span> ₹{ride.fare}</p>}
                    <p><span className="font-semibold">📅 Requested:</span> {new Date(ride.requested_at).toLocaleString()}</p>
                    {ride.status === 'pending' && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded">
                        <p className="text-sm text-yellow-700">⏳ Waiting for driver assignment...</p>
                        <p className="text-xs text-yellow-600">Waiting time: {getWaitingTime(ride.requested_at)}</p>
                        <button
                          onClick={() => retryAssignment(ride.id, ride.pickup_lat, ride.pickup_lng)}
                          disabled={reassigning}
                          className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-lg text-sm transition-all"
                        >
                          {reassigning ? 'Searching...' : 'Check for Drivers Again'}
                        </button>
                      </div>
                    )}
                    {ride.assigned_at && <p><span className="font-semibold">✅ Assigned:</span> {new Date(ride.assigned_at).toLocaleString()}</p>}
                    {ride.started_at && <p><span className="font-semibold">🚗 Started:</span> {new Date(ride.started_at).toLocaleString()}</p>}
                    {ride.completed_at && <p><span className="font-semibold">🏁 Completed:</span> {new Date(ride.completed_at).toLocaleString()}</p>}
                    {ride.cancelled_at && <p><span className="font-semibold">❌ Cancelled:</span> {new Date(ride.cancelled_at).toLocaleString()}</p>}
                  </div>
                  {(ride.status === 'pending' || ride.status === 'assigned') && (
                    <button
                      onClick={() => cancelRide(ride.id)}
                      className="mt-3 bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg text-sm transition-all"
                    >
                      Cancel Ride
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;