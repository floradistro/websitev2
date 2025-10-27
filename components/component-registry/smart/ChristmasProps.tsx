
"use client";

import React, { useEffect, useState } from 'react';
import { SmartComponentWrapper, SmartComponentBaseProps } from '@/lib/smart-component-base';

export interface ChristmasPropsProps extends SmartComponentBaseProps {
  headline?: string;
  showDescription?: boolean;
  maxProps?: number;
  snowflakeAnimation?: boolean;
}

export function ChristmasProps({ vendorId, ...props }: ChristmasPropsProps) {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [componentProps, setComponentProps] = useState(null);
  
  useEffect(() => {
    fetch('/api/component/props')
      .then(res => res.json())
      .then(data => {
        setComponentProps(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        setComponentProps({});
      });
  }, [vendorId]);
  
  // Check if data is loaded
  const dataLoaded = componentProps !== null;
  
  useEffect(() => {
    if (dataLoaded) {
      setLoading(false);
    }
  }, [dataLoaded]);
  
  
  // Simple render
  
  return (
    <SmartComponentWrapper 
      componentName="ChristmasProps"
      loading={loading}
      error={error}
    >
      <div className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-[#0a0a0a] via-red-950/10 to-green-950/10 overflow-hidden">
      {props.snowflakeAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-[10%] text-white/20 text-2xl animate-bounce">❄</div>
          <div className="absolute top-20 left-[30%] text-white/10 text-3xl animate-pulse">❄</div>
          <div className="absolute top-32 left-[50%] text-white/20 text-xl animate-bounce">❄</div>
          <div className="absolute top-16 left-[70%] text-white/15 text-2xl animate-pulse">❄</div>
          <div className="absolute top-40 left-[85%] text-white/10 text-3xl animate-bounce">❄</div>
          <div className="absolute top-60 right-[15%] text-white/20 text-xl animate-pulse">❄</div>
        </div>
      )
    </SmartComponentWrapper>
  );
}
