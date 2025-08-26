import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, FileText, Send, Loader, Star, Calendar, User, Edit3, Plus, Trash2, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

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

interface GoogleAccount {
  name: string;
  email: string;
  picture: string;
  businessName: string;
  businessId: string;
}

interface Template {
  _id: string;
  name: string;
  content: string;
  tone: 'professional' | 'friendly' | 'apologetic';
}

interface AIAssistantPanelProps {
  hotelId: string;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ hotelId }) => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'templates'>('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [aiReply, setAiReply] = useState<string>('');
  const [finalReply, setFinalReply] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    tone: 'professional' as const
  });
  
  const { isAuthenticated, googleAccount, isLoading, signInWithGoogle, signOut, checkAuthStatus } = useAuth();

  const handleGoogleSignOut = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account?')) return;
    
    try {
      await apiClient.request(`/google-auth/disconnect/${hotelId}`, {
        method: 'POST'
      });
      
      signOut();
      setReviews([]);
      toast.success('Google account disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect Google account:', error);
      toast.error('Failed to disconnect Google account');
    }
  };

  useEffect(() => {
    checkAuthStatus(hotelId);
    fetchTemplates();
  }, [hotelId]);

  useEffect(() => {
    if (isAuthenticated && googleAccount) {
      fetchGoogleReviews();
    }
  }, [isAuthenticated, googleAccount]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(hotelId);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to initiate Google sign-in');
    }
  };

const fetchGoogleReviews = async () => {
    if (!isAuthenticated || !googleAccount || isLoading || isLoadingReviews) return;
    
    setIsLoadingReviews(true);
    try {
      console.log('🔍 Fetching Google reviews...');
      const reviewsData = await apiClient.request(`/google-reviews/${hotelId}`, {
        method: 'GET'
      });
      
      const response = reviewsData as { 
        reviews: Review[]; 
        error?: string; 
        message?: string;
        needsReconnect?: boolean;
        needsSetup?: boolean;
        needsPermissions?: boolean;
        cached?: boolean;
        cacheAge?: number;
      };
      
      // Handle different response scenarios
      if (response.needsReconnect) {
        toast.error('Google connection expired. Please reconnect your account.');
        signOut(); // Sign out to trigger re-authentication
        return;
      }
      
      if (response.needsSetup) {
        toast.error('Please set up your Google My Business profile first');
      } else if (response.needsPermissions) {
        toast.error('Access denied. Please ensure your Google account has Google My Business access.');
      } else if (response.cached) {
        toast.success(`Reviews loaded from cache (${Math.floor(response.cacheAge! / 60)} minutes old)`);
      } else if (response.message) {
        toast(response.message);
      } else if (response.error) {
        console.warn('Google reviews API warning:', response.error);
        toast.error(response.error);
      }
      
      console.log(`✅ Fetched ${response.reviews?.length || 0} reviews from Google`);
      setReviews(response.reviews || []);
    } catch (error: any) {
      console.error('Failed to fetch Google reviews:', error);
      
      // Handle specific error cases
      if (error.message?.includes('429') || error.message?.includes('quota exceeded')) {
        toast.error('Google API quota exceeded. Reviews will be cached for 2 hours to reduce API usage. Please try again later.');
      } else if (error.message?.includes('401') || error.message?.includes('authentication')) {
        toast.error('Google authentication failed. Please reconnect your account.');
        signOut(); // Trigger re-authentication
      } else if (error.message?.includes('403') || error.message?.includes('Access denied')) {
        toast.error('Access denied. Please ensure your Google account has Google My Business access.');
      } else {
        toast.error('Failed to connect to Google My Business. Please try reconnecting.');
      }
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const templatesData = await apiClient.request(`/templates/${hotelId}`, {
        method: 'GET'
      });
      setTemplates(Array.isArray(templatesData) ? templatesData as Template[] : []);
    } catch (error) {
      console.error('Failed to fetch templates');
    }
  };

  const generateAIReply = async (review: Review, tone: string = 'professional') => {
    setIsGenerating(true);
    try {
      const response = await apiClient.request('/generate-reply', {
        method: 'POST',
        body: JSON.stringify({
          reviewText: review.comment,
          rating: getNumericRating(review.starRating),
          customerName: review.reviewer.displayName,
          tone: tone
        })
      }) as { aiReply: string; source?: string };

      setAiReply(response.aiReply);

      // Show different success message based on AI source
      if (response.source === 'openai') {
        toast.success('AI reply generated with GPT-4!');
      } else if (response.source === 'template') {
        toast.success('Smart reply generated with built-in AI!');
      } else {
        toast.success('Fallback reply generated (OpenAI unavailable)');
      }
      // If template is selected, merge with AI content
      if (selectedTemplate) {
        const template = templates.find(t => t._id === selectedTemplate);
        if (template) {
          const mergedReply = template.content
            .replace('{customerName}', review.reviewer.displayName)
            .replace('{ai_content}', response.aiReply);
          setFinalReply(mergedReply);
        }
      } else {
        setFinalReply(response.aiReply);
      }
      
    } catch (error) {
      toast.error('Failed to generate AI reply');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendReplyToGoogle = async () => {
    if (!selectedReview || !finalReply.trim()) {
      toast.error('Please select a review and enter a reply');
      return;
    }

    setIsSending(true);
    try {
      await apiClient.request(`/send-reply/${hotelId}`, {
        method: 'POST',
        body: JSON.stringify({
          reviewId: selectedReview.reviewId,
          replyText: finalReply
        })
      });
      
      // Update review as replied locally
      setReviews(prev => prev.map(review => 
        review.reviewId === selectedReview.reviewId 
          ? { 
              ...review, 
              reviewReply: { 
                comment: finalReply, 
                updateTime: new Date().toISOString() 
              } 
            }
          : review
      ));
      
      setSelectedReview(null);
      setFinalReply('');
      setAiReply('');
      setSelectedTemplate('');
      
      toast.success('Reply sent to Google successfully!');
    } catch (error: any) {
      console.error('Failed to send reply:', error);
      if (error.message?.includes('429') || error.message?.includes('quota exceeded')) {
        toast.error('Google API quota exceeded. Please wait before sending another reply.');
      } else {
        toast.error('Failed to send reply to Google');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (selectedReview && aiReply) {
      const template = templates.find(t => t._id === templateId);
      if (template) {
        const mergedReply = template.content
          .replace('{customerName}', selectedReview.reviewer.displayName)
          .replace('{ai_content}', aiReply);
        setFinalReply(mergedReply);
      }
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const template = await apiClient.request(`/templates/${hotelId}`, {
        method: 'POST',
        body: JSON.stringify(newTemplate)
      }) as Template;
      setTemplates(prev => [...prev, template]);
      setNewTemplate({ name: '', content: '', tone: 'professional' });
      setIsAddingTemplate(false);
      toast.success('Template added successfully');
    } catch (error) {
      toast.error('Failed to add template');
    }
  };

  const handleEditTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      const updatedTemplate = await apiClient.request(`/templates/${hotelId}/${editingTemplate._id}`, {
        method: 'PUT',
        body: JSON.stringify(editingTemplate)
      });
      setTemplates(prev => prev.map(t => 
        t._id === editingTemplate._id ? (updatedTemplate as Template) : t
      ));
      setEditingTemplate(null);
      toast.success('Template updated successfully');
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await apiClient.request(`/templates/${hotelId}/${templateId}`, {
        method: 'DELETE'
      });
      setTemplates(prev => prev.filter(t => t._id !== templateId));
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error('Failed to delete template');
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

  const getRatingColor = (starRating: string) => {
    const rating = getNumericRating(starRating);
    if (rating >= 4) return 'text-green-600 bg-green-50';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // If not authenticated with Google, show sign-in screen
  if (!isAuthenticated || !googleAccount) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Review Assistant</h2>
            <p className="text-gray-600">Connect with Google My Business to manage reviews</p>
          </div>
        </div>

        {/* Google Sign-In Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Connect Google My Business
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sign in with Google to access your business reviews and start using AI-powered reply assistance.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 px-6 rounded-xl font-semibold hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>AI-Powered Review Assistant</strong><br/>
                Generate professional, SEO-optimized replies using advanced AI or smart templates.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header with Google Account Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Review Assistant</h2>
            <p className="text-gray-600 dark:text-gray-300">Manage Google reviews with AI-powered responses</p>
          </div>
        </div>
        {googleAccount && (
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <img
              src={googleAccount.picture}
              alt={googleAccount.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">{googleAccount.businessName}</p>
              <p className="text-gray-500 dark:text-gray-400">{googleAccount.email}</p>
            </div>
            <button
              onClick={handleGoogleSignOut}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Disconnect Google Account"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reviews'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Reply to Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Manage Templates ({templates.length})
          </button>
        </nav>
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reviews List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Reviews</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {reviews.length > 0 ? `${reviews.length} reviews loaded` : 'No reviews found'}
              </p>
              <button
                onClick={fetchGoogleReviews}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Reviews'}
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading reviews...</span>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.reviewId}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-2 cursor-pointer transition-all ${
                      selectedReview?.reviewId === review.reviewId
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedReview(review)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{review.reviewer.displayName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getRatingStars(review.starRating)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{review.comment}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {formatDate(review.createTime)}
                      </span>
                      {review.reviewReply ? (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          Replied
                        </span>
                      ) : (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          Needs Reply
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No reviews found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Reviews will appear here once available</p>
              </div>
            )}
          </div>

          {/* Reply Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Reply</h3>
            
            {selectedReview ? (
              <div className="space-y-4">
                {/* Selected Review Display */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{selectedReview.reviewer.displayName}</span>
                    <div className="flex items-center gap-1">
                      {getRatingStars(selectedReview.starRating)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedReview.comment}</p>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Template (Optional)
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    aria-label="Select template"
                  >
                    <option value="">No template</option>
                    {templates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name} ({template.tone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Generate AI Reply */}
                <div className="flex gap-2">
                  <button
                    onClick={() => generateAIReply(selectedReview, 'professional')}
                    disabled={isGenerating}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4" />
                        Generate AI Reply
                      </>
                    )}
                  </button>
                </div>

                {/* Final Reply Editor */}
                {finalReply && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Final Reply
                    </label>
                    <textarea
                      value={finalReply}
                      onChange={(e) => setFinalReply(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                      placeholder="Edit your reply before sending..."
                    />
                    <button
                      onClick={sendReplyToGoogle}
                      disabled={isSending || !finalReply.trim()}
                      className="mt-2 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Reply to Google
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Select a review to generate a reply</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Add Template Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddingTemplate(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Template
            </button>
          </div>

          {/* Add/Edit Form */}
          {(isAddingTemplate || editingTemplate) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingTemplate ? 'Edit Template' : 'Add New Template'}
              </h3>
              <form
                onSubmit={editingTemplate ? handleEditTemplate : handleAddTemplate}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={editingTemplate ? editingTemplate.name : newTemplate.name}
                    onChange={(e) =>
                      editingTemplate
                        ? setEditingTemplate({ ...editingTemplate, name: e.target.value })
                        : setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Positive Review Response"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tone *</label>
                  <select
                    value={editingTemplate ? editingTemplate.tone : newTemplate.tone}
                    onChange={(e) =>
                      editingTemplate
                        ? setEditingTemplate({ ...editingTemplate, tone: e.target.value as any })
                        : setNewTemplate({ ...newTemplate, tone: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    aria-label="Select tone"
                    required
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="apologetic">Apologetic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template Content *</label>
                  <textarea
                    value={editingTemplate ? editingTemplate.content : newTemplate.content}
                    onChange={(e) =>
                      editingTemplate
                        ? setEditingTemplate({ ...editingTemplate, content: e.target.value })
                        : setNewTemplate({ ...newTemplate, content: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="Use {customerName} and {ai_content} as placeholders..."
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use placeholders: {'{customerName}'} for customer name, {'{ai_content}'} for AI-generated content
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTemplate(false);
                      setEditingTemplate(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingTemplate ? 'Update Template' : 'Add Template'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Templates List */}
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template._id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingTemplate(template)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        aria-label="Edit template"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        aria-label="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${
                      template.tone === 'professional'
                        ? 'bg-blue-100 text-blue-800'
                        : template.tone === 'friendly'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {template.tone}
                  </span>
                  <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No templates created yet</p>
              <p className="text-sm text-gray-400">Add your first template to get started</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};
