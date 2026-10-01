
import React, { useEffect, useRef, useState } from 'react';
import { MediasoupService } from '../services/streamService';

interface RemoteStreamPlayerProps {
  streamId: string;
  className?: string;
  placeholder?: React.ReactNode;
}

export default function RemoteStreamPlayer({ streamId, className, placeholder }: RemoteStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mediasoupServiceRef = useRef<MediasoupService>(new MediasoupService());

  useEffect(() => {
    const join = async () => {
      setIsLoading(true);
      try {
        await mediasoupServiceRef.current.joinStream(streamId, (remoteStream) => {
          setStream(remoteStream);
          setIsLoading(false);
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
          }
        });
      } catch (err) {
        console.error("Failed to join remote stream:", err);
        setIsLoading(false);
      }
    };

    join();

    return () => {
      mediasoupServiceRef.current.leaveStream();
    };
  }, [streamId]);

  if (isLoading && !stream) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-900 ${className}`}>
        {placeholder || (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Connecting...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative bg-black overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {!stream && placeholder}
    </div>
  );
}
