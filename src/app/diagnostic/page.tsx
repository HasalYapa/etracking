'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Create a Supabase client for this diagnostic page
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DiagnosticPage() {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  const [cookieData, setCookieData] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [fixAttempted, setFixAttempted] = useState(false);
  const [fixResult, setFixResult] = useState<string>('');
  const [email, setEmail] = useState('dimanthayapa2001@gmail.com');
  const [password, setPassword] = useState('Yapa@2006');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<string>('');

  // Check session on load
  useEffect(() => {
    async function checkSession() {
      try {
        setLoading(true);

        // Get session from Supabase
        const { data, error } = await supabase.auth.getSession();
        setSessionData({ data, error });

        // Get localStorage data - check both possible keys
        try {
          const supabaseKey = 'sb-slujerwtublzuxtzdtyw-auth-token';
          const legacyKey = 'supabase.auth.token';

          // Collect all auth-related localStorage data
          const storageData = {};

          // Check for the Supabase key
          const supabaseAuthData = localStorage.getItem(supabaseKey);
          if (supabaseAuthData) {
            try {
              storageData[supabaseKey] = JSON.parse(supabaseAuthData);
            } catch (e) {
              storageData[supabaseKey] = { error: 'Failed to parse', raw: supabaseAuthData };
            }
          }

          // Check for the legacy key
          const legacyAuthData = localStorage.getItem(legacyKey);
          if (legacyAuthData) {
            try {
              storageData[legacyKey] = JSON.parse(legacyAuthData);
            } catch (e) {
              storageData[legacyKey] = { error: 'Failed to parse', raw: legacyAuthData };
            }
          }

          // Check all localStorage keys for any auth-related data
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('auth') && key !== supabaseKey && key !== legacyKey) {
              try {
                const value = localStorage.getItem(key);
                try {
                  storageData[key] = JSON.parse(value);
                } catch {
                  storageData[key] = value;
                }
              } catch (e) {
                storageData[key] = { error: e.message };
              }
            }
          }

          setLocalStorageData(storageData);
        } catch (e) {
          setLocalStorageData({ error: e.message });
        }

        // Get cookies
        setCookieData(document.cookie);

      } catch (err) {
        console.error('Error in diagnostic:', err);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  // Check API endpoint
  const checkApi = async () => {
    try {
      setApiLoading(true);
      const response = await fetch('/api/check-driver-session');
      const data = await response.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setApiLoading(false);
    }
  };

  // Attempt to fix session issues
  const attemptFix = async () => {
    try {
      setFixAttempted(true);

      // Clear any existing session data
      await supabase.auth.signOut();

      // Clear localStorage
      localStorage.removeItem('supabase.auth.token');

      // Clear cookies (this is a simple approach, might not clear all auth cookies)
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      setFixResult('Session data cleared. Please try logging in again.');

      // Refresh the diagnostic data
      const { data, error } = await supabase.auth.getSession();
      setSessionData({ data, error });

      try {
        const authData = localStorage.getItem('supabase.auth.token');
        setLocalStorageData(authData ? JSON.parse(authData) : null);
      } catch (e) {
        setLocalStorageData({ error: e });
      }

      setCookieData(document.cookie);

    } catch (err: any) {
      setFixResult(`Error during fix: ${err.message}`);
    }
  };

  // Login function
  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      setLoginResult('');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setLoginResult(`Login error: ${error.message}`);
        return;
      }

      setLoginResult('Login successful! Refreshing session data...');

      // Refresh the diagnostic data
      const sessionResult = await supabase.auth.getSession();
      setSessionData({ data: sessionResult.data, error: sessionResult.error });

      try {
        const authData = localStorage.getItem('supabase.auth.token');
        setLocalStorageData(authData ? JSON.parse(authData) : null);
      } catch (e) {
        setLocalStorageData({ error: e });
      }

      setCookieData(document.cookie);

    } catch (err: any) {
      setLoginResult(`Unexpected error: ${err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            etracking.store Authentication Diagnostic
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            This tool helps diagnose and fix authentication issues
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Session Status</h2>
              <p className="mt-1 text-sm text-gray-500">Current authentication state</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh
              </button>
              <button
                onClick={attemptFix}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear Session Data
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500">Loading session data...</p>
            </div>
          ) : (
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Supabase Session</h3>
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
                  <pre className="text-xs">{JSON.stringify(sessionData, null, 2)}</pre>
                </div>

                <div className="mt-4 flex items-center">
                  <div className="flex-shrink-0">
                    {sessionData?.data?.session ? (
                      <span className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {sessionData?.data?.session ? 'Active session found' : 'No active session'}
                    </h3>
                    <div className="mt-1 text-sm text-gray-500">
                      {sessionData?.data?.session ? (
                        <span>User ID: {sessionData.data.session.user.id}</span>
                      ) : (
                        <span>No user is currently logged in</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">localStorage Data</h3>
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
                  <pre className="text-xs">{JSON.stringify(localStorageData, null, 2)}</pre>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cookie Data</h3>
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-40">
                  <pre className="text-xs">{cookieData || 'No cookies found'}</pre>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">API Check</h3>
                <button
                  onClick={checkApi}
                  disabled={apiLoading}
                  className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {apiLoading ? 'Checking...' : 'Check API Session'}
                </button>

                {apiResponse && (
                  <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
                    <pre className="text-xs">{JSON.stringify(apiResponse, null, 2)}</pre>
                  </div>
                )}
              </div>

              {fixAttempted && (
                <div className={`mb-6 p-4 rounded-md ${fixResult.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  <p>{fixResult}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Login Test</h2>
            <p className="mt-1 text-sm text-gray-500">Test authentication with driver credentials</p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <button
                  onClick={handleLogin}
                  disabled={loginLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loginLoading ? 'Logging in...' : 'Test Login'}
                </button>
              </div>

              {loginResult && (
                <div className={`p-4 rounded-md ${loginResult.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  <p>{loginResult}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Navigation</h2>
            <p className="mt-1 text-sm text-gray-500">Test different pages</p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/driver-login" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Driver Login Page
              </Link>

              <Link href="/minimal-driver" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Minimal Driver Page
              </Link>

              <Link href="/supabase-analyzer" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                Supabase Query Analyzer
              </Link>

              <Link href="/" className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Home Page
              </Link>

              <button
                onClick={() => window.location.href = '/minimal-driver?debug=true'}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Driver Page (Debug Mode)
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Advanced Tools</h2>
            <p className="mt-1 text-sm text-gray-500">Use these tools with caution</p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Direct Login</h3>
                <p className="text-sm text-gray-500 mb-4">This will attempt to log in directly using the Supabase client</p>

                <button
                  onClick={async () => {
                    try {
                      setLoginLoading(true);
                      setLoginResult('Attempting direct login...');

                      const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password
                      });

                      if (error) {
                        setLoginResult(`Direct login error: ${error.message}`);
                        return;
                      }

                      setLoginResult('Direct login successful! Redirecting to driver dashboard...');

                      // Force a delay to ensure session is properly established
                      await new Promise(resolve => setTimeout(resolve, 1000));

                      // Redirect to minimal driver dashboard
                      window.location.href = '/minimal-driver';
                    } catch (err) {
                      setLoginResult(`Unexpected error: ${err.message}`);
                    } finally {
                      setLoginLoading(false);
                    }
                  }}
                  disabled={loginLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {loginLoading ? 'Logging in...' : 'Direct Login & Redirect'}
                </button>

                {loginResult && (
                  <div className={`mt-2 p-2 rounded-md ${loginResult.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    <p className="text-sm">{loginResult}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-2">Manual Session Setup</h3>
                <p className="text-sm text-gray-500 mb-4">This will attempt to manually set up a session using any available token</p>

                <button
                  onClick={async () => {
                    try {
                      setLoginLoading(true);
                      setLoginResult('Attempting to set up session manually...');

                      // Try to get token from localStorage
                      const supabaseKey = 'sb-slujerwtublzuxtzdtyw-auth-token';
                      const storedSession = localStorage.getItem(supabaseKey);

                      if (!storedSession) {
                        setLoginResult('No token found in localStorage');
                        return;
                      }

                      try {
                        const parsedSession = JSON.parse(storedSession);
                        if (!parsedSession?.access_token) {
                          setLoginResult('No access token found in stored session');
                          return;
                        }

                        // Try to set the session manually
                        const { data, error } = await supabase.auth.setSession({
                          access_token: parsedSession.access_token,
                          refresh_token: parsedSession.refresh_token || '',
                        });

                        if (error) {
                          setLoginResult(`Error setting session: ${error.message}`);
                          return;
                        }

                        setLoginResult('Session set up successfully! Redirecting to driver dashboard...');

                        // Force a delay to ensure session is properly established
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // Redirect to minimal driver dashboard
                        window.location.href = '/minimal-driver';
                      } catch (parseErr) {
                        setLoginResult(`Error parsing stored session: ${parseErr.message}`);
                      }
                    } catch (err) {
                      setLoginResult(`Unexpected error: ${err.message}`);
                    } finally {
                      setLoginLoading(false);
                    }
                  }}
                  disabled={loginLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  {loginLoading ? 'Setting up...' : 'Manual Session Setup & Redirect'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            This diagnostic tool is for development purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
