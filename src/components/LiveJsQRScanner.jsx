import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

/**
 * LiveJsQRScanner
 * Props:
 * - onDetected(textOrObject) : required callback when a QR is detected
 * - continuous (boolean) : keep scanning after detection (default true)
 * - autoStart (boolean) : start camera automatically on mount (default true)
 * - beep (boolean) : play short beep on detection (default true)
 * - vibrate (boolean) : vibrate on detection (default true)
 * - processWidth/processHeight : canvas processing size (defaults 640x480)
 * - facingMode : preferred facingMode string (default 'environment')
 */
export default function LiveJsQRScanner({
  onDetected,
  continuous = true,
  autoStart = true,
  beep = true,
  vibrate = true,
  processWidth = 640,
  processHeight = 480,
  facingMode = 'environment',
  className = '',
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const trackRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [supportsZoom, setSupportsZoom] = useState(false);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1, step: 0.1 });
  const [zoomValue, setZoomValue] = useState(1);

  // Debounce / de-duplication
  const lastRef = useRef({ text: null, ts: 0 });
  const DUPLICATE_TTL = 1500; // ms to ignore identical scans

  useEffect(() => {
    if (autoStart) startStream();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startStream = async () => {
    setError(null);
    try {
      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: Math.max(processWidth, 1280) },
          height: { ideal: Math.max(processHeight, 720) },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      // zoom
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities && typeof capabilities.zoom !== 'undefined') {
        setSupportsZoom(true);
        setZoomRange({
          min: capabilities.zoom.min || 1,
          max: capabilities.zoom.max || 1,
          step: capabilities.zoom.step || 0.1,
        });
        setZoomValue(capabilities.zoom.min || 1);
        try { await track.applyConstraints({ advanced: [{ zoom: capabilities.zoom.min }] }); } catch(e) {}
      } else {
        setSupportsZoom(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
      }

      setScanning(true);
      tick();
    } catch (err) {
      console.error('Camera error', err);
      setError(err.message || String(err));
      setScanning(false);
    }
  };

  const stopStream = () => {
    try { if (rafRef.current) cancelAnimationFrame(rafRef.current); } catch(e){}
    try { if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; } } catch(e){}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    trackRef.current = null;
    setScanning(false);
  };

  const setTrackZoom = async (v) => {
    const t = trackRef.current;
    if (!t) return;
    try {
      await t.applyConstraints({ advanced: [{ zoom: v }] });
      setZoomValue(v);
    } catch (err) {
      console.warn('Zoom apply failed', err);
    }
  };

  const drawLine = (ctx, begin, end, color) => {
    ctx.beginPath();
    ctx.moveTo(begin.x, begin.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  let frameSkip = 0;
  const PROCESS_EVERY_N_FRAMES = 1; // adjust: 1 = every rAF, 2 = every other frame

  const tick = () => {
    rafRef.current = requestAnimationFrame(tick);
    frameSkip = (frameSkip + 1) % PROCESS_EVERY_N_FRAMES;
    if (frameSkip !== 0) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // set processing size
    canvas.width = processWidth;
    canvas.height = processHeight;
    const ctx = canvas.getContext('2d');
    // draw scaled video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
      if (code) {
        // draw bbox
        drawLine(ctx, code.location.topLeftCorner, code.location.topRightCorner, '#00FF00');
        drawLine(ctx, code.location.topRightCorner, code.location.bottomRightCorner, '#00FF00');
        drawLine(ctx, code.location.bottomRightCorner, code.location.bottomLeftCorner, '#00FF00');
        drawLine(ctx, code.location.bottomLeftCorner, code.location.topLeftCorner, '#00FF00');

        const text = code.data;
        const now = Date.now();
        if (text && (text !== lastRef.current.text || now - lastRef.current.ts > DUPLICATE_TTL)) {
          lastRef.current = { text, ts: now };
          let parsed;
          try { parsed = JSON.parse(text); } catch (e) { parsed = { raw: text }; }

          // feedback
          if (beep) try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=').play().catch(()=>{}); } catch(e){}
          if (vibrate && navigator.vibrate) try { navigator.vibrate(100); } catch(e){}

          if (typeof onDetected === 'function') onDetected(parsed);

          if (!continuous) {
            // stop scanning if single-shot
            stopStream();
          }
        }
      }
    } catch (e) {
      // ignore read errors
      // console.debug('processing error', e);
    }
  };

  return (
    <div className={"live-jsqr-scanner " + className}>
      <div className="controls mb-2 flex items-center gap-2">
        {!scanning ? (
          <button onClick={startStream} className="px-3 py-1 bg-blue-600 text-white rounded">Start Scanner</button>
        ) : (
          <button onClick={stopStream} className="px-3 py-1 bg-red-600 text-white rounded">Stop Scanner</button>
        )}
        {supportsZoom && (
          <div className="flex items-center gap-2 ml-2">
            <label className="text-sm">Zoom</label>
            <input type="range" min={zoomRange.min} max={zoomRange.max} step={zoomRange.step} value={zoomValue} onChange={(e) => setTrackZoom(Number(e.target.value))} />
          </div>
        )}
        {error && <div className="text-sm text-red-600 ml-3">{error}</div>}
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 960 }}>
        <video ref={videoRef} style={{ display: 'none' }} />
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', borderRadius: 6, border: '1px solid #e5e7eb', background: '#000' }} />
      </div>
    </div>
  );
}
