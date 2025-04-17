'use client';

import { useState, useEffect } from 'react';
import supabase from '@/utils/supabase-client';

interface DriverNotification {
  id: string;
  driver_id: string;
  order_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  read: boolean;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    tracking_number: string;
    status: string;
    delivery_address: string;
    delivery_notes?: string;
    customer?: {
      name: string;
      phone: string;
      address: string;
    };
  };
}

interface DriverNotificationsProps {
  driverId: string;
  onAccept?: (notification: DriverNotification) => void;
  onReject?: (notification: DriverNotification) => void;
}

export default function DriverNotifications({ driverId, onAccept, onReject }: DriverNotificationsProps) {
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  useEffect(() => {
    if (!driverId) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/driver/notifications?driverId=${driverId}&unread=true`);
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setNotifications(data.data || []);
      } catch (err: any) {
        console.error('Error fetching driver notifications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel('driver-notifications-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_notifications',
        filter: `driver_id=eq.${driverId}`,
      }, (payload) => {
        console.log('Notification update received:', payload);
        fetchNotifications();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [driverId]);

  // Handle notification action (accept/reject)
  const handleAction = async (notificationId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch('/api/driver/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          notificationId,
          action,
          read: true,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );

      // Call the appropriate callback
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        if (action === 'accept' && onAccept) {
          onAccept(notification);
        } else if (action === 'reject' && onReject) {
          onReject(notification);
        }
      }
    } catch (err: any) {
      console.error(`Error ${action}ing notification:`, err);
      alert(`Failed to ${action} order. Please try again.`);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/driver/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          notificationId,
          read: true,
        }),
      });

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error loading notifications: {error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null; // Don't show anything if there are no notifications
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">New Order Assignments</h3>

      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 bg-white rounded-lg shadow-md border-l-4 ${
            notification.read ? 'border-gray-300' : 'border-blue-500'
          }`}
          onClick={() => !notification.read && markAsRead(notification.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-800">
              {notification.order?.tracking_number || 'New Order'}
            </h4>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {new Date(notification.created_at).toLocaleString()}
            </span>
          </div>

          <p className="text-gray-600 mb-2">{notification.message}</p>

          {notification.order && (
            <div className="mb-3 text-sm">
              <p><strong>Address:</strong> {notification.order.delivery_address}</p>
              {notification.order.customer && (
                <>
                  <p><strong>Customer:</strong> {notification.order.customer.name}</p>
                  <p><strong>Phone:</strong> {notification.order.customer.phone}</p>
                </>
              )}
              {notification.order.delivery_notes && (
                <p><strong>Notes:</strong> {notification.order.delivery_notes}</p>
              )}
            </div>
          )}

          {notification.status === 'pending' && (
            <div className="flex space-x-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(notification.id, 'accept');
                }}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(notification.id, 'reject');
                }}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
