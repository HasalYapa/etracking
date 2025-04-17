'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Set default icon for all markers
L.Marker.prototype.options.icon = defaultIcon;

// Sri Lanka coordinates
const SRI_LANKA_CENTER = [7.8731, 80.7718];

export default function SimpleMapComponent() {
  const [drivers, setDrivers] = useState([
    { id: 1, name: 'Driver 1', position: [6.9271, 79.8612], available: true },
    { id: 2, name: 'Driver 2', position: [6.9000, 79.8700], available: false },
    { id: 3, name: 'Driver 3', position: [6.9500, 79.8500], available: true }
  ]);

  const [orders, setOrders] = useState([
    { id: 1, tracking: 'ET12345', position: [6.9300, 79.8400], customer: 'John Doe' },
    { id: 2, tracking: 'ET12346', position: [6.9100, 79.8800], customer: 'Jane Smith' }
  ]);

  return (
    <MapContainer 
      center={SRI_LANKA_CENTER} 
      zoom={8} 
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Driver Markers */}
      {drivers.map(driver => (
        <Marker 
          key={driver.id} 
          position={driver.position as [number, number]}
          icon={L.divIcon({
            className: 'custom-marker-icon',
            html: `<div style="background-color: ${driver.available ? 'green' : 'orange'}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">D</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        >
          <Popup>
            <div>
              <h3 className="font-bold">{driver.name}</h3>
              <p className={driver.available ? 'text-green-600' : 'text-orange-500'}>
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
          position={order.position as [number, number]}
          icon={L.divIcon({
            className: 'custom-order-icon',
            html: `<div style="background-color: #ff6b6b; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">O</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        >
          <Popup>
            <div>
              <h3 className="font-bold">{order.tracking}</h3>
              <p>Customer: {order.customer}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
