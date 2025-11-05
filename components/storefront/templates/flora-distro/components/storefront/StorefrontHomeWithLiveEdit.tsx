"use client";

import { useLiveEditing } from './LiveEditingProvider';
import { StorefrontHomeClient } from './StorefrontHomeClient';
import { LiveEditableStorefront } from './LiveEditableStorefront';

interface Props {
  vendor: any;
  products: any[];
  inventoryMap: any;
  productFieldsMap: any;
  locations: any[];
  reviews: any[];
}

export function StorefrontHomeWithLiveEdit(props: Props) {
  const { isLiveEditMode, sections } = useLiveEditing();

  // If in live edit mode, use editable version with live sections
  if (isLiveEditMode && sections.length > 0) {
    return <LiveEditableStorefront {...props} />;
  }

  // Otherwise use original component
  return <StorefrontHomeClient {...props} />;
}

