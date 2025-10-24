"use client";

export default function WaveBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Wave Layer 1 - Ultra Smooth GPU Accelerated */}
      <div 
        className="absolute bottom-0 left-0 w-[200%] h-[60%]"
        style={{
          animation: 'wave-flow 20s linear infinite',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden' as const,
          perspective: 1000
        }}
      >
        <svg 
          className="w-full h-full opacity-[0.05]"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ 
            shapeRendering: 'geometricPrecision' as const
          }}
        >
          <path 
            fill="rgba(255, 255, 255, 1)"
            d="M0,160Q360,200,720,160T1440,160L1440,320L0,320Z"
          />
        </svg>
      </div>
      
      {/* Wave Layer 2 - Offset for depth */}
      <div 
        className="absolute bottom-0 left-0 w-[200%] h-[60%]"
        style={{
          animation: 'wave-flow-2 25s linear infinite',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden' as const,
          perspective: 1000
        }}
      >
        <svg 
          className="w-full h-full opacity-[0.04]"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ 
            shapeRendering: 'geometricPrecision' as const
          }}
        >
          <path 
            fill="rgba(255, 255, 255, 1)"
            d="M0,192Q360,232,720,192T1440,192L1440,320L0,320Z"
          />
        </svg>
      </div>
    </div>
  );
}

