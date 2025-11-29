import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomGestureRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/gestures/customize/requests');
      setRequests(response.data.requests);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch requests');
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this request? This will start the training pipeline.')) {
      return;
    }

    try {
      await axios.post(`/api/gestures/customize/requests/${requestId}/approve`);
      alert('Request approved successfully! Training pipeline started.');
      fetchRequests(); // Refresh the list
    } catch (err) {
      alert('Failed to approve request: ' + err.response?.data?.message || err.message);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await axios.post(`/api/gestures/customize/requests/${requestId}/reject`, { reason });
      alert('Request rejected successfully.');
      fetchRequests(); // Refresh the list
    } catch (err) {
      alert('Failed to reject request: ' + err.response?.data?.message || err.message);
    }
  };

  if (loading) return <div className="p-4">Loading requests...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Custom Gesture Requests</h2>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Pending Requests</h3>
        </div>

        <div className="p-4">
          {requests.length === 0 ? (
            <p className="text-gray-500">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold">{request.adminId?.name || 'Unknown Admin'}</h4>
                      <p className="text-sm text-gray-600">{request.adminId?.email}</p>
                      <p className="text-sm text-gray-500">
                        Requested: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  {request.gestures && request.gestures.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium mb-2">Requested Gestures:</h5>
                      <div className="flex flex-wrap gap-2">
                        {request.gestures.map((gesture, index) => (
                          <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {gesture}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request._id)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Approve & Train
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {request.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <h5 className="font-medium text-red-800 mb-1">Rejection Reason:</h5>
                      <p className="text-red-700">{request.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomGestureRequests;