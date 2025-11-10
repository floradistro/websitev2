"use client";

import React from "react";
import {
  SmartComponentWrapper,
  SmartComponentBaseProps,
  SmartTypography,
  SmartContainers,
  SmartButton,
} from "@/lib/smart-component-base";

export interface SmartHeroProps extends SmartComponentBaseProps {
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  buttonUrl?: string;
  showLogo?: boolean;
}

export function SmartHero({
  vendorId,
  vendorLogo,
  headline = "Premium Cannabis",
  subheadline = "Curated selection of premium products",
  buttonText = "Shop Now",
  buttonUrl = "/shop",
  showLogo = true,
  animate = true,
}: SmartHeroProps) {
  return (
    <SmartComponentWrapper componentName="SmartHero" animate={animate}>
      <SmartContainers.Section>
        <SmartContainers.MaxWidth>
          <div className="flex flex-col items-center justify-center text-center gap-6">
            {showLogo && vendorLogo && (
              <div className="mb-4">
                <img src={vendorLogo} alt="Logo" className="h-24 w-auto object-contain" />
              </div>
            )}

            <SmartTypography.Headline>{headline}</SmartTypography.Headline>

            {subheadline && (
              <SmartTypography.Body className="text-xl max-w-2xl">
                {subheadline}
              </SmartTypography.Body>
            )}

            {buttonText && (
              <SmartButton href={buttonUrl} size="lg">
                {buttonText}
              </SmartButton>
            )}
          </div>
        </SmartContainers.MaxWidth>
      </SmartContainers.Section>
    </SmartComponentWrapper>
  );
}
