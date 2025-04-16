'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScan: (data: { trackingNumber: string; location: string; driverPhone?: string }) => void;
  onError?: (error: string) => void;
}

export default function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Generate a unique ID for this scanner instance to avoid conflicts with multiple scanners
  const scannerContainerId = useRef(`qr-scanner-container-${Math.random().toString(36).substring(2, 11)}`).current;

  // Initialize scanner when component mounts
  useEffect(() => {
    // Wait for the DOM to be fully rendered
    const initializeScanner = () => {
      try {
        // Check if the container exists
        const container = document.getElementById(scannerContainerId);
        if (!container) {
          console.error('Scanner container not found');
          return;
        }

        // Create scanner instance
        scannerRef.current = new Html5Qrcode(scannerContainerId);

        // Get available cameras
        Html5Qrcode.getCameras()
          .then(devices => {
            if (devices && devices.length) {
              setAvailableCameras(devices.map(device => ({
                id: device.id,
                label: device.label || `Camera ${device.id}`
              })));
              setSelectedCamera(devices[0].id);
            } else {
              setScanError('No cameras found on this device');
              if (onError) onError('No cameras found on this device');
            }
          })
          .catch(err => {
            setScanError('Error accessing camera: ' + err.message);
            if (onError) onError('Error accessing camera: ' + err.message);
          });
      } catch (err: any) {
        console.error('Error initializing scanner:', err);
        setScanError('Error initializing scanner: ' + err.message);
      }
    };

    // Initialize after a short delay to ensure DOM is ready
    const timerId = setTimeout(initializeScanner, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timerId);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
          }
          // Clear the scanner container
          const container = document.getElementById(scannerContainerId);
          if (container) {
            while (container.firstChild) {
              container.removeChild(container.firstChild);
            }
          }
        } catch (err) {
          console.error('Error cleaning up scanner:', err);
        }
      }
    };
  }, [onError, scannerContainerId]);

  // Start scanning
  const startScanner = async () => {
    if (!scannerRef.current || !selectedCamera) return;

    setIsScanning(true);
    setScanError(null);

    try {
      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          // Handle successful scan
          handleScan(decodedText);
        },
        (errorMessage) => {
          // QR code scan error (not critical, just means no QR code found yet)
          console.log('QR scan error:', errorMessage);
        }
      );
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setScanError('Error starting scanner: ' + err.message);
      setIsScanning(false);
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
        setIsScanning(false);
      } catch (err: any) {
        console.error('Error stopping scanner:', err);
        // Even if there's an error, we should update the UI state
        setIsScanning(false);
      }
    }
  };

  // Handle successful scan
  const handleScan = (data: string) => {
    try {
      console.log('QR code scanned successfully:', data);
      // Parse QR code data
      const parts = data.split('|');

      if (parts.length >= 2) {
        const trackingNumber = parts[0];
        const location = parts[1];
        const driverPhone = parts.length > 2 ? parts[2] : undefined;

        console.log('Parsed QR data:', { trackingNumber, location, driverPhone });

        // Stop scanning after successful scan
        stopScanner();

        // Call the onScan callback with parsed data
        onScan({ trackingNumber, location, driverPhone });
      } else {
        setScanError('Invalid QR code format');
        if (onError) onError('Invalid QR code format');
      }
    } catch (err: any) {
      setScanError('Error parsing QR code: ' + err.message);
      if (onError) onError('Error parsing QR code: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Scan Tracking QR Code</h3>

      {availableCameras.length > 0 && (
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
            {availableCameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        id={scannerContainerId}
        className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden mb-4"
      >
        {!isScanning && !scanError && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Camera preview will appear here</p>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mb-2">
        {isScanning ? 'Scanner active - position QR code in view' : 'Click Start Scanning to activate camera'}
      </div>

      {scanError && (
        <div className="w-full p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {scanError}
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
