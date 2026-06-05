'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  show: boolean;
  message?: string;
}

export function LoadingScreen({ show, message = 'Loading...' }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!show) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#3a7d6c] to-[#57aa95]">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse" />
        <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-2xl">
          <Image
            src="/icon.png"
            alt="HelpingPaws Logo"
            fill
            className="object-contain p-4"
          />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-2">HelpingPaws</h1>
      <p className="text-white/80 mb-8">Veterinary Clinic Management</p>
      
      <div className="w-64 h-2 bg-white/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-white/60 text-sm mt-4">{message}</p>
    </div>
  );
}

export function useLoading() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');

  const showLoading = (msg?: string) => {
    setMessage(msg || 'Loading...');
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  return { loading, message, showLoading, hideLoading };
}
