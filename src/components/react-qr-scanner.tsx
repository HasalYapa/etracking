'use client';

import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

interface ReactQRScannerProps {
  onScan: (data: { trackingNumber: string; location: string; driverPhone?: string }) => void;
  onError?: (error: string) => void;
}

export default function ReactQRScanner({ onScan, onError }: ReactQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

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

  // Handle scan result
  const handleScan = (result: any) => {
    if (result) {
      try {
        console.log('QR code scanned:', result);
        const data = result?.text;

        if (data) {
          const parsedData = parseQRData(data);
          setIsScanning(false);
          onScan(parsedData);
        }
      } catch (err: any) {
        console.error('Error processing scan result:', err);
        setError(err.message);
        if (onError) onError(err.message);
      }
    }
  };

  // Handle scan error
  const handleError = (err: any) => {
    console.error('QR Scan error:', err);
    setError('Error scanning QR code: ' + (err?.message || 'Unknown error'));
    if (onError) onError('Error scanning QR code: ' + (err?.message || 'Unknown error'));
  };

  // Toggle camera
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>

      {!isScanning ? (
        <div className="w-full flex flex-col items-center">
          <button
            onClick={() => setIsScanning(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
          >
            Start Scanning
          </button>
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Click Start Scanning to activate camera</p>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div className="relative">
            <QrReader
              constraints={{
                facingMode
              }}
              onResult={handleScan}
              scanDelay={500}
              videoStyle={{ width: '100%', height: '250px' }}
              videoContainerStyle={{ width: '100%', height: '250px', borderRadius: '0.5rem', overflow: 'hidden' }}
              videoId="qr-reader-video"
            />
            <div className="absolute top-2 right-2">
              <button
                onClick={toggleCamera}
                className="p-2 bg-white rounded-full shadow-md"
                title="Switch Camera"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setIsScanning(false)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Stop Scanning
            </button>
            <div className="text-sm text-gray-500">
              {facingMode === 'environment' ? 'Using back camera' : 'Using front camera'}
            </div>
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
