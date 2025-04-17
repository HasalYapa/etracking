'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Html5QRScannerProps {
  onScan: (data: { trackingNumber: string; location: string; driverPhone?: string; orderId?: string }) => void;
  onError?: (error: string) => void;
}

export default function Html5QRScanner({ onScan, onError }: Html5QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'html5-qr-code-scanner';

  // Parse QR code data
  const parseQRData = (data: string) => {
    try {
      console.log('Parsing QR data:', data);

      // Try to parse as JSON first
      try {
        // Clean up the data if it has any leading/trailing whitespace or quotes
        const cleanData = data.trim().replace(/^['"]|['"]$/g, '');
        console.log('Cleaned QR data:', cleanData);

        const jsonData = JSON.parse(cleanData);
        console.log('Parsed as JSON:', jsonData);

        // Check for different JSON formats
        if (jsonData.trackingNumber) {
          return {
            trackingNumber: jsonData.trackingNumber,
            location: jsonData.location || 'Unknown',
            driverPhone: jsonData.driverPhone
          };
        } else if (jsonData.tracking_number) {
          // Handle shop QR code format
          console.log('Found tracking_number in JSON:', jsonData.tracking_number);
          return {
            trackingNumber: jsonData.tracking_number,
            location: jsonData.delivery_address || jsonData.location || 'Unknown',
            driverPhone: undefined
          };
        } else if (jsonData.order_id) {
          // Another possible format
          console.log('Found order_id in JSON:', jsonData.order_id);
          return {
            trackingNumber: jsonData.order_id,
            location: jsonData.delivery_address || jsonData.location || 'Unknown',
            driverPhone: undefined
          };
        } else {
          // If we have JSON but no recognized fields, log all keys
          console.log('JSON format not recognized. Available keys:', Object.keys(jsonData));

          // Try to find any key that might be a tracking number
          const possibleTrackingKeys = ['id', 'tracking', 'track', 'number', 'orderNumber', 'order_number'];
          for (const key of possibleTrackingKeys) {
            if (jsonData[key]) {
              console.log(`Found possible tracking number in key '${key}':`, jsonData[key]);
              return {
                trackingNumber: jsonData[key],
                location: jsonData.delivery_address || jsonData.location || 'Unknown',
                driverPhone: undefined
              };
            }
          }

          // Last resort: use the first string value we find
          for (const key in jsonData) {
            if (typeof jsonData[key] === 'string' && jsonData[key].length > 0) {
              console.log(`Using value from key '${key}' as tracking number:`, jsonData[key]);
              return {
                trackingNumber: jsonData[key],
                location: 'Unknown',
                driverPhone: undefined
              };
            }
          }
        }
      } catch (jsonErr) {
        console.log('Not valid JSON, trying other formats:', jsonErr);
      }

      // Try pipe-delimited format (our preferred format)
      try {
        const cleanData = data.trim();
        console.log('Trying pipe-delimited format with:', cleanData);
        const parts = cleanData.split('|');

        if (parts.length >= 2) {
          const trackingNumber = parts[0].trim();
          const location = parts[1].trim();
          const orderId = parts.length > 2 ? parts[2].trim() : undefined;

          console.log('Successfully parsed as pipe-delimited:', { trackingNumber, location, orderId });
          return {
            trackingNumber,
            location,
            driverPhone: undefined,
            orderId // Store the order ID if available
          };
        }
      } catch (pipeErr) {
        console.log('Error parsing pipe-delimited format:', pipeErr);
      }

      // Try tracking number only format
      if (data.startsWith('ET')) {
        // If it's just a tracking number (note: removed hyphen requirement)
        console.log('Parsed as tracking number only:', data);
        return { trackingNumber: data, location: 'Scanned Location', driverPhone: undefined };
      } else {
        // Last resort - try to use the raw data
        console.log('Using raw data as tracking number:', data);
        return { trackingNumber: data, location: 'Unknown Location', driverPhone: undefined };
      }
    } catch (err: any) {
      console.error('Error parsing QR code:', err);
      throw new Error('Error parsing QR code: ' + err.message);
    }
  };

  // Start scanning
  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Make sure the scanner container exists
      const container = document.getElementById(scannerContainerId);
      if (!container) {
        throw new Error('Scanner container not found');
      }

      // Make sure we have a scanner instance
      if (!scannerRef.current) {
        console.log('Creating new scanner instance');
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      } else {
        // If scanner is already running, stop it first
        try {
          if (isScanning) {
            console.log('Stopping existing scanner before restarting');
            await scannerRef.current.stop();
          }
        } catch (e) {
          console.log('Error stopping previous scanner instance:', e);
        }
      }

      const scanner = scannerRef.current;

      // Get available cameras
      try {
        console.log('Requesting camera permissions...');
        const devices = await Html5Qrcode.getCameras();
        console.log('Available cameras:', devices);

        if (devices && devices.length > 0) {
          // Use the first camera by default or based on facing mode preference
          let selectedCamera;

          if (facingMode === 'environment') {
            // Try to find a back camera first
            const backCamera = devices.find(device =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment'));

            selectedCamera = backCamera || devices[0];
          } else {
            // Try to find a front camera
            const frontCamera = devices.find(device =>
              device.label.toLowerCase().includes('front') ||
              device.label.toLowerCase().includes('user'));

            selectedCamera = frontCamera || devices[0];
          }

          console.log('Selected camera:', selectedCamera);

          await scanner.start(
            selectedCamera.id,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              try {
                console.log('QR code scanned:', decodedText);
                const parsedData = parseQRData(decodedText);
                onScan(parsedData);
                stopScanner();
              } catch (err: any) {
                console.error('Error processing scan result:', err);
                setError(err.message);
                if (onError) onError(err.message);
              }
            },
            (errorMessage) => {
              // This callback is called for non-fatal errors, so we don't need to handle them
              console.log('QR scan non-fatal error:', errorMessage);
            }
          );
          return;
        }
      } catch (cameraErr) {
        console.error('Error getting cameras:', cameraErr);
        // Fall back to facingMode approach
      }

      // Fallback to facingMode approach if camera enumeration fails
      const cameraId = facingMode === 'environment' ? { facingMode: 'environment' } : { facingMode: 'user' };
      console.log('Using facingMode fallback:', facingMode);

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          try {
            console.log('QR code scanned:', decodedText);
            const parsedData = parseQRData(decodedText);
            onScan(parsedData);
            stopScanner();
          } catch (err: any) {
            console.error('Error processing scan result:', err);
            setError(err.message);
            if (onError) onError(err.message);
          }
        },
        (errorMessage) => {
          // This callback is called for non-fatal errors, so we don't need to handle them
          console.log('QR scan non-fatal error:', errorMessage);
        }
      );
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      const errorMessage = err.message || 'Unknown error';
      setError('Error starting scanner: ' + errorMessage);
      setIsScanning(false);
      if (onError) onError('Error starting scanner: ' + errorMessage);
    }
  };

  // Stop scanning
  const stopScanner = async () => {
    try {
      console.log('Attempting to stop scanner...');
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          console.log('Scanner stopped successfully');
        } catch (stopErr) {
          console.log('Error stopping scanner, may not have been running:', stopErr);
        }
      } else {
        console.log('No scanner instance to stop');
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    try {
      console.log('Toggling camera from', facingMode, 'to', facingMode === 'environment' ? 'user' : 'environment');

      // First stop the scanner
      if (isScanning) {
        console.log('Stopping scanner before toggling camera');
        await stopScanner();
      }

      // Change the facing mode
      setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');

      // Restart the scanner after a delay
      console.log('Restarting scanner with new camera in 500ms');
      setTimeout(() => {
        if (!isScanning) {
          console.log('Starting scanner with new camera');
          startScanner();
        }
      }, 500);
    } catch (err) {
      console.error('Error toggling camera:', err);
      setError('Error switching camera. Please try again.');
    }
  };

  // Initialize scanner when component mounts
  useEffect(() => {
    // Create a scanner instance when the component mounts
    scannerRef.current = new Html5Qrcode(scannerContainerId);

    // Clean up on unmount
    return () => {
      console.log('Component unmounting, cleaning up scanner...');
      if (scannerRef.current) {
        try {
          if (isScanning) {
            scannerRef.current.stop().catch(err => {
              console.error('Error stopping scanner during cleanup:', err);
            });
          }
        } catch (err) {
          console.error('Error during scanner cleanup:', err);
        } finally {
          scannerRef.current = null;
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>

      <div id={scannerContainerId} className="w-full" style={{ minHeight: isScanning ? '300px' : 'auto' }}></div>

      {!isScanning ? (
        <div className="w-full flex flex-col items-center">
          <button
            onClick={startScanner}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4 font-medium shadow-sm"
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Start Scanning
            </div>
          </button>
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-gray-500">Click Start Scanning to activate camera</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full mt-4">
          <div className="flex justify-between gap-2">
            <button
              onClick={stopScanner}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Stop Scanning
            </button>
            <button
              onClick={toggleCamera}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Switch Camera
            </button>
          </div>
          <div className="mt-2 text-center text-sm font-medium text-blue-600 bg-blue-50 py-1 px-2 rounded-lg">
            {facingMode === 'environment' ? 'Using back camera' : 'Using front camera'}
          </div>
        </div>
      )}

      {error && (
        <div className="w-full p-3 mt-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="w-full mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Position the QR code within the camera view for scanning. Make sure there is good lighting and hold the camera steady.</p>
        </div>
      </div>
    </div>
  );
}
