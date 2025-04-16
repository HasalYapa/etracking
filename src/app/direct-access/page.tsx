'use client';

import Link from 'next/link';
import { CardSpotlight } from '../../components/ui/CardSpotlight';

export default function DirectAccess() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">eTracking System</h1>
          <p className="text-xl text-gray-600">Direct Access Links</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Role</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Admin */}
              <CardSpotlight className="h-full min-h-[380px]" color="#f3e8ff">
                <h3 className="text-2xl font-semibold text-purple-800 mb-4 relative z-20">Admin</h3>
                <p className="text-gray-600 mb-6 relative z-20 text-lg">Manage users, view system statistics, and oversee operations.</p>
                <div className="space-y-2 relative z-20">
                  <Link href="/admin-login" className="block w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-md text-center text-lg font-medium">
                    Admin Login
                  </Link>

                </div>
              </CardSpotlight>

              {/* Shop Owner */}
              <CardSpotlight className="h-full min-h-[380px]" color="#dbeafe">
                <h3 className="text-2xl font-semibold text-blue-800 mb-4 relative z-20">Shop Owner</h3>
                <p className="text-gray-600 mb-6 relative z-20 text-lg">Create orders, assign drivers, and track deliveries.</p>
                <div className="space-y-2 relative z-20">
                  <Link href="/shop-login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md text-center text-lg font-medium">
                    Shop Owner Login
                  </Link>
                  <Link href="/shop-signup" className="block w-full bg-blue-200 hover:bg-blue-300 text-blue-800 py-3 px-6 rounded-md text-center text-lg font-medium mt-3">
                    Shop Owner Sign Up
                  </Link>

                </div>
              </CardSpotlight>

              {/* Driver */}
              <CardSpotlight className="h-full min-h-[380px]" color="#dcfce7">
                <h3 className="text-2xl font-semibold text-green-800 mb-4 relative z-20">Driver</h3>
                <p className="text-gray-600 mb-6 relative z-20 text-lg">View assignments, update delivery status, and manage routes.</p>
                <div className="space-y-2 relative z-20">
                  <Link href="/driver-login" className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-md text-center text-lg font-medium">
                    Driver Login
                  </Link>
                  <Link href="/driver-signup" className="block w-full bg-green-200 hover:bg-green-300 text-green-800 py-3 px-6 rounded-md text-center text-lg font-medium mt-3">
                    Driver Sign Up
                  </Link>

                </div>
              </CardSpotlight>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} eTracking System. All rights reserved.
        </div>
      </div>
    </div>
  );
}
