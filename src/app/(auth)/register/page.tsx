'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { RegisterFormData, UserRole, PlanTier } from '../../../types';
import { supabase } from '../../../lib/supabase';

export default function Register() {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'shop_owner' as UserRole,
    businessName: '',
    phone: '',
    plan: 'basic' as PlanTier
  });
  const [showBusinessFields, setShowBusinessFields] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();
  const { signUp, isLoading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'role') {
      setShowBusinessFields(value === 'shop_owner');
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // First, sign up the user with Supabase Auth
      await signUp(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
        plan: formData.plan,
        businessName: formData.businessName,
        phone: formData.phone
      });

      // Get the current user and redirect based on role
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.role === 'shop_owner') {
            router.push('/dashboard');
          } else if (profile.role === 'driver') {
            router.push('/driver');
          } else if (profile.role === 'admin') {
            router.push('/admin');
          } else {
            // Default fallback
            router.push('/dashboard');
          }
        } else {
          // No profile found, default to dashboard
          router.push('/dashboard');
        }
      }
      // If no user is found, the middleware will handle the redirect
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="role" className="sr-only">I am a</label>
              <select
                id="role"
                name="role"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="shop_owner">Shop Owner</option>
                <option value="driver">Delivery Driver</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {showBusinessFields && (
              <>
                <div className="mt-4">
                  <label htmlFor="businessName" className="sr-only">Business Name</label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Business Name"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                </div>
                <div className="mt-4">
                  <label htmlFor="phone" className="sr-only">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select a Plan</label>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <input
                        type="radio"
                        id="plan-basic"
                        name="plan"
                        value="basic"
                        checked={formData.plan === 'basic'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <label
                        htmlFor="plan-basic"
                        className={`block p-4 border rounded-md cursor-pointer ${formData.plan === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">Basic Plan</span>
                          <span className="font-bold">Rs. 999/mo</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">For small businesses just getting started</p>
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="radio"
                        id="plan-standard"
                        name="plan"
                        value="standard"
                        checked={formData.plan === 'standard'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <label
                        htmlFor="plan-standard"
                        className={`block p-4 border rounded-md cursor-pointer ${formData.plan === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">Standard Plan</span>
                          <span className="font-bold">Rs. 2,499/mo</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">For growing businesses with more needs</p>
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="radio"
                        id="plan-premium"
                        name="plan"
                        value="premium"
                        checked={formData.plan === 'premium'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <label
                        htmlFor="plan-premium"
                        className={`block p-4 border rounded-md cursor-pointer ${formData.plan === 'premium' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">Premium Plan</span>
                          <span className="font-bold">Rs. 4,999/mo</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">For established businesses with high volume</p>
                      </label>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <Link href="/pricing" className="text-blue-600 hover:text-blue-500">
                      View full plan details
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Create account'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">
            By signing up, you agree to our{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
