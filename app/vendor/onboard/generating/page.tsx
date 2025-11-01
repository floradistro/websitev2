'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';

function GeneratingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vendorId = searchParams.get('vendor_id');
  
  const [status, setStatus] = useState('Initializing AI...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const steps = [
    'Analyzing your business',
    'Designing storefront layout',
    'Writing compelling copy',
    'Configuring components',
    'Wiring up your products',
    'Adding locations and reviews',
    'Finalizing design',
    'Publishing storefront'
  ];
  
  useEffect(() => {
    if (!vendorId) {
      router.push('/vendor/onboard');
      return;
    }
    
    // Simulate progress (since we can't track real progress yet)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // Stop at 90% until actual completion
        return prev + (Math.random() * 8);
      });
    }, 800);
    
    // Update status messages
    const statusInterval = setInterval(() => {
      const currentStep = Math.floor((progress / 100) * steps.length);
      if (currentStep < steps.length) {
        setStatus(steps[currentStep]);
      }
    }, 2000);
    
    // Poll for completion
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/vendors/${vendorId}/status`);
        const data = await res.json();
        
        if (data.success && data.vendor.storefront_generated) {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          clearInterval(statusInterval);
          
          setProgress(100);
          setStatus('Complete!');
          
          // Redirect after brief celebration
          setTimeout(() => {
            router.push(`/vendor/dashboard?welcome=true&vendor_id=${vendorId}`);
          }, 2000);
        }
        
        // Check for failure (status still pending after 2 minutes)
        if (data.vendor.status === 'pending') {
          const createdAt = new Date(data.vendor.created_at || Date.now());
          const elapsed = Date.now() - createdAt.getTime();
          
          if (elapsed > 120000) { // 2 minutes
            setError('Generation took too long. Please contact support.');
            clearInterval(pollInterval);
            clearInterval(progressInterval);
            clearInterval(statusInterval);
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 3000);
    
    return () => {
      clearInterval(pollInterval);
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, [vendorId, router, progress]);
  
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl mb-4">Generation Failed</h1>
          <p className="text-white/60 mb-8">{error}</p>
          <button
            onClick={() => router.push('/vendor/onboard')}
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-white/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-lg px-6">
        {/* Animated icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-white/10 rounded-full animate-ping" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center border border-white/20">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-light mb-3">Creating Your Storefront</h1>
        <p className="text-white/60 mb-8">AI is designing your custom storefront...</p>
        
        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Current status */}
        <p className="text-sm text-white/40 mb-12">{status}</p>
        
        {/* Steps checklist */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left">
          <div className="space-y-3">
            {steps.map((step, index) => {
              const stepProgress = (progress / 100) * steps.length;
              const isComplete = stepProgress > index;
              const isCurrent = Math.floor(stepProgress) === index;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  {isComplete ? (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 bg-white/10 rounded-full flex-shrink-0" />
                  )}
                  <span className={`text-sm ${
                    isComplete ? 'text-green-400' : 
                    isCurrent ? 'text-blue-400' : 
                    'text-white/40'
                  }`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        <p className="text-xs text-white/30 mt-8">This usually takes 30-90 seconds</p>
      </div>
    </div>
  );
}

export default function Generating() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <GeneratingContent />
    </Suspense>
  );
}

