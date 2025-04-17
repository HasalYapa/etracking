'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-singleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, MapPin, Phone, User, X } from 'lucide-react';

interface DriverNotification {
  id: string;
  driver_id: string;
  order_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'read';
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

interface EnhancedDriverNotificationsProps {
  driverId: string;
  onAccept?: (notification: DriverNotification) => void;
  onReject?: (notification: DriverNotification, reason?: string) => void;
}

export default function EnhancedDriverNotifications({
  driverId,
  onAccept,
  onReject
}: EnhancedDriverNotificationsProps) {
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<DriverNotification | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationType, setConfirmationType] = useState<'accept' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

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

        // Play sound for new notifications
        if (payload.eventType === 'INSERT') {
          playNotificationSound();
          vibrate();
        }

        fetchNotifications();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [driverId]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.error('Error playing notification sound:', e));
    } catch (err) {
      console.error('Error with notification sound:', err);
    }
  };

  // Vibrate device (for mobile)
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  // Calculate estimated distance and time
  const calculateEstimates = async (notification: DriverNotification) => {
    if (!notification.order?.delivery_address) return;

    // This is a placeholder. In a real app, you would use a mapping API
    // like Google Maps, Mapbox, or OpenStreetMap to calculate these values
    const randomDistance = Math.floor(Math.random() * 10) + 1; // 1-10 km
    const randomTime = randomDistance * 3 + Math.floor(Math.random() * 10); // Approx 3 min per km + random factor

    setEstimatedDistance(randomDistance);
    setEstimatedTime(randomTime);
  };

  // Open confirmation dialog
  const openConfirmation = (notification: DriverNotification, type: 'accept' | 'reject') => {
    setSelectedNotification(notification);
    setConfirmationType(type);
    setRejectionReason('');
    setConfirmationOpen(true);
    calculateEstimates(notification);
  };

  // Close confirmation dialog
  const closeConfirmation = () => {
    setConfirmationOpen(false);
    setSelectedNotification(null);
    setConfirmationType(null);
    setRejectionReason('');
    setEstimatedDistance(null);
    setEstimatedTime(null);
  };

  // Handle notification action (accept/reject)
  const handleAction = async (notificationId: string, action: 'accept' | 'reject', reason?: string) => {
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
          rejectionReason: reason
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

          // Show browser notification
          if (Notification.permission === 'granted') {
            new Notification('Order Accepted', {
              body: `You've accepted order ${notification.order?.tracking_number}`,
              icon: '/favicon.ico'
            });
          }
        } else if (action === 'reject' && onReject) {
          onReject(notification, reason);

          // Show browser notification
          if (Notification.permission === 'granted') {
            new Notification('Order Rejected', {
              body: `You've rejected order ${notification.order?.tracking_number}`,
              icon: '/favicon.ico'
            });
          }
        }
      }

      // Close the confirmation dialog
      closeConfirmation();
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
          action: 'mark_read',
        }),
      });

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, status: 'read' }
            : notification
        )
      );
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format estimated time
  const formatEstimatedTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hr ${remainingMinutes} min`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">New Order Assignments</h3>
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">New Order Assignments</h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">New Order Assignments</h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No new assignments</h3>
          <p className="mt-1 text-sm text-gray-500">You're all caught up! New orders will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">New Order Assignments</h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          {notifications.length} New
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="border-b border-gray-100 bg-blue-50 px-4 py-2 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                  New Order
                </Badge>
                <span className="text-sm text-gray-500">
                  {formatDate(notification.created_at)}
                </span>
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {notification.order?.tracking_number || 'No Tracking #'}
              </Badge>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-1">
                  {notification.message}
                </h4>
                <p className="text-sm text-gray-600">
                  {notification.order?.delivery_notes || 'No additional notes'}
                </p>
              </div>

              {notification.order && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-700">{notification.order.delivery_address}</span>
                  </div>

                  {notification.order.customer && (
                    <>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{notification.order.customer.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{notification.order.customer.phone}</span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Estimated delivery time: 30-45 minutes</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={() => openConfirmation(notification, 'accept')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Accept
                </Button>
                <Button
                  onClick={() => openConfirmation(notification, 'reject')}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmationType === 'accept' ? 'Accept Order' : 'Reject Order'}
            </DialogTitle>
            <DialogDescription>
              {confirmationType === 'accept'
                ? 'Are you sure you want to accept this order?'
                : 'Please provide a reason for rejecting this order.'}
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="py-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Order Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Tracking Number:</strong> {selectedNotification.order?.tracking_number}</p>
                  <p><strong>Delivery Address:</strong> {selectedNotification.order?.delivery_address}</p>
                  {selectedNotification.order?.customer && (
                    <>
                      <p><strong>Customer:</strong> {selectedNotification.order.customer.name}</p>
                      <p><strong>Phone:</strong> {selectedNotification.order.customer.phone}</p>
                    </>
                  )}
                  {estimatedDistance && (
                    <p><strong>Estimated Distance:</strong> {estimatedDistance} km</p>
                  )}
                  {estimatedTime && (
                    <p><strong>Estimated Time:</strong> {formatEstimatedTime(estimatedTime)}</p>
                  )}
                </div>
              </div>

              {confirmationType === 'reject' && (
                <div className="mb-4">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for rejection
                  </label>
                  <Textarea
                    id="reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this order"
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeConfirmation}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmationType === 'accept' ? 'default' : 'destructive'}
              onClick={() => {
                if (selectedNotification) {
                  handleAction(
                    selectedNotification.id,
                    confirmationType === 'accept' ? 'accept' : 'reject',
                    confirmationType === 'reject' ? rejectionReason : undefined
                  );
                }
              }}
              disabled={confirmationType === 'reject' && !rejectionReason.trim()}
            >
              {confirmationType === 'accept' ? 'Accept Order' : 'Reject Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
