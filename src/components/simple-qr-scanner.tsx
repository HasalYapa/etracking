'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface SimpleQRScannerProps {
  onScan: (data: { trackingNumber: string; location: string; driverPhone?: string }) => void;
  onError?: (error: string) => void;
}

export default function SimpleQRScanner({ onScan, onError }: SimpleQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  // Initialize component
  useEffect(() => {
    mountedRef.current = true;
    
    // Get available cameras
    Html5Qrcode.getCameras()
      .then(devices => {
        if (!mountedRef.current) return;
        
        if (devices && devices.length) {
          const formattedDevices = devices.map(device => ({
            id: device.id,
            label: device.label || `Camera ${device.id}`
          }));
          setCameras(formattedDevices);
          setSelectedCamera(devices[0].id);
        } else {
          setError('No cameras found on this device');
          if (onError) onError('No cameras found on this device');
        }
      })
      .catch(err => {
        if (!mountedRef.current) return;
        
        console.error('Error getting cameras:', err);
        setError('Error accessing camera: ' + err.message);
        if (onError) onError('Error accessing camera: ' + err.message);
      });
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [onError]);

  // Parse QR code data
  const parseQRData = (data: string) => {
    try {
      const parts = data.split('|');
      
      if (parts.length >= 2) {
        const trackingNumber = parts[0];
        const location = parts[1];
        const driverPhone = parts.length > 2 ? parts[2] : undefined;
        
        return { trackingNumber, location, driverPhone };
      } else {
        throw new Error('Invalid QR code format');
      }
    } catch (err: any) {
      throw new Error('Error parsing QR code: ' + err.message);
    }
  };

  // Start scanning
  const startScanner = async () => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }
    
    try {
      setError(null);
      
      // Create a new scanner instance
      if (!scannerRef.current && containerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }
      
      if (!scannerRef.current) {
        throw new Error('Failed to initialize scanner');
      }
      
      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
            // Parse the QR code data
            const parsedData = parseQRData(decodedText);
            
            // Stop scanning after successful scan
            await stopScanner();
            
            // Call the onScan callback
            onScan(parsedData);
          } catch (err: any) {
            setError(err.message);
            if (onError) onError(err.message);
          }
        },
        (errorMessage) => {
          // This is just for QR detection errors, not critical
          console.log('QR scan error:', errorMessage);
        }
      );
      
      setIsScanning(true);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError('Error starting scanner: ' + err.message);
      if (onError) onError('Error starting scanner: ' + err.message);
    }
  };

  // Stop scanning
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
      
      {cameras.length > 0 && (
        <div className="w-full mb-4">
          <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Camera
          </label>
          <select
            id="camera-select"
            value={selectedCamera || ''}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isScanning}
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div 
        id="qr-reader" 
        ref={containerRef}
        className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden mb-4"
      >
        {!isScanning && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Camera preview will appear here</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="w-full p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="flex space-x-2">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
}
