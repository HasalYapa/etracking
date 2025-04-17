'use client';

import { useState } from 'react';
import DriverOrderDetail from '@/components/driver-order-detail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Clock, MapPin, Phone, User, Truck, Package, CheckCheck } from 'lucide-react';

interface OrderCardProps {
  order: {
    id: string;
    tracking_number: string;
    status: string;
    delivery_address: string;
    delivery_notes?: string;
    customer_name: string;
    customer_phone: string;
    created_at: string;
  };
  onUpdateStatus: (orderId: string, newStatus: string, notes?: string) => Promise<void>;
}

export default function DriverOrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'assigned':
        return <Clock className="h-4 w-4" />;
      case 'picked_up':
        return <Package className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCheck className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
      case 'assigned':
        return { status: 'picked_up', label: 'Pick Up' };
      case 'picked_up':
        return { status: 'in_transit', label: 'Start Delivery' };
      case 'in_transit':
        return { status: 'delivered', label: 'Complete Delivery' };
      default:
        return null;
    }
  };

  const openStatusConfirmation = (status: string) => {
    setNewStatus(status);
    setNotes('');
    setConfirmationOpen(true);
  };

  const handleUpdateStatus = async () => {
    try {
      setLoading(true);
      await onUpdateStatus(order.id, newStatus, notes);
      setConfirmationOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const nextStatus = getNextStatus(order.status);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{order.tracking_number}</CardTitle>
              <CardDescription>Created: {formatDate(order.created_at)}</CardDescription>
            </div>
            <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
              {getStatusIcon(order.status)}
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{order.delivery_address}</span>
            </div>

            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700">{order.customer_name}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700">{order.customer_phone}</span>
            </div>

            {order.delivery_notes && (
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                <p className="font-medium mb-1">Delivery Notes:</p>
                <p>{order.delivery_notes}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <div className="w-full space-y-2">
            {nextStatus && (
              <Button
                onClick={() => openStatusConfirmation(nextStatus.status)}
                className="w-full"
                variant={nextStatus.status === 'delivered' ? 'default' : 'secondary'}
              >
                {nextStatus.label}
              </Button>
            )}

            <Button
              onClick={() => setDetailsOpen(true)}
              className="w-full"
              variant="outline"
            >
              View Details
            </Button>

            {order.status === 'delivered' && (
              <div className="flex items-center justify-center text-green-600 mt-2">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Delivery Completed</span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Status Update Confirmation Dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Update Order Status
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to update this order to {newStatus.replace('_', ' ')}?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Order Details</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Tracking Number:</strong> {order.tracking_number}</p>
                <p><strong>Current Status:</strong> {order.status}</p>
                <p><strong>New Status:</strong> {newStatus}</p>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this status update"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmationOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateStatus}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <DriverOrderDetail
        orderId={order.id}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
}
