import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';


interface RequestsPanelProps {
  requests: any[];
  onRequestUpdate: () => void;
  hotelId: string;
}

export const RequestsPanel: React.FC<RequestsPanelProps> = ({ 
  requests, 
  onRequestUpdate, 
  hotelId 
}) => {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { theme } = useTheme();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      await apiClient.updateRequest(hotelId, requestId, { status: newStatus });
      onRequestUpdate();
      toast.success('Request status updated');
      setSelectedRequest(null);
    } catch (error) {
      toast.error('Failed to update request status');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatRequestType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const inProgressRequests = requests.filter(r => r.status === 'in-progress');
  const completedRequests = requests.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{pendingRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{inProgressRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{completedRequests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Recent Requests</h3>
        </div>
        
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((request) => (
              <div
                key={request._id}
                className="p-3 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {getStatusIcon(request.status)}
                      <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                        Room {request.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(request.createdAt), 'MMM d, HH:mm')}
                  </div>
                </div>
                
                <div className="mt-2 sm:mt-2">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {formatRequestType(request.type)}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1">
                    📞 {request.guestPhone}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    {request.message}
                  </p>
                  {request.orderDetails && request.orderDetails.items && request.orderDetails.items.length > 0 && (
                    <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900 rounded-lg overflow-hidden">
                      <p className="text-xs sm:text-sm font-medium text-orange-800 dark:text-orange-200">Food Order:</p>
                      {request.orderDetails.items.map((item, index) => (
                        <p key={index} className="text-xs text-orange-700 dark:text-orange-300 truncate">
                          {item.name} x{item.quantity} = ₹{item.total}
                        </p>
                      ))}
                      <p className="text-xs sm:text-sm font-bold text-orange-800 dark:text-orange-200 mt-1">
                        Total: ₹{request.orderDetails.totalAmount}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                Request Details
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Room</p>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Room {selectedRequest.roomNumber}</p>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Type</p>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{formatRequestType(selectedRequest.type)}</p>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Message</p>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white break-words">{selectedRequest.message}</p>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Guest Phone</p>
                <p className="text-sm sm:text-base font-medium text-blue-600 dark:text-blue-400">📞 {selectedRequest.guestPhone}</p>
              </div>
              
              {selectedRequest.orderDetails && selectedRequest.orderDetails.items && selectedRequest.orderDetails.items.length > 0 && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Order Details</p>
                  <div className="bg-orange-50 dark:bg-orange-900 p-3 rounded-lg mt-1">
                    {selectedRequest.orderDetails.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs sm:text-sm text-orange-800 dark:text-orange-200">
                        <span className="truncate mr-2 text-orange-800 dark:text-orange-200">{item.name} x{item.quantity}</span>
                        <span className="text-orange-800 dark:text-orange-200">₹{item.total}</span>
                      </div>
                    ))}
                    <div className="border-t border-orange-200 dark:border-orange-700 mt-2 pt-2 flex justify-between text-xs sm:text-sm font-bold text-orange-800 dark:text-orange-200">
                      <span className="text-orange-800 dark:text-orange-200">Total Amount</span>
                      <span className="text-orange-800 dark:text-orange-200">₹{selectedRequest.orderDetails.totalAmount}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                  {selectedRequest.priority}
                </span>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{format(new Date(selectedRequest.createdAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
            </div>

            {selectedRequest.status !== 'completed' && selectedRequest.status !== 'canceled' && (
              <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => handleStatusUpdate(selectedRequest._id, 'in-progress')}
                  disabled={isUpdating || selectedRequest.status === 'in-progress'}
                  className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Start Progress'}
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedRequest._id, 'completed')}
                  disabled={isUpdating}
                  className="flex-1 bg-green-600 dark:bg-green-700 text-white py-2 px-4 rounded-lg text-sm sm:text-base font-medium hover:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Complete'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};