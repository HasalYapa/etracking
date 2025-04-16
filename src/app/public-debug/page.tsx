'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Create a Supabase client
const supabaseUrl = 'https://slujerwtublzuxtzdtyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA';

export default function PublicDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [testOrderCreated, setTestOrderCreated] = useState(false);
  const [fixApplied, setFixApplied] = useState(false);

  // Add a log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    // Check if already logged in
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      addLog('Checking for existing session...');
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`Session error: ${error.message}`);
        return;
      }
      
      if (session) {
        addLog(`Already logged in as ${session.user.email}`);
        setUser(session.user);
      } else {
        addLog('No active session found');
      }
    } catch (err: any) {
      addLog(`Error checking session: ${err.message}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      addLog(`Attempting to log in with email: ${email}`);
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        addLog(`Login error: ${error.message}`);
        setError(error.message);
        return;
      }
      
      addLog(`Successfully logged in as ${data.user.email}`);
      setUser(data.user);
      setError(null);
      
    } catch (err: any) {
      addLog(`Error during login: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      setLoading(true);
      addLog('Creating test order...');
      
      if (!user) {
        addLog('Not logged in. Please log in first.');
        setError('You must be logged in to create a test order.');
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Create a test customer
      addLog('Creating customer...');
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: 'Test Customer',
          phone: '123-456-7890',
          email: 'test@example.com',
          address: 'Test Address',
          shop_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (customerError) {
        addLog(`Customer error: ${customerError.message}`);
        setError(customerError.message);
        return;
      }
      
      addLog(`Customer created with ID: ${customer.id}`);
      
      // Generate a tracking number
      const trackingNumber = `TEST-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Create a test order
      addLog('Creating order...');
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tracking_number: trackingNumber,
          shop_id: user.id,
          customer_id: customer.id,
          status: 'pending',
          delivery_address: 'Test Delivery Address',
          delivery_notes: 'Test Items',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (orderError) {
        addLog(`Order error: ${orderError.message}`);
        setError(orderError.message);
        return;
      }
      
      addLog(`Order created with ID: ${order.id}`);
      
      // Create order history
      addLog('Creating order history...');
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Test order created',
          created_at: new Date().toISOString(),
          updated_by: user.id
        });
      
      if (historyError) {
        addLog(`History error: ${historyError.message}`);
        
        // Try with a hardcoded shop owner ID
        const shopOwnerId = '9939c3f3-e3fc-4af7-9ecd-31ab535bce59'; // Sampath
        
        addLog('Trying with hardcoded shop owner ID...');
        
        const { error: fallbackError } = await supabase
          .from('order_history')
          .insert({
            order_id: order.id,
            status: 'pending',
            notes: 'Test order created (fallback)',
            created_at: new Date().toISOString(),
            updated_by: shopOwnerId
          });
          
        if (fallbackError) {
          addLog(`Fallback history error: ${fallbackError.message}`);
          setError(fallbackError.message);
          return;
        }
      }
      
      addLog('Order history created successfully');
      addLog('Test order created successfully!');
      setTestOrderCreated(true);
      setError(null);
      
    } catch (err: any) {
      addLog(`Error creating test order: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyPerformanceFix = async () => {
    try {
      setLoading(true);
      addLog('Applying performance fix...');
      
      const response = await fetch('/api/fix-shop-performance', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        addLog(`Error applying fix: ${data.error || 'Unknown error'}`);
        setError(data.error || 'Unknown error');
        return;
      }
      
      addLog(`Fix applied successfully: ${data.message}`);
      data.actions?.forEach((action: string) => {
        addLog(`- ${action}`);
      });
      
      setFixApplied(true);
      setError(null);
      
    } catch (err: any) {
      addLog(`Error applying fix: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shop Dashboard Public Debug Tool</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          This tool helps diagnose and fix issues with your shop dashboard. No login required for basic diagnostics.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Authentication</h2>
          
          {user ? (
            <div>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <p className="text-green-700">
                  <span className="font-bold">Logged in as:</span> {user.email}
                </p>
                <p className="text-green-700">
                  <span className="font-bold">User ID:</span> {user.id}
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={createTestOrder}
                  disabled={loading || testOrderCreated}
                  className={`w-full px-4 py-2 text-white rounded ${
                    testOrderCreated 
                      ? 'bg-green-600' 
                      : loading 
                        ? 'bg-blue-400' 
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {testOrderCreated 
                    ? '✓ Test Order Created' 
                    : loading 
                      ? 'Creating...' 
                      : 'Create Test Order'}
                </button>
                
                <button
                  onClick={applyPerformanceFix}
                  disabled={loading || fixApplied}
                  className={`w-full px-4 py-2 text-white rounded ${
                    fixApplied 
                      ? 'bg-green-600' 
                      : loading 
                        ? 'bg-blue-400' 
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {fixApplied 
                    ? '✓ Fix Applied' 
                    : loading 
                      ? 'Applying...' 
                      : 'Apply Performance Fix'}
                </button>
                
                <Link 
                  href="/shop-dashboard" 
                  className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Go to Shop Dashboard
                </Link>
                
                <button
                  onClick={async () => {
                    const supabase = createClient(supabaseUrl, supabaseAnonKey);
                    await supabase.auth.signOut();
                    setUser(null);
                    addLog('Signed out successfully');
                  }}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-100 p-3 rounded-lg h-60 overflow-y-auto text-xs font-mono">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Diagnostic Information</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-800">Common Issues</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>No orders in database - Create a test order to fix this</li>
              <li>Slow database queries - Apply performance fix to optimize</li>
              <li>Authentication issues - Try logging out and back in</li>
              <li>Browser caching - Try clearing your browser cache</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800">Recommended Steps</h3>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-600">
              <li>Log in with your shop owner credentials</li>
              <li>Create a test order if you don't have any orders</li>
              <li>Apply the performance fix</li>
              <li>Go to your shop dashboard to see if it works</li>
            </ol>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/shop-dashboard" 
            className="block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Shop Dashboard
          </Link>
          
          <Link 
            href="/login" 
            className="block text-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Login Page
          </Link>
          
          <Link 
            href="/" 
            className="block text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
