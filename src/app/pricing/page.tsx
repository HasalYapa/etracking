'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CardSpotlight } from '../../components/ui/CardSpotlight';

// Define plan types
type PlanTier = 'basic' | 'standard' | 'premium';

interface Plan {
  id: PlanTier;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  color: string;
  bgColor: string;
  buttonColor: string;
  buttonHoverColor: string;
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: billingCycle === 'monthly' ? 999 : 9990,
      billingCycle,
      features: [
        'Real-time order tracking',
        'Customer notifications',
        'Basic reporting',
        'Email support',
        'Up to 50 orders/month',
        'Maximum 2 drivers'
      ],
      color: 'purple',
      bgColor: '#f3e8ff',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      buttonHoverColor: 'hover:bg-purple-700'
    },
    {
      id: 'standard',
      name: 'Standard',
      price: billingCycle === 'monthly' ? 2499 : 24990,
      billingCycle,
      features: [
        'All Basic features',
        'Advanced analytics',
        'Up to 5 drivers',
        'Priority support',
        'Customer feedback collection',
        'Up to 200 orders/month'
      ],
      color: 'blue',
      bgColor: '#dbeafe',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      buttonHoverColor: 'hover:bg-blue-700'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: billingCycle === 'monthly' ? 4999 : 49990,
      billingCycle,
      features: [
        'All Standard features',
        'Unlimited orders',
        'Up to 15 drivers',
        '24/7 support',
        'Custom branding',
        'API access'
      ],
      color: 'green',
      bgColor: '#dcfce7',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      buttonHoverColor: 'hover:bg-green-700'
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple Pricing</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your business needs. All plans include access to our core tracking features.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex justify-center">
            <div className="relative bg-white p-1 rounded-lg inline-flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`${
                  billingCycle === 'monthly'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-white text-gray-700'
                } relative py-2 px-6 rounded-md transition-all duration-200 font-medium`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`${
                  billingCycle === 'yearly'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-white text-gray-700'
                } relative py-2 px-6 rounded-md transition-all duration-200 font-medium`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <CardSpotlight key={plan.id} className="h-full min-h-[600px]" color={plan.bgColor}>
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <h3 className={`text-2xl font-bold text-${plan.color}-800 mb-2 relative z-20`}>{plan.name}</h3>
                  <div className="relative z-20">
                    <span className="text-4xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
                    <span className="text-gray-600 ml-2">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                </div>

                <div className="flex-grow mb-6 relative z-20">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className={`h-5 w-5 text-${plan.color}-500 mr-2 mt-0.5 flex-shrink-0`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto relative z-20">
                  <Link
                    href="/shop-signup"
                    className={`block w-full ${plan.buttonColor} text-white py-3 px-6 rounded-md text-center text-lg font-medium`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </CardSpotlight>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need a custom solution?</h2>
          <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
            We offer tailored solutions for larger businesses with specific requirements.
            Contact our team to discuss your needs.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  );
}
