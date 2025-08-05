import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Loader, Star, User, Calendar, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';
import { ThemeToggle } from '../ui/ThemeToggle';

interface Review {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

const GoogleCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setLoading(true);
      
      // Get authorization code and state from URL params
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      
      // State contains the hotelId
      if (state) {
        setHotelId(state);
      }

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      console.log('Processing OAuth callback:', { code: !!code, state });

      // Send callback data to backend
      const callbackResponse = await apiClient.request('/google-auth/callback', {
        method: 'POST',
        body: JSON.stringify({
          code,
          state
        })
      }) as { success: boolean; account: any };

      console.log('Callback response:', callbackResponse);

      // Update auth status in context
      if (state) {
        await checkAuthStatus(state);
      }

      // Fetch Google reviews
      try {
        const reviewsResponse = await apiClient.request(`/google-reviews/${state}`, {
          method: 'GET'
        }) as { reviews: Review[] };
        setReviews(reviewsResponse.reviews || []);
      } catch (reviewsError) {
        console.warn('Failed to fetch reviews:', reviewsError);
        setReviews([]);
      }

      toast.success('Google account connected successfully!');
      
      // Get the return URL from localStorage or default to admin
      const returnUrl = localStorage.getItem('authReturnUrl') || '/admin';
      localStorage.removeItem('authReturnUrl');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate(returnUrl);
      }, 3000);

    } catch (err: any) {
      console.error('Google OAuth callback error:', err);
      let errorMessage = 'Failed to connect Google account';
      
      // Extract more specific error information
      if (err.message) {
        errorMessage = err.message;
      }
      
      // If there's additional error details from the server
      if (err.response?.data?.error) {
        errorMessage = `${errorMessage}: ${err.response.data.error}`;
      }
      
      console.error('Detailed error info:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError(errorMessage);
      toast.error('Failed to connect Google account');
      
      // Get the return URL from localStorage or default to admin
      const returnUrl = localStorage.getItem('authReturnUrl') || '/admin';
      localStorage.removeItem('authReturnUrl');
      
      // Redirect after 5 seconds even on error
      setTimeout(() => {
        navigate(returnUrl);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const getNumericRating = (starRating: string): number => {
    const ratingMap = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 };
    return ratingMap[starRating as keyof typeof ratingMap] || 3;
  };

  const getRatingStars = (starRating: string) => {
    const rating = getNumericRating(starRating);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Connecting Google Account
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please wait while we set up your Google My Business integration...
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Connection Failed
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-6">
              {error}
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Google Account Connected!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your Google My Business account has been successfully connected. You can now manage reviews with AI assistance.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Redirecting to your dashboard in a few seconds...
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Google Reviews</h2>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.reviewId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {review.reviewer.profilePhotoUrl ? (
                        <img 
                          src={review.reviewer.profilePhotoUrl} 
                          alt={review.reviewer.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{review.reviewer.displayName}</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {getRatingStars(review.starRating)}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDate(review.createTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.reviewReply ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        Replied
                      </span>
                    ) : (
                      <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                        Needs Reply
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{review.comment}</p>
                  
                  {review.reviewReply && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">R</span>
                        </div>
                        <span className="font-medium text-blue-900 dark:text-blue-300">Your Reply</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {formatDate(review.reviewReply.updateTime)}
                        </span>
                      </div>
                      <p className="text-blue-800 dark:text-blue-300">{review.reviewReply.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your Google My Business reviews will appear here once customers start leaving feedback.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Tip:</strong> Encourage your guests to leave reviews on Google to build your online reputation and get more bookings!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <button
            onClick={() => {
              const returnUrl = localStorage.getItem('authReturnUrl') || '/admin';
              localStorage.removeItem('authReturnUrl');
              navigate(returnUrl);
            }}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;