
"use client";

import React, { useEffect, useState } from 'react';
import { SmartComponentWrapper, SmartComponentBaseProps } from '@/lib/smart-component-base';

export interface FloraHalloweenHomeProps extends SmartComponentBaseProps {
  heroHeadline?: string;
  heroSubheadline?: string;
  ctaPrimary?: string;
}

export function FloraHalloweenHome({ vendorId, ...props }: FloraHalloweenHomeProps) {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [products, setProducts] = useState(null);
  
  useEffect(() => {
    fetch('/api/products/halloween-featured')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        setProducts({});
      });
  }, [vendorId]);

  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    fetch('/api/user/context')
      .then(res => res.json())
      .then(data => {
        setUser(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        setUser({ device: "desktop", cartAbandoned: false });
      });
  }, [vendorId]);
  
  // Check if data is loaded
  const dataLoaded = products !== null && user !== null;
  
  useEffect(() => {
    if (dataLoaded) {
      setLoading(false);
    }
  }, [dataLoaded]);
  
  
  
  // Quantum state management
  const [activeState, setActiveState] = useState('FirstVisit');
  
  useEffect(() => {
    // Evaluate conditions and collapse quantum state
    
    if (user?.visits == 1) {
      setActiveState('FirstVisit');
    } else 
    if (user?.visits > 1) {
      setActiveState('Returning');
    }
  }, [props]);
  
  
  return (
    <SmartComponentWrapper 
      componentName="FloraHalloweenHome"
      loading={loading}
      error={error}
    >
      
      <>
        
      {activeState === 'FirstVisit' && dataLoaded && (
        <div className="py-16 sm:py-20 px-4">
          <h1 className="text-6xl sm:text-8xl font-black uppercase">
            {props.heroHeadline}
          </h1>
        </div>
      )}

      {activeState === 'Returning' && dataLoaded && (
        <div className="py-16 sm:py-20 px-4">
          <h1 className="text-6xl sm:text-8xl font-black uppercase">
            WELCOME BACK
          </h1>
        </div>
      )}
      </>
    
    </SmartComponentWrapper>
  );
}
