import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader, Key, Shield, Database, Bot } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface CredentialTestPanelProps {
  hotelId: string;
}

interface TestResult {
  success: boolean;
  message: string;
  error?: string;
  details?: any;
}

export const CredentialTestPanel: React.FC<CredentialTestPanelProps> = ({ hotelId }) => {
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<{
    environment?: TestResult;
    openai?: TestResult;
    google?: TestResult;
  }>({});

  const testEnvironment = async () => {
    setTesting('environment');
    try {
      const result = await apiClient.request('/test/environment', { method: 'GET' });
      setResults(prev => ({ ...prev, environment: result }));
      if (result.success) {
        toast.success('Environment variables configured correctly!');
      } else {
        toast.error('Some environment variables are missing');
      }
    } catch (error) {
      const errorResult = { success: false, message: 'Environment test failed', error: error.message };
      setResults(prev => ({ ...prev, environment: errorResult }));
      toast.error('Environment test failed');
    } finally {
      setTesting(null);
    }
  };

  const testOpenAI = async () => {
    setTesting('openai');
    try {
      const result = await apiClient.request('/test/openai', { method: 'GET' });
      setResults(prev => ({ ...prev, openai: result }));
      if (result.success) {
        toast.success('OpenAI API is working correctly!');
      } else {
        toast.error('OpenAI API test failed');
      }
    } catch (error) {
      const errorResult = { success: false, message: 'OpenAI API test failed', error: error.message };
      setResults(prev => ({ ...prev, openai: errorResult }));
      toast.error('OpenAI API test failed');
    } finally {
      setTesting(null);
    }
  };

  const testGoogleOAuth = async () => {
    setTesting('google');
    try {
      const result = await apiClient.request('/test/google-oauth', { method: 'GET' });
      setResults(prev => ({ ...prev, google: result }));
      if (result.success) {
        toast.success('Google OAuth configuration is valid!');
      } else {
        toast.error('Google OAuth test failed');
      }
    } catch (error) {
      const errorResult = { success: false, message: 'Google OAuth test failed', error: error.message };
      setResults(prev => ({ ...prev, google: errorResult }));
      toast.error('Google OAuth test failed');
    } finally {
      setTesting(null);
    }
  };

  const getStatusIcon = (result?: TestResult, isLoading?: boolean) => {
    if (isLoading) return <Loader className="h-5 w-5 animate-spin text-blue-500" />;
    if (!result) return <AlertCircle className="h-5 w-5 text-gray-400" />;
    return result.success 
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = (result?: TestResult) => {
    if (!result) return 'border-gray-200 bg-gray-50';
    return result.success 
      ? 'border-green-200 bg-green-50' 
      : 'border-red-200 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Credential Testing</h2>
          <p className="text-gray-600">Test your API credentials and environment configuration</p>
        </div>
      </div>

      {/* Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Environment Variables Test */}
        <div className={`border-2 rounded-lg p-6 transition-colors ${getStatusColor(results.environment)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Environment</h3>
            </div>
            {getStatusIcon(results.environment, testing === 'environment')}
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Check if all required environment variables are configured
          </p>
          
          <button
            onClick={testEnvironment}
            disabled={testing === 'environment'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing === 'environment' ? 'Testing...' : 'Test Environment'}
          </button>

          {results.environment && (
            <div className="mt-4 p-3 bg-white rounded border">
              <p className={`text-sm font-medium ${results.environment.success ? 'text-green-700' : 'text-red-700'}`}>
                {results.environment.message}
              </p>
              {results.environment.details && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>Environment Status:</p>
                  <ul className="list-disc list-inside mt-1">
                    {Object.entries(results.environment.details.environment || {}).map(([key, value]) => (
                      <li key={key} className={value ? 'text-green-600' : 'text-red-600'}>
                        {key}: {value ? '✓' : '✗'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* OpenAI API Test */}
        <div className={`border-2 rounded-lg p-6 transition-colors ${getStatusColor(results.openai)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-gray-600" />
              <h3 className="font-semibold text-gray-900">OpenAI API</h3>
            </div>
            {getStatusIcon(results.openai, testing === 'openai')}
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Test OpenAI GPT-4 API connection and authentication
          </p>
          
          <button
            onClick={testOpenAI}
            disabled={testing === 'openai'}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing === 'openai' ? 'Testing...' : 'Test OpenAI'}
          </button>

          {results.openai && (
            <div className="mt-4 p-3 bg-white rounded border">
              <p className={`text-sm font-medium ${results.openai.success ? 'text-green-700' : 'text-red-700'}`}>
                {results.openai.message}
              </p>
              {results.openai.error && (
                <p className="text-xs text-red-600 mt-1">
                  Error: {results.openai.error}
                </p>
              )}
              {results.openai.details?.model && (
                <p className="text-xs text-gray-600 mt-1">
                  Model: {results.openai.details.model}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Google OAuth Test */}
        <div className={`border-2 rounded-lg p-6 transition-colors ${getStatusColor(results.google)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Key className="h-6 w-6 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Google OAuth</h3>
            </div>
            {getStatusIcon(results.google, testing === 'google')}
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Test Google OAuth 2.0 configuration for My Business API
          </p>
          
          <button
            onClick={testGoogleOAuth}
            disabled={testing === 'google'}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing === 'google' ? 'Testing...' : 'Test Google OAuth'}
          </button>

          {results.google && (
            <div className="mt-4 p-3 bg-white rounded border">
              <p className={`text-sm font-medium ${results.google.success ? 'text-green-700' : 'text-red-700'}`}>
                {results.google.message}
              </p>
              {results.google.error && (
                <p className="text-xs text-red-600 mt-1">
                  Error: {results.google.error}
                </p>
              )}
              {results.google.details?.clientId && (
                <p className="text-xs text-gray-600 mt-1">
                  Client ID: {results.google.details.clientId}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Setup Instructions</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <strong>1. OpenAI API Key:</strong>
            <p>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></p>
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">OPENAI_API_KEY=sk-your-key-here</code>
          </div>
          <div>
            <strong>2. Google OAuth Credentials:</strong>
            <p>Set up OAuth 2.0 in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></p>
            <code className="bg-blue-100 px-2 py-1 rounded text-xs block mt-1">
              GOOGLE_CLIENT_ID=your-client-id<br/>
              GOOGLE_CLIENT_SECRET=your-client-secret
            </code>
          </div>
          <div>
            <strong>3. Required Scopes:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>https://www.googleapis.com/auth/business.manage</li>
              <li>https://www.googleapis.com/auth/userinfo.profile</li>
              <li>https://www.googleapis.com/auth/userinfo.email</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Test All Button */}
      <div className="text-center">
        <button
          onClick={async () => {
            await testEnvironment();
            await testOpenAI();
            await testGoogleOAuth();
          }}
          disabled={testing !== null}
          className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? 'Testing...' : 'Test All Credentials'}
        </button>
      </div>
    </div>
  );
};