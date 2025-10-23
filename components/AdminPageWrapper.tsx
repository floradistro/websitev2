"use client";

import { ReactNode } from 'react';

export default function AdminPageWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full px-4 lg:px-0">
      <style jsx global>{`
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fade-in 0.6s ease-out;
        }
        /* Modern minimal checkbox */
        input[type="checkbox"], input[type="radio"] {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
        }
        input[type="checkbox"]:hover, input[type="radio"]:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.05);
        }
        input[type="checkbox"]:checked, input[type="radio"]:checked {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        input[type="checkbox"]:checked::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid rgba(255, 255, 255, 0.9);
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(45deg);
        }
        input[type="radio"] {
          border-radius: 50%;
        }
        input[type="radio"]:checked::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 4px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
        }
      `}</style>
      {children}
    </div>
  );
}



