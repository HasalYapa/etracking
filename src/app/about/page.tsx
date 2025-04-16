import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-blue-600">About etracking.store</h1>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Our Mission</h2>
              <p className="text-gray-600 mb-6">
                At etracking.store, our mission is to empower small businesses in Sri Lanka with affordable, 
                easy-to-use delivery tracking solutions. We believe that every business, regardless of size, 
                deserves access to technology that can help them compete and thrive in today's digital marketplace.
              </p>
              
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Our Story</h2>
              <p className="text-gray-600 mb-6">
                Founded in 2023, etracking.store was born out of a simple observation: small businesses in 
                Sri Lanka were struggling to provide reliable delivery tracking to their customers. While large 
                companies had access to expensive enterprise solutions, small shop owners were left behind.
              </p>
              <p className="text-gray-600 mb-6">
                Our team of local developers and entrepreneurs came together to create a solution specifically 
                designed for the unique needs and challenges of Sri Lankan small businesses. We've built a platform 
                that's not only affordable but also easy to use, even for those with limited technical experience.
              </p>
              
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-blue-700">Simplicity</h3>
                  <p className="text-gray-600">We believe technology should be simple to use and accessible to everyone.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-blue-700">Affordability</h3>
                  <p className="text-gray-600">Our solutions are priced to be accessible for even the smallest businesses.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-blue-700">Local Focus</h3>
                  <p className="text-gray-600">Built by Sri Lankans, for Sri Lankans, with local needs in mind.</p>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Join Us</h2>
              <p className="text-gray-600 mb-6">
                Whether you're a small shop owner looking to improve your delivery service, a driver seeking 
                efficient routes, or a customer wanting real-time updates, etracking.store is here to help.
              </p>
              
              <div className="flex justify-center mt-8">
                <Link href="/direct-access" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
                  Get Started Today
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
