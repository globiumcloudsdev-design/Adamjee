// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import { Html5Qrcode } from 'html5-qrcode';
// import { Camera, RefreshCw, Flashlight, FlashlightOff } from 'lucide-react';
// import { Button } from './ui/button';
// import { toast } from 'sonner';
// import Modal from './ui/modal';

// export default function QRScanner({ onScan, onClose }) {
//   const scannerRef = useRef(null);
//   const [isScanning, setIsScanning] = useState(false);
//   const [cameraId, setCameraId] = useState('');
//   const [cameras, setCameras] = useState([]);
//   const [flashOn, setFlashOn] = useState(false);
//   const [lastScanned, setLastScanned] = useState('');
//   const scannerContainerId = 'html5qr-scanner-container';

//   useEffect(() => {
//     // Get available cameras
//     const getCameras = async () => {
//       try {
//         const devices = await Html5Qrcode.getCameras();
//         if (devices && devices.length) {
//           setCameras(devices);
//           // Auto-select rear camera if available
//           const rearCamera = devices.find(
//             d => d.label.toLowerCase().includes('back') || 
//                  d.label.toLowerCase().includes('rear') ||
//                  d.label.toLowerCase().includes('environment')
//           );
//           setCameraId(rearCamera ? rearCamera.id : devices[0].id);
//         } else {
//           // Fallback: try enumerateDevices
//           const enumerated = await navigator.mediaDevices.enumerateDevices();
//           const videoInputs = enumerated.filter(d => d.kind === 'videoinput');
//           if (videoInputs.length) {
//             setCameras(videoInputs.map((d, i) => ({ id: d.deviceId, label: d.label || `Camera ${i+1}` })));
//             setCameraId(videoInputs[0].deviceId);
//           } else {
//             toast.error('No camera found on this device');
//           }
//         }
//       } catch (error) {
//         console.error('Camera error:', error);
//         toast.error('Could not access camera. Please check permissions and ensure site is served over HTTPS.');
//       }
//     };

//     getCameras();

//     return () => {
//       stopScanner();
//     };
//   }, []);

//   // Start scanner when cameraId changes
//   useEffect(() => {
//     if (cameraId) {
//       // Small delay to ensure DOM is ready
//       setTimeout(() => {
//         startScanner();
//       }, 100);
//     }
//   }, [cameraId]);

//   // Track camera permission state (if supported) to provide helpful messages
//   const [permissionState, setPermissionState] = useState(null);
//   useEffect(() => {
//     let mounted = true;
//     const checkPerm = async () => {
//       try {
//         if (navigator.permissions && navigator.permissions.query) {
//           const status = await navigator.permissions.query({ name: 'camera' });
//           if (mounted) setPermissionState(status.state);
//           status.onchange = () => setPermissionState(status.state);
//         }
//       } catch (e) {
//         // ignore - not all browsers support camera permission query
//       }
//     };
//     checkPerm();
//     return () => { mounted = false; };
//   }, []);

//   const startScanner = async () => {
//     if (!cameraId) return;

//     // Stop any existing scanner
//     if (scannerRef.current) {
//       await stopScanner();
//     }

//     const boxSize = Math.min(400, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.8));
//     const config = {
//       fps: 30,
//       qrbox: { width: boxSize, height: boxSize },
//       aspectRatio: 1.0,
//       disableFlip: false,
//       experimentalFeatures: {
//         useBarCodeDetectorIfSupported: true
//       }
//     };

//     const html5Qr = new Html5Qrcode(scannerContainerId);
//     scannerRef.current = html5Qr;

//     const onSuccess = (decodedText, decodedResult) => {
//       if (lastScanned === decodedText) return;
//       setLastScanned(decodedText);
//       setTimeout(() => setLastScanned(''), 2000);

//       let data;
//       try {
//         data = JSON.parse(decodedText);
//       } catch (e) {
//         data = { raw: decodedText };
//       }

//       if (onScan) onScan(data);
//       console.log('Scanned Data:', data);
//       toast.success('✓ QR Code scanned successfully!');
//       if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
//     };

//     const onError = (err) => {
//       // Most errors are non-fatal scanning updates
//       console.debug('Scan error:', err?.message || err);
//     };

//     // Try to start scanner with the selected camera
//     html5Qr.start(
//       { deviceId: { exact: cameraId } },
//       config,
//       onSuccess,
//       onError
//     ).then(() => {
//       setIsScanning(true);
//     }).catch(async (err) => {
//       console.error('Failed to start scanner:', err);
//       toast.error(`Scanner error: ${err.message || err}`);

//       // try fallback using facingMode environment
//       try {
//         await html5Qr.stop().catch(() => {});
//         await html5Qr.clear().catch(() => {});
//         await html5Qr.start({ facingMode: 'environment' }, config, onSuccess, onError);
//         setIsScanning(true);
//       } catch (fallbackErr) {
//         console.error('Fallback failed:', fallbackErr);
//         toast.error('Cannot access any camera. Please check browser permissions and HTTPS.');
//         try { html5Qr.stop(); } catch(e){}
//       }
//     });
//   };

//   const stopScanner = async () => {
//     if (scannerRef.current) {
//       try {
//         if (scannerRef.current.isScanning) {
//           await scannerRef.current.stop();
//         }
//         await scannerRef.current.clear();
//         console.log('Scanner cleared');
//       } catch (err) {
//         console.error('Error clearing scanner:', err);
//       }
//       scannerRef.current = null;
//     }
//     setIsScanning(false);
//   };

//   const switchCamera = () => {
//     if (cameras.length > 1) {
//       const currentIndex = cameras.findIndex(cam => cam.id === cameraId);
//       const nextIndex = (currentIndex + 1) % cameras.length;
//       const nextCamera = cameras[nextIndex];
      
//       toast.info(`Switching to ${nextCamera.label || `Camera ${nextIndex + 1}`}`);
//       setCameraId(nextCamera.id);
//     } else {
//       toast.info('Only one camera available');
//     }
//   };

//   const toggleFlash = () => {
//     setFlashOn(!flashOn);
//     toast.info(flashOn ? 'Flash turned off' : 'Flash turned on');
//     // Note: Flash control requires additional implementation
//     // Can be added using browser-specific APIs
//   };

//   const handleClose = () => {
//     stopScanner();
//     if (onClose) onClose();
//   };

//   return (
//     <Modal
//       open={true}
//       onClose={handleClose}
//       title="Scan QR Code"
//       size="xl"
//       className="max-w-none w-full h-[calc(100vh-4rem)]"
//       footer={
//         <div className="flex justify-between items-center w-full">
//           <div className="flex items-center gap-2">
//             <div className={`h-2 w-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
//             <span className="text-sm text-gray-600 dark:text-gray-400">
//               {isScanning ? 'Scanning...' : 'Ready'}
//             </span>
//           </div>
          
//           <div className="flex gap-2">
//             {cameras.length > 1 && (
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={switchCamera}
//                 disabled={!isScanning}
//                 className="gap-1"
//               >
//                 <RefreshCw className="h-3.5 w-3.5" />
//                 Switch
//               </Button>
//             )}
            
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={toggleFlash}
//               disabled={!isScanning}
//               className="gap-1"
//             >
//               {flashOn ? (
//                 <FlashlightOff className="h-3.5 w-3.5" />
//               ) : (
//                 <Flashlight className="h-3.5 w-3.5" />
//               )}
//               Flash
//             </Button>
            
//             <Button 
//               onClick={handleClose}
//               variant="default"
//             >
//               Close
//             </Button>
//           </div>
//         </div>
//       }
//     >
//       <div className="space-y-4">
//         {/* Camera selection dropdown */}
//         {cameras.length > 0 && (
//           <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
//             <label className="block text-sm font-medium mb-2">
//               Select Camera:
//             </label>
//             <select
//               value={cameraId}
//               onChange={(e) => setCameraId(e.target.value)}
//               className="w-full p-2 border rounded-md bg-white dark:bg-gray-900"
//             >
//               {cameras.map((cam, index) => (
//                 <option key={cam.id} value={cam.id}>
//                   {cam.label || `Camera ${index + 1}`}
//                 </option>
//               ))}
//             </select>
//           </div>
//         )}

//         {/* Scanner container */}
//         <div className="relative bg-black rounded-lg overflow-hidden w-full h-full">
//           {/* Scanner will be rendered here */}
//           <div 
//             id={scannerContainerId} 
//             className="w-full h-full"
//           />
          
//           {/* Overlay frame */}
//           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//             <div className="relative">
//               {/* Scanner frame */}
//               <div className="w-64 h-64">
//                 {/* Outer frame */}
//                 <div className="absolute inset-0 border-2 border-white/30 rounded-lg" />
                
//                 {/* Corner indicators */}
//                 <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl" />
//                 <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-tr" />
//                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-400 rounded-bl" />
//                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br" />
                
//                 {/* Scanning line */}
//                 {isScanning && (
//                   <div className="absolute top-0 left-0 right-0">
//                     <div className="h-0.5 bg-green-400 animate-[scan_2s_ease-in-out_infinite]" />
//                   </div>
//                 )}
//               </div>
              
//               {/* Instructions */}
//               <div className="mt-4 text-center">
//                 <p className="text-white font-medium text-lg">Align QR Code</p>
//                 <p className="text-gray-300 text-sm mt-1">
//                   Position within the frame
//                 </p>
//               </div>
//             </div>
//           </div>
          
//           {/* Loading indicator */}
//           {!isScanning && cameraId && (
//             <div className="absolute inset-0 flex items-center justify-center bg-black/50">
//               <div className="text-center">
//                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
//                 <p className="text-white">Starting scanner...</p>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Instructions panel */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
//             <div className="flex items-start mb-2">
//               <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-2 mr-3">
//                 <Camera className="h-4 w-4 text-blue-600 dark:text-blue-300" />
//               </div>
//               <div>
//                 <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
//                   How to Scan
//                 </h4>
//                 <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
//                   <li>• Hold device steady</li>
//                   <li>• Ensure good lighting</li>
//                   <li>• Fill the frame with QR code</li>
//                   <li>• Auto-detects in 1-2 seconds</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
//             <div className="flex items-start">
//               <div className="bg-green-100 dark:bg-green-800 rounded-full p-2 mr-3">
//                 <div className="h-4 w-4 flex items-center justify-center">
//                   <span className="text-xs font-bold text-green-600 dark:text-green-300">✓</span>
//                 </div>
//               </div>
//               <div>
//                 <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
//                   Success Tips
//                 </h4>
//                 <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
//                   <li>• Clean camera lens</li>
//                   <li>• Avoid glare and shadows</li>
//                   <li>• Hold 15-30 cm away</li>
//                   <li>• Use rear camera for best results</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Status bar */}
//         <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
//           <span>Cameras detected: {cameras.length}</span>
//           <span>Scanner: {isScanning ? 'Active' : 'Inactive'}</span>
//           <span>Permission: {permissionState || 'unknown'}</span>
//         </div>
//       </div>
//     </Modal>
//   );
// }



'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import Modal from './ui/modal';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraId, setCameraId] = useState('');
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const scannerContainerId = 'qr-scanner-container';

  useEffect(() => {
    initializeScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const initializeScanner = async () => {
    try {
      setLoading(true);
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length > 0) {
        setCameras(devices);
        
        // Auto-select rear camera
        const rearCamera = devices.find(cam => 
          cam.label.toLowerCase().includes('back') || 
          cam.label.toLowerCase().includes('rear')
        );
        
        setCameraId(rearCamera ? rearCamera.id : devices[0].id);
      } else {
        toast.error('No camera found');
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      toast.error('Failed to access camera');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cameraId && !loading) {
      startScanner();
    }
  }, [cameraId, loading]);

  const startScanner = async () => {
    if (!cameraId || scannerRef.current) return;
    
    try {
      await stopScanner();
      
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };
      
      const onScanSuccess = (decodedText) => {
        console.log('QR Code detected:', decodedText);
        
        let parsedData;
        try {
          parsedData = JSON.parse(decodedText);
        } catch (e) {
          parsedData = { registrationNumber: decodedText };
        }
        
        if (onScan) {
          onScan(parsedData);
        }
        
        toast.success('✓ QR Code scanned!');
        if (navigator.vibrate) navigator.vibrate(100);
      };
      
      await html5QrCode.start(
        { deviceId: cameraId },
        config,
        onScanSuccess,
        (error) => {
          // Ignore most scanning errors
          console.debug('Scanning...', error.message);
        }
      );
      
      setIsScanning(true);
    } catch (error) {
      console.error('Scanner start error:', error);
      toast.error(`Scanner error: ${error.message}`);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (error) {
        console.error('Stop scanner error:', error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const switchCamera = () => {
    if (cameras.length > 1) {
      const currentIndex = cameras.findIndex(cam => cam.id === cameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setCameraId(cameras[nextIndex].id);
    }
  };

  const handleClose = () => {
    stopScanner();
    if (onClose) onClose();
  };

  return (
    <Modal
      open={true}
      onClose={handleClose}
      title="Scan QR Code"
      size="sm"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm">
              {loading ? 'Initializing...' : isScanning ? 'Scanning...' : 'Ready'}
            </span>
          </div>
          
          <div className="flex gap-2">
            {cameras.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchCamera}
                disabled={!isScanning}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Switch Camera
              </Button>
            )}
            <Button onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Camera selection */}
        {cameras.length > 0 && !loading && (
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <label className="block text-sm font-medium mb-2">
              Select Camera:
            </label>
            <select
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-900"
            >
              {cameras.map((cam, index) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scanner container */}
        <div className="relative bg-black rounded-lg overflow-hidden min-h-[400px]">
          <div 
            id={scannerContainerId} 
            className="w-full h-full"
          />
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="w-64 h-64 border-2 border-green-400 rounded-lg relative">
                {/* Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br" />
                
                {/* Scanning line */}
                {isScanning && (
                  <div className="absolute top-0 left-0 right-0">
                    <div className="h-1 bg-green-400 animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-white font-medium">Align QR Code</p>
                <p className="text-gray-300 text-sm">Position within frame</p>
              </div>
            </div>
          </div>
          
          {/* Loading state */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
                <p className="text-white">Loading scanner...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-2 mr-3">
              <Camera className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                How to Scan
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Hold steady, 15-30 cm from QR code</li>
                <li>• Ensure good lighting</li>
                <li>• Keep QR code within the frame</li>
                <li>• Success will trigger vibration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}