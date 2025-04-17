'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  trackingNumber: string;
  location?: string;
  size?: number;
  includeDriverInfo?: boolean;
  driverPhone?: string;
}

export default function QRCodeGenerator({
  trackingNumber,
  location = '',
  size = 200,
  includeDriverInfo = false,
  driverPhone = '',
}: QRCodeGeneratorProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Create QR code data
  // Format: JSON with all necessary information
  // This format must match what the scanner expects
  const qrData = JSON.stringify({
    trackingNumber,
    location,
    driverPhone: includeDriverInfo ? driverPhone : undefined,
    timestamp: new Date().toISOString(),
    // Include the shop ID if available from localStorage
    shopId: typeof window !== 'undefined' ? localStorage.getItem('currentShopId') : undefined
  });

  // Function to download QR code as image
  const downloadQRCode = () => {
    try {
      const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
      if (canvas) {
        const pngUrl = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream');
        setDownloadUrl(pngUrl);

        // Create a temporary link and trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `tracking-${trackingNumber}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    } catch (err) {
      console.error('Error downloading QR code:', err);
    }
  };

  // Function to print QR code
  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
      if (canvas) {
        const pngUrl = canvas.toDataURL('image/png');

        printWindow.document.write(`
          <html>
            <head>
              <title>Print QR Code - ${trackingNumber}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  text-align: center;
                  padding: 20px;
                }
                .container {
                  max-width: 400px;
                  margin: 0 auto;
                  border: 1px solid #ccc;
                  padding: 20px;
                }
                .qr-image {
                  width: 200px;
                  height: 200px;
                  margin: 0 auto;
                }
                .tracking-info {
                  margin-top: 20px;
                  font-size: 14px;
                }
                .tracking-number {
                  font-weight: bold;
                  font-size: 16px;
                  margin-bottom: 5px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="tracking-number">Tracking #: ${trackingNumber}</div>
                <img src="${pngUrl}" class="qr-image" />
                <div class="tracking-info">
                  <p>Scan this QR code to update delivery status</p>
                  ${location ? `<p>Dispatch Location: ${location}</p>` : ''}
                  ${driverPhone ? `<p>Driver Contact: ${driverPhone}</p>` : ''}
                </div>
              </div>
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  // Function to share QR code
  const shareQRCode = async () => {
    try {
      const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
      if (canvas && navigator.share) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `tracking-${trackingNumber}.png`, { type: 'image/png' });

            await navigator.share({
              title: `Tracking QR Code - ${trackingNumber}`,
              text: `Tracking QR Code for order ${trackingNumber}`,
              files: [file]
            });
          }
        });
      } else {
        alert('Web Share API is not supported in your browser');
      }
    } catch (err) {
      console.error('Error sharing QR code:', err);
    }
  };

  // Check if trackingNumber is valid
  React.useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (!trackingNumber) {
      setError('No tracking number provided');
      setIsLoading(false);
      return;
    }

    // Simulate a small delay to ensure the component mounts properly
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [trackingNumber]);

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Tracking QR Code</h3>

      {isLoading ? (
        <div className="flex justify-center items-center h-[200px] w-[200px] border-2 border-gray-200 rounded-lg p-2 mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-[200px] w-[200px] border-2 border-red-200 rounded-lg p-2 mb-4 bg-red-50">
          <p className="text-red-500 text-sm text-center">{error}</p>
        </div>
      ) : (
        <div className="border-2 border-gray-200 rounded-lg p-2 mb-4">
          <QRCodeSVG
            id="qr-code"
            value={qrData}
            size={size}
            level="H"
            includeMargin={true}
            bgColor={"#FFFFFF"}
            fgColor={"#000000"}
          />
        </div>
      )}

      <div className="text-sm text-gray-600 mb-4">
        <p><strong>Tracking #:</strong> {trackingNumber}</p>
        {location && <p><strong>Location:</strong> {location}</p>}
        {includeDriverInfo && driverPhone && (
          <p><strong>Driver Contact:</strong> {driverPhone}</p>
        )}
      </div>

      {!isLoading && !error && (
        <div className="flex space-x-2">
          <button
            onClick={downloadQRCode}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Download
          </button>
          <button
            onClick={printQRCode}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Print
          </button>
          {navigator.share && (
            <button
              onClick={shareQRCode}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              Share
            </button>
          )}
        </div>
      )}
    </div>
  );
}
