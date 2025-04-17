'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import { ToastContainer, toast } from 'react-toastify';
import { supabase } from '@/lib/supabase-singleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import Leaflet CSS - these will be imported in the page component instead
// import 'leaflet/dist/leaflet.css';
// import 'react-toastify/dist/ReactToastify.css';

// Fix for Leaflet marker icons in Next.js
const markerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">D</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const orderIcon = L.divIcon({
  className: 'custom-order-icon',
  html: `<div style="background-color: #ff6b6b; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">O</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Define types
interface Driver {
  id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  available: boolean;
  last_active: string;
}

interface Order {
  id: string;
  tracking_number: string;
  status: string;
  delivery_address: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
  order: Order | null;
  onConfirm: () => void;
}

// Component to recenter map when drivers change
function MapUpdater({ drivers }: { drivers: Driver[] }) {
  const map = useMap();

  useEffect(() => {
    if (drivers.length > 0) {
      // Create bounds from all driver positions
      const bounds = L.latLngBounds(drivers.map(driver => [driver.latitude, driver.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [drivers, map]);

  return null;
}

// Assignment confirmation modal
function AssignmentModal({ isOpen, onClose, driver, order, onConfirm }: AssignmentModalProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [cost, setEstimatedCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driver && order && order.latitude && order.longitude) {
      // Calculate distance using turf
      const from = turf.point([driver.longitude, driver.latitude]);
      const to = turf.point([order.longitude, order.latitude]);
      const options = { units: 'kilometers' as turf.Units };
      const calculatedDistance = turf.distance(from, to, options);

      setDistance(calculatedDistance);

      // Calculate estimated cost
      const baseRate = 100; // Base rate in LKR
      const ratePerKm = 50; // Rate per km in LKR
      const estimatedCost = baseRate + (calculatedDistance * ratePerKm);
      setEstimatedCost(estimatedCost);
    }
  }, [driver, order]);

  const handleConfirm = async () => {
    if (!driver || !order) return;

    setLoading(true);
    try {
      // Call API to assign order to driver
      const response = await fetch('/api/assign-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          driverId: driver.id,
          distance: distance,
          estimatedCost: cost,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign order');
      }

      toast.success(`Order ${order.tracking_number} assigned to ${driver.name}`);
      onConfirm();
    } catch (error: any) {
      toast.error(`Assignment failed: ${error.message}`);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Order to Driver</DialogTitle>
          <DialogDescription>
            Confirm assignment details below
          </DialogDescription>
        </DialogHeader>

        {driver && order && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Driver</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{driver.name}</p>
                  <p className="text-sm text-gray-500">{driver.phone}</p>
                  <Badge className="mt-2 bg-green-100 text-green-800 border-green-200">
                    {driver.available ? 'Available' : 'Busy'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{order.tracking_number}</p>
                  <p className="text-sm text-gray-500">{order.customer_name}</p>
                  <Badge className="mt-2 bg-blue-100 text-blue-800 border-blue-200">
                    {order.status}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Address:</strong> {order.delivery_address}</p>
                <p><strong>Customer:</strong> {order.customer_name}</p>
                <p><strong>Phone:</strong> {order.customer_phone}</p>
                {distance !== null && (
                  <p><strong>Distance:</strong> {distance.toFixed(2)} km</p>
                )}
                {cost !== null && (
                  <p><strong>Estimated Cost:</strong> LKR {cost.toFixed(2)}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MapAssignment() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const draggedOrderRef = useRef<Order | null>(null);

  // Load drivers and orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch available drivers
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .eq('available', true);

        if (driversError) throw driversError;

        // Fetch unassigned orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, customers(*)')
          .eq('status', 'pending')
          .is('driver_id', null);

        if (ordersError) throw ordersError;

        // Process orders to extract customer info
        const processedOrders = ordersData.map((order: any) => ({
          id: order.id,
          tracking_number: order.tracking_number,
          status: order.status,
          delivery_address: order.delivery_address,
          customer_name: order.customers?.name || 'Unknown',
          customer_phone: order.customers?.phone || 'Unknown',
          created_at: order.created_at,
          // Geocode the address or use default coordinates for Sri Lanka
          latitude: order.latitude || 6.9271,
          longitude: order.longitude || 79.8612
        }));

        setDrivers(driversData || []);
        setOrders(processedOrders || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription for driver locations
    const subscription = supabase
      .channel('driver-locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drivers',
      }, (payload) => {
        console.log('Driver location update:', payload);

        // Update the driver in the list
        setDrivers(currentDrivers => {
          const updatedDrivers = [...currentDrivers];
          const index = updatedDrivers.findIndex(d => d.id === payload.new.id);

          if (index !== -1) {
            updatedDrivers[index] = payload.new as Driver;
          } else if (payload.eventType === 'INSERT') {
            updatedDrivers.push(payload.new as Driver);
          }

          return updatedDrivers;
        });
      })
      .subscribe();

    // Set up real-time subscription for orders
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, async (payload) => {
        console.log('Order update:', payload);

        // Refresh orders when there's a change
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, customers(*)')
          .eq('status', 'pending')
          .is('driver_id', null);

        if (!ordersError) {
          const processedOrders = ordersData.map((order: any) => ({
            id: order.id,
            tracking_number: order.tracking_number,
            status: order.status,
            delivery_address: order.delivery_address,
            customer_name: order.customers?.name || 'Unknown',
            customer_phone: order.customers?.phone || 'Unknown',
            created_at: order.created_at,
            latitude: order.latitude || 6.9271,
            longitude: order.longitude || 79.8612
          }));

          setOrders(processedOrders || []);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      ordersSubscription.unsubscribe();
    };
  }, []);

  // Handle drag start for orders
  const handleDragStart = (order: Order) => {
    setIsDragging(true);
    draggedOrderRef.current = order;
  };

  // Handle drop on driver
  const handleDriverClick = (driver: Driver) => {
    if (isDragging && draggedOrderRef.current) {
      setSelectedDriver(driver);
      setSelectedOrder(draggedOrderRef.current);
      setIsAssignModalOpen(true);
      setIsDragging(false);
      draggedOrderRef.current = null;
    }
  };

  // Handle assignment confirmation
  const handleAssignmentConfirm = async () => {
    // Refresh orders after assignment
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, customers(*)')
        .eq('status', 'pending')
        .is('driver_id', null);

      if (!ordersError) {
        const processedOrders = ordersData.map((order: any) => ({
          id: order.id,
          tracking_number: order.tracking_number,
          status: order.status,
          delivery_address: order.delivery_address,
          customer_name: order.customers?.name || 'Unknown',
          customer_phone: order.customers?.phone || 'Unknown',
          created_at: order.created_at,
          latitude: order.latitude || 6.9271,
          longitude: order.longitude || 79.8612
        }));

        setOrders(processedOrders || []);
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
    }

    setIsAssignModalOpen(false);
    setSelectedDriver(null);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-3">
        <div className="bg-white rounded-lg shadow-md p-4 h-[600px]">
          <h2 className="text-lg font-semibold mb-4">Driver Map</h2>

          {/* Map Container */}
          <MapContainer
            center={[6.9271, 79.8612]}
            zoom={12}
            style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Driver Markers */}
            {drivers.map(driver => (
              <Marker
                key={driver.id}
                position={[driver.latitude, driver.longitude]}
                icon={markerIcon(driver.available ? '#22c55e' : '#f97316')}
                eventHandlers={{
                  click: () => handleDriverClick(driver)
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{driver.name}</p>
                    <p>{driver.phone}</p>
                    <p className={`${driver.available ? 'text-green-600' : 'text-orange-500'} font-medium`}>
                      {driver.available ? 'Available' : 'Busy'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Order Markers */}
            {orders.map(order => (
              <Marker
                key={order.id}
                position={[order.latitude || 6.9271, order.longitude || 79.8612]}
                icon={orderIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{order.tracking_number}</p>
                    <p>{order.customer_name}</p>
                    <p>{order.delivery_address}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Map Updater */}
            <MapUpdater drivers={drivers} />
          </MapContainer>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-lg shadow-md p-4 h-[600px] overflow-auto">
          <h2 className="text-lg font-semibold mb-4">Unassigned Orders</h2>

          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No unassigned orders
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow cursor-grab"
                  draggable
                  onDragStart={() => handleDragStart(order)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-blue-600">{order.tracking_number}</p>
                      <p className="text-sm">{order.customer_name}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{order.delivery_address}</p>
                  <p className="text-xs text-gray-500 mt-1">Created: {new Date(order.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        driver={selectedDriver}
        order={selectedOrder}
        onConfirm={handleAssignmentConfirm}
      />

      {/* Toast Container */}
      <ToastContainer position="bottom-right" />
    </div>
  );
}
