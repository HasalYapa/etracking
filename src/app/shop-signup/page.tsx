'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlanTier } from '../../types';
import { supabase } from '@/lib/supabase-singleton';

export default function ShopSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to sign up with:', email);

      // Create user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'shop_owner',
            shop_name: shopName,
            plan: selectedPlan,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      console.log('Sign up successful:', data);

      // Create profile
      if (data.user) {
        try {
          console.log('Creating profile for user:', data.user.id);

          // Insert profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              name,
              email,
              role: 'shop_owner',
              business_name: shopName,
              phone,
              address,
              subscription_tier: selectedPlan,
              subscription_status: 'active',
              subscription_start: new Date().toISOString(),
              subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              plan_id: selectedPlan,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          console.log('Profile created successfully');
        } catch (profileErr: any) {
          console.error('Profile creation error:', profileErr);
          setError(`Error creating profile: ${profileErr.message}. Please try again.`);
          return;
        }
      }

      setSuccess('Sign up successful! Please check your email to verify your account.');

      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShopName('');
      setPhone('');
      setAddress('');
      setSelectedPlan('basic');

      // Set a redirecting state to show a better loading indicator
      setLoading(true);
      setSuccess('Sign up successful! Redirecting to login page...');

      // Redirect after a delay using Next.js router
      setTimeout(() => {
        router.push('/shop-login', { replace: true });
      }, 3000);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Shop Owner Sign Up
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your shop account to start managing deliveries
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="example@email.com"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="********"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="********"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                Shop Name
              </label>
              <input
                id="shopName"
                name="shopName"
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="My Shop"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="123-456-7890"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Shop Address
              </label>
              <textarea
                id="address"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={3}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="123 Main St, City, Country"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select a Plan
              </label>
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <input
                    type="radio"
                    id="plan-basic"
                    name="plan"
                    value="basic"
                    checked={selectedPlan === 'basic'}
                    onChange={() => setSelectedPlan('basic')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="plan-basic"
                    className={`block p-4 border rounded-md cursor-pointer ${selectedPlan === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">Basic Plan</span>
                      <span className="font-bold">Rs. 999/mo</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Up to 50 orders/month, 2 drivers</p>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="radio"
                    id="plan-standard"
                    name="plan"
                    value="standard"
                    checked={selectedPlan === 'standard'}
                    onChange={() => setSelectedPlan('standard')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="plan-standard"
                    className={`block p-4 border rounded-md cursor-pointer ${selectedPlan === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">Standard Plan</span>
                      <span className="font-bold">Rs. 2,499/mo</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Up to 200 orders/month, 5 drivers</p>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="radio"
                    id="plan-premium"
                    name="plan"
                    value="premium"
                    checked={selectedPlan === 'premium'}
                    onChange={() => setSelectedPlan('premium')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="plan-premium"
                    className={`block p-4 border rounded-md cursor-pointer ${selectedPlan === 'premium' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">Premium Plan</span>
                      <span className="font-bold">Rs. 4,999/mo</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Unlimited orders, up to 15 drivers</p>
                  </label>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <Link href="/pricing" className="text-blue-600 hover:text-blue-500">
                  View full plan details
                </Link>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing Up...
                </>
              ) : 'Sign Up'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/shop-login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
