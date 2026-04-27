'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'
import { X, Camera, CameraOff } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface BarcodeScannerProps {
  onCodeScanned: (result: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onCodeScanned, onClose }: BarcodeScannerProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [videoReady, setVideoReady] = useState(false);
  const [videoElementMounted, setVideoElementMounted] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const stopScanner = useCallback(() => {
    if (codeReader.current) {
      // Stop all video tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      codeReader.current = null;
    }
    setIsScanning(false);
    setVideoReady(false);
    setVideoElementMounted(false);
    setPermissionStatus('prompt');
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const waitForVideoElement = useCallback(async (maxWaitMs = 5000): Promise<HTMLVideoElement> => {
    const startTime = Date.now();
    const checkInterval = 100;
    
    console.log('⏳ Esperando que el video element esté disponible...');
    
    return new Promise((resolve, reject) => {
      const checkVideo = () => {
        const elapsed = Date.now() - startTime;
        
        if (videoRef.current) {
          console.log(`✅ Video element encontrado después de ${elapsed}ms`);
          setVideoElementMounted(true);
          resolve(videoRef.current);
          return;
        }
        
        if (elapsed >= maxWaitMs) {
          console.error(`❌ Video element no disponible después de ${maxWaitMs}ms`);
          reject(new Error(`Video element no se montó en ${maxWaitMs}ms`));
          return;
        }
        
        console.log(`⏳ Esperando video element... ${elapsed}ms`);
        setTimeout(checkVideo, checkInterval);
      };
      
      checkVideo();
    });
  }, []);

  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (typeof window !== 'undefined' && window.innerWidth <= 768);
  }, []);

  const checkCameraPermissions = useCallback(async () => {
    try {
      // En móviles, la API de permisos puede no funcionar correctamente
      if (isMobile()) {
        console.log('📱 Dispositivo móvil detectado, omitiendo verificación de permisos');
        return 'prompt'; // Siempre intentar en móvil
      }
      
      // Verificar si los permisos están disponibles (solo en desktop)
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return permissions.state;
    } catch {
      // Si no se puede verificar permisos, asumir que están disponibles
      return 'prompt';
    }
  }, [isMobile]);

  const initializeScanner = useCallback(async () => {
    try {
      setError(null);
      setPermissionStatus('prompt');
      console.log('🎥 Starting camera access process...');
      console.log('📱 Is mobile:', isMobile());
      
      // First wait for the video element to become available.
      const waitTime = isMobile() ? 8000 : 5000;
      const video = await waitForVideoElement(waitTime);
      console.log('✅ Video element confirmado y disponible');
      
      // Verify getUserMedia support.
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not available in this browser');
      }
      
      // On mobile, skip permission pre-check and request media directly.
      if (!isMobile()) {
        // Only check permissions on desktop.
        let permissionState = 'prompt';
        try {
          const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
          permissionState = permissions.state;
          console.log('📋 Camera permission state:', permissionState);
        } catch {
          console.log('⚠️ Permission query unavailable, continuing with direct request');
        }
        
        if (permissionState === 'denied') {
          setPermissionStatus('denied');
          setError(t('scanner.permissionDenied'));
          return;
        }
      } else {
        console.log('📱 Mobile detected: skipping permission pre-check');
      }
      
      // Platform-specific constraints for mobile vs desktop.
      const mobileConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { min: 320, ideal: 480, max: 1280 },
          height: { min: 240, ideal: 640, max: 720 }
        }
      };
      
      const desktopConstraints = {
        video: true
      };
      
      // Try platform-specific constraints first.
      let stream: MediaStream;
      try {
        const constraints = isMobile() ? mobileConstraints : desktopConstraints;
        console.log('🎯 Trying camera access with constraints:', JSON.stringify(constraints));
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Camera access succeeded');
      } catch {
        console.log('⚠️ Constraint-specific access failed, retrying with basic config...');
        // Fallback to simpler configuration.
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true
        });
        console.log('✅ Camera access with basic config succeeded');
      }
      
      setPermissionStatus('granted');
      console.log('📹 Stream obtained, configuring video element...');
      
      // Video element is already validated; proceed directly.
      video.srcObject = stream;
      
      // Configure video for autoplay.
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      
      // Add compatibility attributes for mobile browsers.
      if (isMobile()) {
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('muted', 'true');
      }
      
      console.log('🎬 Video configuration complete, waiting for load...');
      
      // Wait for the video to be ready and force playback.
      await new Promise<void>((resolve, reject) => {
        const handleLoadedMetadata = async () => {
          try {
            console.log('🎬 Video metadata loaded, starting playback...');
            await video.play();
            console.log('✅ Video playing correctly');
            setIsScanning(true);
            setVideoReady(true);
            resolve();
          } catch (playError) {
            console.error('❌ Error playing video:', playError);
            reject(playError);
          }
        };
        
        // Add event listeners.
        video.onloadedmetadata = handleLoadedMetadata;
        
        // For mobile, also listen to extra events.
        if (isMobile()) {
          video.oncanplay = () => {
            console.log('📱 Video canplay event triggered');
            if (video.readyState >= 2) {
              handleLoadedMetadata();
            }
          };
        }
        
        // Use a longer timeout for mobile devices.
        const timeout = isMobile() ? 7000 : 3000;
        setTimeout(() => {
          console.log(`⏰ Video timeout (${timeout}ms), checking state...`);
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            console.log('📹 Video ready via timeout fallback');
            handleLoadedMetadata();
          } else {
            console.log('❌ Video is not ready after timeout');
            reject(new Error(`Video did not load in ${timeout}ms`));
          }
        }, timeout);
      });
      
      console.log('✅ Video element configured successfully');
      
      // Configure hints to detect only 1D barcodes (faster).
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR
      ]);
      hints.set(DecodeHintType.TRY_HARDER, false);
      
      // Initialize scanner with optimized settings.
      codeReader.current = new BrowserMultiFormatReader(hints);
      console.log('🔍 Starting barcode reader (1D barcodes only)...');
      
      // Use a longer timeout for mobile devices.
      const scanTimeout = isMobile() ? 4000 : 2000;
      setTimeout(async () => {
        try {
          // Video is already validated; start scanner.
          console.log('🚀 Starting barcode scan...');
          await codeReader.current?.decodeFromVideoElement(
            video,
            (result, error) => {
              if (result) {
                const scannedText = result.getText();
                console.log('🎯 Scanned code:', scannedText);
                onCodeScanned(scannedText);
                stopScanner();
              }
              if (error && error.name !== 'NotFoundException') {
                console.warn('⚠️ Scan error:', error);
              }
            }
          );
          console.log('✅ Scanner started successfully');
        } catch (scanError) {
          console.error('❌ Error starting scanner:', scanError);
          setError(t('scanner.cameraError'));
        }
      }, scanTimeout);
      
    } catch (err) {
      console.error('❌ Error accessing camera:', err);
      const error = err as Error;
      setPermissionStatus('denied');
      
      // Provide more specific and detailed error handling.
      console.log('🔍 Analyzing error type:', error.name, error.message);
      
      if (error.name === 'NotAllowedError') {
        setError(t('scanner.permissionDenied'));
      } else if (error.name === 'NotFoundError') {
        setError(t('scanner.cameraError'));
      } else if (error.name === 'NotSupportedError') {
        setError(t('scanner.unsupported'));
      } else if (error.name === 'OverconstrainedError') {
        setError(t('scanner.cameraError'));
      } else if (error.message.includes('getUserMedia')) {
        setError(t('scanner.unsupported'));
      } else {
        setError(t('scanner.cameraError'));
      }
    }
  }, [onCodeScanned, checkCameraPermissions, isMobile, waitForVideoElement]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Delay initialization briefly to let the DOM fully render.
    const timeoutId = setTimeout(() => {
      if (permissionStatus !== 'denied') {
        console.log('🚀 Starting scanner after mount timeout');
        initializeScanner();
      }
    }, isMobile() ? 500 : 100);
    
    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        color: 'white'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
          {t('scanner.title')}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Video Container */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        aspectRatio: '1',
        background: 'black',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        border: '2px solid var(--primary)'
      }}>
        {permissionStatus === 'denied' ? (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
            padding: '20px'
          }}>
            <CameraOff size={48} style={{ marginBottom: '16px', opacity: 0.7 }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>
              {t('scanner.permissionDenied')}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', opacity: 0.8 }}>
              {t('scanner.instructions')}
            </p>
            <button
              onClick={initializeScanner}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {t('scanner.retry')}
            </button>
          </div>
        ) : (
          <>
            {/* Always render video element, but show loading overlay when not ready */}
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el) {
                  console.log('📹 Video element montado en el DOM');
                  setVideoElementMounted(true);
                } else {
                  console.log('❌ Video element desmontado del DOM');
                  setVideoElementMounted(false);
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: 'black'
              }}
              autoPlay
              playsInline
              muted
            />
            
            {/* Loading overlay when video is not ready */}
            {!videoReady && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                background: 'rgba(0,0,0,0.8)'
              }}>
                <Camera size={48} style={{ marginBottom: '16px', opacity: 0.7 }} />
                <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center' }}>
                  {permissionStatus === 'granted' ? t('scanner.initializing') : t('scanner.permissionDenied')}
                </p>
              </div>
            )}
            
            {/* Debug overlay to show video state */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>
              {videoElementMounted 
                ? (videoReady ? '📹 Video activo' : '⏳ Cargando...') 
                : '❌ Element no montado'
              }
            </div>
          </>
        )}

        {/* Scanning Overlay - show when video is ready and scanning */}
        {videoReady && isScanning && (
          <div style={{
            position: 'absolute',
            inset: '20%',
            border: '2px solid var(--primary)',
            borderRadius: '8px',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '2px',
              background: 'var(--primary)',
              animation: 'scan-line 2s infinite linear'
            }} />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        color: 'white',
        maxWidth: '400px'
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: '0.875rem', 
          opacity: 0.8,
          lineHeight: 1.5 
        }}>
          {t('scanner.instructions')}
        </p>
      </div>

      {error && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '8px',
          color: '#fca5a5',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <style jsx>{`
        @keyframes scan-line {
          0% { top: -2px; }
          50% { top: calc(100% - 2px); }
          100% { top: -2px; }
        }
      `}</style>
    </div>
  )
}