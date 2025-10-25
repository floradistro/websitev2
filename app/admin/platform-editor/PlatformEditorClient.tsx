'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PLATFORM_VENDOR_ID = '00000000-0000-0000-0000-000000000001';

export default function PlatformEditorRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified component editor with platform vendor ID
    router.replace(`/vendor/component-editor?vendor_id=${PLATFORM_VENDOR_ID}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#2ecc71] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-white text-sm uppercase tracking-wider">
          Loading Yacht Club Editor...
        </div>
      </div>
    </div>
  );
}

