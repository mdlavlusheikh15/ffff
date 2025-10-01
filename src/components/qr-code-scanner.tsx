
"use client";

import React, { useEffect, useState, useRef } from 'react';
import jsQR from "jsqr";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

interface QRCodeScannerProps {
  onScan: (result: string | null) => void;
  active: boolean; // Control scanning from parent
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, active }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const animationFrameId = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } else {
           setHasCameraPermission(false);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    if (active) {
        getCameraPermission();
    }

    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [active, toast]);


  useEffect(() => {
     const tick = () => {
      if (!active || !videoRef.current || !canvasRef.current) return;

      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');
        
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
                onScan(code.data);
                return; // Stop scanning after a successful scan
            }
          } catch (e) {
            console.error("Could not get image data from canvas", e)
          }
        }
      }
      animationFrameId.current = requestAnimationFrame(tick);
    };

    if (active && hasCameraPermission) {
        videoRef.current?.play().catch(e => console.error("Video play failed", e));
        animationFrameId.current = requestAnimationFrame(tick);
    } else {
        if(animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    }

    return () => {
        if(animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    }

  }, [active, hasCameraPermission, onScan]);


  return (
    <div className="relative w-64 h-64 bg-black rounded-lg overflow-hidden flex items-center justify-center">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Scanner overlay */}
      {hasCameraPermission && (
        <>
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative w-48 h-48">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/70 shadow-[0_0_10px_theme(colors.primary)] animate-ping" style={{ animation: 'scan 2s infinite cubic-bezier(0.5, 0, 0.5, 1)' }} />
            </div>
            <p className="absolute bottom-4 text-white/80 text-sm bg-black/50 px-2 py-1 rounded">ক্যামেরার সামনে QR কোডটি ধরুন</p>
        </>
      )}

      { hasCameraPermission === false && (
         <Alert variant="destructive" className="m-4">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to use this feature.
              </AlertDescription>
          </Alert>
      )}

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(188px); /* 192px (h-48) - 4px (h-1) */
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodeScanner;
