'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { OrderWithRelations } from '../../types';

export default function DriverDashboard() {
  const { profile, isLoading: authLoading } = useAuth();
  const [deliveries, setDeliveries] = useState<OrderWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    assigned: 0,
    in_progress: 0,
    delivered: 0
  });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Fetch orders assigned to the driver
  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/orders');
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setDeliveries(data.data || []);

        // Calculate stats
        const assigned = data.data.filter((order: OrderWithRelations) =>
          order.status === 'assigned'
        ).length;
        const inProgress = data.data.filter((order: OrderWithRelations) =>
          order.status === 'picked_up' || order.status === 'in_transit'
        ).length;
        const delivered = data.data.filter((order: OrderWithRelations) =>
          order.status === 'delivered'
        ).length;

        setStats({
          assigned,
          in_progress: inProgress,
          delivered
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      fetchOrders();
    }
  }, [authLoading]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingOrderId(id);

      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          notes: `Order status updated to ${newStatus}`
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update the order in the list
      setDeliveries(prev =>
        prev.map(delivery =>
          delivery.id === id ? { ...delivery, status: newStatus } : delivery
        )
      );

      // Update stats
      if (newStatus === 'picked_up' || newStatus === 'in_transit') {
        setStats(prev => ({
          ...prev,
          assigned: prev.assigned - 1,
          in_progress: prev.in_progress + 1
        }));
      } else if (newStatus === 'delivered') {
        setStats(prev => ({
          ...prev,
          in_progress: prev.in_progress - 1,
          delivered: prev.delivered + 1
        }));
      }
    } catch (err: any) {
      console.error('Error updating order status:', err.message);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Driver Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {profile?.name || 'Driver'}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Assigned</p>
                <h2 className="text-3xl font-bold">{stats.assigned}</h2>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">In Transit</p>
                <h2 className="text-3xl font-bold">{stats.in_progress}</h2>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Delivered Today</p>
                <h2 className="text-3xl font-bold">{stats.delivered}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">My Deliveries</h2>
          <div className="flex gap-2">
            <Link href="/driver/scan" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              Scan QR Code
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 flex justify-center">
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No deliveries assigned to you yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Order #{delivery.tracking_number}</h3>
                    <p className="text-gray-600 mb-1">
                      <span className="font-medium">Customer:</span> {delivery.customers?.name}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-medium">Address:</span> {delivery.delivery_address}
                    </p>
                  </div>
                  <div>
                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full mb-4 bg-blue-100 text-blue-800">
                      {delivery.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
