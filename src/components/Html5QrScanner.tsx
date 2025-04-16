'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Html5QRScannerProps {
  onScan: (data: { trackingNumber: string; location: string; driverPhone?: string }) => void;
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
        const jsonData = JSON.parse(data);
        console.log('Parsed as JSON:', jsonData);
        if (jsonData.trackingNumber) {
          return {
            trackingNumber: jsonData.trackingNumber,
            location: jsonData.location || 'Unknown',
            driverPhone: jsonData.driverPhone
          };
        }
      } catch (jsonErr) {
        console.log('Not valid JSON, trying pipe format');
      }

      // Try pipe-delimited format
      const parts = data.split('|');

      if (parts.length >= 2) {
        const trackingNumber = parts[0];
        const location = parts[1];
        const driverPhone = parts.length > 2 ? parts[2] : undefined;

        console.log('Parsed as pipe-delimited:', { trackingNumber, location, driverPhone });
        return { trackingNumber, location, driverPhone };
      } else if (data.startsWith('ET-')) {
        // If it's just a tracking number
        console.log('Parsed as tracking number only:', data);
        return { trackingNumber: data, location: 'Scanned Location', driverPhone: undefined };
      } else {
        throw new Error('Invalid QR code format');
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

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      const scanner = scannerRef.current;
      const cameraId = facingMode === 'environment' ? { facingMode: 'environment' } : { facingMode: 'user' };

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
      setError('Error starting scanner: ' + err.message);
      setIsScanning(false);
      if (onError) onError('Error starting scanner: ' + err.message);
    }
  };

  // Stop scanning
  const stopScanner = async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    if (isScanning) {
      await stopScanner();
    }
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    if (isScanning) {
      setTimeout(startScanner, 500);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>

      <div id={scannerContainerId} className="w-full" style={{ minHeight: isScanning ? '300px' : 'auto' }}></div>

      {!isScanning ? (
        <div className="w-full flex flex-col items-center">
          <button
            onClick={startScanner}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
          >
            Start Scanning
          </button>
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Click Start Scanning to activate camera</p>
          </div>
        </div>
      ) : (
        <div className="w-full mt-4">
          <div className="flex justify-between">
            <button
              onClick={stopScanner}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Stop Scanning
            </button>
            <button
              onClick={toggleCamera}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Switch Camera
            </button>
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            {facingMode === 'environment' ? 'Using back camera' : 'Using front camera'}
          </div>
        </div>
      )}

      {error && (
        <div className="w-full p-3 mt-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="w-full mt-4 text-sm text-gray-500">
        <p>Position the QR code within the camera view for scanning.</p>
      </div>
    </div>
  );
}
