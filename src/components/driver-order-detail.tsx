'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, User, Clock, Package, Truck, CheckCheck } from 'lucide-react';
import DriverOrderProgress from '@/components/driver-order-progress';
import supabase from '@/utils/supabase-client';

interface DriverOrderDetailProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DriverOrderDetail({ orderId, isOpen, onClose }: DriverOrderDetailProps) {
  const [order, setOrder] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            customer:customers(*),
            shop:profiles(id, name, email, phone)
          `)
          .eq('id', orderId)
          .single();

        if (orderError) {
          throw new Error(orderError.message);
        }

        setOrder(orderData);

        // Fetch order history
        const { data: historyData, error: historyError } = await supabase
          .from('order_history')
          .select(`
            *,
            updater:profiles(id, name, role)
          `)
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });

        if (historyError) {
          console.error('Error fetching order history:', historyError);
          // Don't throw here, we can still show the order without history
        } else {
          setOrderHistory(historyData || []);
        }
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [isOpen, orderId]);

  // Find timestamps for each status
  const getStatusTimestamp = (status: string) => {
    const historyEntry = orderHistory.find(entry => entry.status === status);
    return historyEntry?.created_at;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'picked_up':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            View detailed information about this order
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : order ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{order.tracking_number}</h3>
                <p className="text-sm text-gray-500">Created: {formatDate(order.created_at)}</p>
              </div>
              <Badge className={`${getStatusColor(order.status)}`}>
                {order.status}
              </Badge>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{order.delivery_address}</span>
                </div>
                
                {order.customer && (
                  <>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{order.customer.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{order.customer.phone}</span>
                    </div>
                  </>
                )}
                
                {order.delivery_notes && (
                  <div className="mt-2 text-sm bg-gray-50 p-2 rounded-md">
                    <p className="font-medium mb-1">Delivery Notes:</p>
                    <p>{order.delivery_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Shop Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.shop && (
                  <>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{order.shop.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{order.shop.phone}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Delivery Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <DriverOrderProgress
                  status={order.status}
                  createdAt={order.created_at}
                  pickedUpAt={getStatusTimestamp('picked_up')}
                  inTransitAt={getStatusTimestamp('in_transit')}
                  deliveredAt={getStatusTimestamp('delivered')}
                />
              </CardContent>
            </Card>

            {orderHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderHistory.map((entry, index) => (
                      <div key={index} className="text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between">
                          <Badge variant="outline" className={getStatusColor(entry.status)}>
                            {entry.status}
                          </Badge>
                          <span className="text-gray-500">{formatDate(entry.created_at)}</span>
                        </div>
                        <p className="mt-1">{entry.notes}</p>
                        {entry.updater && (
                          <p className="text-xs text-gray-500 mt-1">
                            Updated by: {entry.updater.name} ({entry.updater.role})
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No order information found</p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
