import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, FileText, Send, Loader, Star, Calendar, User, Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface Review {
  _id: string;
  reviewId: string;
  customerName: string;
  rating: number;
  reviewText: string;
  date: string;
  replied: boolean;
  replyText?: string;
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
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    tone: 'professional' as const
  });

  useEffect(() => {
    fetchReviews();
    fetchTemplates();
  }, [hotelId]);

  const fetchReviews = async () => {
    try {
      // Mock data for now - replace with actual Google Business API
      const mockReviews: Review[] = [
        {
          _id: '1',
          reviewId: 'google_123',
          customerName: 'John Smith',
          rating: 5,
          reviewText: 'Amazing stay! The staff was incredibly helpful and the room was spotless. Will definitely come back!',
          date: '2024-01-15',
          replied: false
        },
        {
          _id: '2',
          reviewId: 'google_124',
          customerName: 'Sarah Johnson',
          rating: 4,
          reviewText: 'Great hotel with excellent service. The breakfast was delicious. Only minor issue was the WiFi speed.',
          date: '2024-01-14',
          replied: false
        },
        {
          _id: '3',
          reviewId: 'google_125',
          customerName: 'Mike Wilson',
          rating: 2,
          reviewText: 'Room was not clean when we arrived. Had to wait 30 minutes for housekeeping. Not impressed.',
          date: '2024-01-13',
          replied: true,
          replyText: 'Thank you for your feedback. We sincerely apologize for the inconvenience...'
        }
      ];
      setReviews(mockReviews);
    } catch (error) {
      toast.error('Failed to fetch reviews');
    }
  };

  const fetchTemplates = async () => {
    try {
      // Mock templates for now
      const mockTemplates: Template[] = [
        {
          _id: '1',
          name: 'Positive Review Response',
          content: 'Thank you so much for your wonderful review, {customerName}! We\'re thrilled to hear about your positive experience. {ai_content} We look forward to welcoming you back soon!',
          tone: 'friendly'
        },
        {
          _id: '2',
          name: 'Negative Review Apology',
          content: 'Dear {customerName}, we sincerely apologize for the issues you experienced during your stay. {ai_content} We would love the opportunity to make this right. Please contact us directly.',
          tone: 'apologetic'
        },
        {
          _id: '3',
          name: 'Professional Standard',
          content: 'Thank you for taking the time to review our hotel, {customerName}. {ai_content} We appreciate your feedback and look forward to serving you again.',
          tone: 'professional'
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      toast.error('Failed to fetch templates');
    }
  };

  const generateAIReply = async (review: Review, tone: string = 'professional') => {
    setIsGenerating(true);
    try {
      // Mock AI generation for now - replace with actual OpenAI API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      const aiResponses = {
        5: "Your kind words about our staff and cleanliness standards truly make our day. We're delighted that we exceeded your expectations.",
        4: "We're pleased you enjoyed your stay with us. Thank you for noting our excellent service and delicious breakfast. We'll work on improving our WiFi connectivity.",
        3: "We appreciate your balanced feedback and are glad you found some aspects of your stay satisfactory. We'll continue working to improve all areas of our service.",
        2: "We deeply regret that your experience didn't meet our usual standards. Your feedback about room cleanliness and wait times is invaluable for our improvement.",
        1: "We are truly sorry that we failed to provide the quality experience you deserved. This is not reflective of our standards and we take full responsibility."
      };
      
      const generatedReply = aiResponses[review.rating as keyof typeof aiResponses] || "Thank you for your feedback. We value all guest experiences and continuously strive to improve our services.";
      setAiReply(generatedReply);
      
      // If template is selected, merge with AI content
      if (selectedTemplate) {
        const template = templates.find(t => t._id === selectedTemplate);
        if (template) {
          const mergedReply = template.content
            .replace('{customerName}', review.customerName)
            .replace('{ai_content}', generatedReply);
          setFinalReply(mergedReply);
        }
      } else {
        setFinalReply(generatedReply);
      }
      
      toast.success('AI reply generated successfully!');
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
      // Mock sending to Google - replace with actual Google Business API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update review as replied
      setReviews(prev => prev.map(review => 
        review._id === selectedReview._id 
          ? { ...review, replied: true, replyText: finalReply }
          : review
      ));
      
      setSelectedReview(null);
      setFinalReply('');
      setAiReply('');
      setSelectedTemplate('');
      
      toast.success('Reply sent to Google successfully!');
    } catch (error) {
      toast.error('Failed to send reply to Google');
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
          .replace('{customerName}', selectedReview.customerName)
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
      const template: Template = {
        _id: Date.now().toString(),
        ...newTemplate
      };
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
      setTemplates(prev => prev.map(t => 
        t._id === editingTemplate._id ? editingTemplate : t
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
      setTemplates(prev => prev.filter(t => t._id !== templateId));
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-50';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-purple-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Review Assistant</h2>
          <p className="text-gray-600">Manage Google reviews with AI-powered responses</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reviews'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Reply to Reviews
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Manage Templates
          </button>
        </nav>
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reviews List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Google Reviews</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  onClick={() => setSelectedReview(review)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedReview?._id === review._id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{review.customerName}</span>
                      {review.replied && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Replied
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {getRatingStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{review.reviewText}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(review.rating)}`}>
                      {review.rating}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reply Interface */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">AI Reply Assistant</h3>
            </div>
            <div className="p-6 space-y-4">
              {selectedReview ? (
                <>
                  {/* Selected Review */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{selectedReview.customerName}</span>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(selectedReview.rating)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{selectedReview.reviewText}</p>
                  </div>

                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Template (Optional)
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  <button
                    onClick={() => generateAIReply(selectedReview, templates.find(t => t._id === selectedTemplate)?.tone)}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Generating AI Reply...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4" />
                        Generate AI Reply
                      </>
                    )}
                  </button>

                  {/* Final Reply Editor */}
                  {finalReply && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Final Reply (Edit as needed)
                      </label>
                      <textarea
                        value={finalReply}
                        onChange={(e) => setFinalReply(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                        placeholder="Your reply will appear here..."
                      />
                    </div>
                  )}

                  {/* Send Reply */}
                  {finalReply && (
                    <button
                      onClick={sendReplyToGoogle}
                      disabled={isSending || selectedReview.replied}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Sending Reply...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Reply to Google
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a review to start generating a reply</p>
                </div>
              )}
            </div>
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

          {/* Add/Edit Template Form */}
          {(isAddingTemplate || editingTemplate) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTemplate ? 'Edit Template' : 'Add New Template'}
              </h3>
              <form onSubmit={editingTemplate ? handleEditTemplate : handleAddTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={editingTemplate ? editingTemplate.name : newTemplate.name}
                    onChange={(e) => editingTemplate 
                      ? setEditingTemplate({ ...editingTemplate, name: e.target.value })
                      : setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Positive Review Response"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone *
                  </label>
                  <select
                    value={editingTemplate ? editingTemplate.tone : newTemplate.tone}
                    onChange={(e) => editingTemplate 
                      ? setEditingTemplate({ ...editingTemplate, tone: e.target.value as any })
                      : setNewTemplate({ ...newTemplate, tone: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="apologetic">Apologetic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Content *
                  </label>
                  <textarea
                    value={editingTemplate ? editingTemplate.content : newTemplate.content}
                    onChange={(e) => editingTemplate 
                      ? setEditingTemplate({ ...editingTemplate, content: e.target.value })
                      : setNewTemplate({ ...newTemplate, content: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="Use {customerName} and {ai_content} as placeholders..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{template.name}</h4>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template._id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${
                  template.tone === 'professional' ? 'bg-blue-100 text-blue-800' :
                  template.tone === 'friendly' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {template.tone}
                </span>
                <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No templates created yet</p>
              <p className="text-sm text-gray-400">Add your first template to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};