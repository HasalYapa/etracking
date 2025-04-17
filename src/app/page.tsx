import Image from "next/image";
import Link from "next/link";
import { TypewriterEffectSmooth } from "../components/ui/typewriter-effect";
import { WobbleCard } from "../components/ui/wobble-card";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          {/* Typewriter Effect */}
          <div className="my-8 sm:my-6 flex justify-center items-center px-4">
            <TypewriterEffectSmooth
              words={[
                { text: "etracking", className: "text-white" },
                { text: ".", className: "text-white" },
                { text: "store", className: "text-blue-300" },
              ]}
              className="!text-5xl sm:!text-6xl md:!text-7xl font-bold mx-auto leading-tight tracking-tight"
              cursorClassName="h-10 md:h-16 bg-blue-300"
            />
          </div>

          <p className="text-2xl md:text-2xl mb-8 max-w-3xl mx-auto font-medium px-4">
            Simple, Real-Time Delivery Tracking for Sri Lankan Small Businesses
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 sm:mt-8">
            <Link
              href="/direct-access"
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-5 sm:py-3 px-8 rounded-full text-xl sm:text-lg transition-colors w-full sm:w-auto"
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              className="bg-transparent hover:bg-blue-500 text-white border-2 border-white font-bold py-5 sm:py-3 px-8 rounded-full text-xl sm:text-lg transition-colors w-full sm:w-auto"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Direct Access Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {/* Admin */}
            <WobbleCard containerClassName="col-span-1 bg-purple-800 min-h-[200px]">
              <h3 className="text-xl font-semibold text-white mb-3">Admin</h3>
              <p className="text-neutral-200 mb-4">Access the admin dashboard to manage all shops, drivers, and orders.</p>
              <Link href="/login" className="block w-full bg-white hover:bg-purple-100 text-purple-800 py-2 px-4 rounded text-center font-medium">
                Admin Login
              </Link>
            </WobbleCard>

            {/* Shop Owner */}
            <WobbleCard containerClassName="col-span-1 bg-blue-800 min-h-[200px]">
              <h3 className="text-xl font-semibold text-white mb-3">Shop Owner</h3>
              <p className="text-neutral-200 mb-4">Manage your shop's orders and track deliveries in real-time.</p>
              <Link href="/login" className="block w-full bg-white hover:bg-blue-100 text-blue-800 py-2 px-4 rounded text-center font-medium">
                Shop Owner Login
              </Link>
              <Link href="/shop-signup" className="block w-full bg-blue-200 hover:bg-blue-300 text-blue-800 py-2 px-4 rounded text-center mt-2 font-medium">
                Shop Owner Sign Up
              </Link>
            </WobbleCard>

            {/* Driver */}
            <WobbleCard containerClassName="col-span-1 bg-green-800 min-h-[200px]">
              <h3 className="text-xl font-semibold text-white mb-3">Driver</h3>
              <p className="text-neutral-200 mb-4">View your delivery assignments and update delivery status on the go.</p>
              <Link href="/login" className="block w-full bg-white hover:bg-green-100 text-green-800 py-2 px-4 rounded text-center font-medium">
                Driver Login
              </Link>
              <Link href="/driver-signup" className="block w-full bg-green-200 hover:bg-green-300 text-green-800 py-2 px-4 rounded text-center mt-2 font-medium">
                Driver Sign Up
              </Link>
            </WobbleCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <WobbleCard containerClassName="col-span-1 bg-indigo-700 min-h-[250px]">
              <div className="bg-white text-indigo-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Real-Time Order Tracking</h3>
              <p className="text-neutral-200">Let shop owners update and share order status instantly with customers.</p>
            </WobbleCard>

            {/* Feature 2 */}
            <WobbleCard containerClassName="col-span-1 bg-blue-700 min-h-[250px]">
              <div className="bg-white text-blue-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Driver Dashboard</h3>
              <p className="text-neutral-200">Drivers manage deliveries easily on mobile with a simple, intuitive interface.</p>
            </WobbleCard>

            {/* Feature 3 */}
            <WobbleCard containerClassName="col-span-1 bg-purple-700 min-h-[250px]">
              <div className="bg-white text-purple-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Customer SMS Updates</h3>
              <p className="text-neutral-200">Customers get automated status updates via SMS at every stage of delivery.</p>
            </WobbleCard>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <WobbleCard containerClassName="col-span-1 bg-purple-800 min-h-[400px]">
              <h3 className="text-2xl font-bold mb-2 text-white">Basic</h3>
              <div className="text-3xl font-bold mb-6 text-white">LKR 999<span className="text-purple-200 text-lg font-normal">/month</span></div>
              <ul className="mb-8 flex-grow text-white">
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 50 orders/month
                </li>
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Maximum 2 drivers
                </li>
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Email support
                </li>
              </ul>
              <Link href="/pricing" className="block w-full bg-white hover:bg-purple-50 text-purple-800 font-bold py-3 px-4 rounded-lg text-center transition-colors">
                Get Started
              </Link>
            </WobbleCard>

            {/* Standard Plan */}
            <WobbleCard containerClassName="col-span-1 bg-blue-700 min-h-[400px] md:transform md:scale-105 z-10 my-8 md:my-0">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-blue-700 px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Standard</h3>
              <div className="text-3xl font-bold mb-6 text-white">LKR 2,499<span className="text-blue-200 text-lg font-normal">/month</span></div>
              <ul className="mb-8 flex-grow text-white">
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 200 orders/month
                </li>
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 5 drivers
                </li>
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced analytics
                </li>
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
              </ul>
              <Link href="/pricing" className="block w-full bg-white hover:bg-blue-50 text-blue-700 font-bold py-3 px-4 rounded-lg text-center transition-colors">
                Get Started
              </Link>
            </WobbleCard>

            {/* Premium Plan */}
            <WobbleCard containerClassName="col-span-1 bg-green-800 min-h-[400px]">
              <h3 className="text-2xl font-bold mb-2 text-white">Premium</h3>
              <div className="text-3xl font-bold mb-6 text-white">LKR 4,999<span className="text-green-200 text-lg font-normal">/month</span></div>
              <ul className="mb-8 flex-grow text-white">
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited orders
                </li>
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 15 drivers
                </li>
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  24/7 support
                </li>
                <li className="flex items-center mb-3">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Custom branding
                </li>
              </ul>
              <Link href="/pricing" className="block w-full bg-white hover:bg-green-50 text-green-800 font-bold py-3 px-4 rounded-lg text-center transition-colors">
                Get Started
              </Link>
            </WobbleCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-xl font-bold mb-4">etracking.store</h3>
              <p className="text-blue-100 mb-4">Simple, Real-Time Delivery Tracking for Sri Lankan Small Businesses</p>
              <div className="flex space-x-4">
                <a href="#" className="text-white hover:text-blue-200 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-blue-200 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-blue-200 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-span-1">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/direct-access" className="text-blue-100 hover:text-white transition-colors">Direct Access</Link></li>
                <li><Link href="/login" className="text-blue-100 hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/minimal-shop" className="text-blue-100 hover:text-white transition-colors">Shop Dashboard</Link></li>
                <li><Link href="/minimal-driver" className="text-blue-100 hover:text-white transition-colors">Driver Dashboard</Link></li>
              </ul>
            </div>

            {/* Sign Up */}
            <div className="col-span-1">
              <h3 className="text-lg font-semibold mb-4">Sign Up</h3>
              <ul className="space-y-2">
                <li><Link href="/shop-signup" className="text-blue-100 hover:text-white transition-colors">Shop Owner Registration</Link></li>
                <li><Link href="/driver-signup" className="text-blue-100 hover:text-white transition-colors">Driver Registration</Link></li>
                <li><a href="#" className="text-blue-100 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-blue-100 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-1">
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-blue-100">dimanthayapa2001@gmail.com</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-blue-100">+94 76 006 1600</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-blue-100">Gampaha, Sri Lanka</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-blue-500/30 text-center">
            <p className="text-blue-100">© 2025 etracking.store – Made in Sri Lanka</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
