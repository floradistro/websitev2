# React Native Migration Guide - Whaletools Mobile

## Overview

This guide walks you through migrating your Next.js PWA to React Native for true native iOS and Android apps from a single codebase.

**Timeline:** 2-4 weeks for full migration
**Approach:** Expo (managed workflow) for easiest setup and built-in OTA updates

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Setup (Day 1-2)](#phase-1-setup-day-1-2)
3. [Phase 2: Core POS Features (Week 1)](#phase-2-core-pos-features-week-1)
4. [Phase 3: Full Migration (Week 2-3)](#phase-3-full-migration-week-2-3)
5. [Phase 4: Deploy & Updates (Week 4)](#phase-4-deploy--updates-week-4)
6. [Code Examples](#code-examples)
7. [Common Gotchas](#common-gotchas)

---

## Prerequisites

### Required Software

```bash
# Install Node.js (you already have this)
node --version  # Should be 18+

# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Install iOS development tools (macOS only)
# Download Xcode from Mac App Store (12GB, takes 30-60 min)

# Install Android development tools
# Download Android Studio from developer.android.com
```

### Expo Account (Free)

```bash
# Create account at expo.dev
# Then login
eas login
```

---

## Phase 1: Setup (Day 1-2)

### Step 1: Create New Expo Project

```bash
# Navigate to your workspace
cd /Users/whale/Desktop/

# Create new Expo app with TypeScript
npx create-expo-app whaletools-mobile --template tabs

cd whaletools-mobile

# Install additional dependencies
npx expo install expo-camera expo-barcode-scanner
npx expo install @react-navigation/native @react-navigation/stack
npx expo install expo-secure-store  # For auth tokens
npx expo install expo-constants expo-device
```

### Step 2: Install Core Dependencies

```bash
# Your existing backend dependencies
npm install @supabase/supabase-js
npm install axios
npm install zod

# UI/UX
npm install nativewind  # Tailwind for React Native
npm install tailwindcss

# Date handling
npm install date-fns
```

### Step 3: Configure NativeWind (Tailwind for RN)

```bash
# Setup Tailwind CSS for React Native
npx tailwindcss init
```

Create `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Update `babel.config.js`:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

### Step 4: Configure EAS (Updates & Builds)

```bash
# Initialize EAS
eas init

# Configure build profiles
eas build:configure
```

This creates `eas.json`:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 5: Configure OTA Updates

```bash
# Configure updates
eas update:configure
```

Update `app.json`:
```json
{
  "expo": {
    "name": "Whaletools",
    "slug": "whaletools-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "url": "https://u.expo.dev/[your-project-id]"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.whaletools.app",
      "infoPlist": {
        "NSCameraUsageDescription": "We need camera access to scan ID barcodes for age verification.",
        "NSPhotoLibraryUsageDescription": "We need photo library access to select product images."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.whaletools.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Whaletools to access your camera for ID scanning."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "[will be generated]"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

### Step 6: Project Structure

```
whaletools-mobile/
├── app/                      # App screens (Expo Router)
│   ├── (tabs)/              # Tab navigation
│   │   ├── pos.tsx          # POS Register
│   │   ├── products.tsx     # Products
│   │   └── settings.tsx     # Settings
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Home/Login
├── components/              # Reusable components
│   ├── pos/
│   │   ├── IDScanner.tsx   # Native camera scanner
│   │   ├── Cart.tsx
│   │   └── Payment.tsx
│   └── ui/                 # UI components
├── lib/                     # Shared utilities (from Next.js)
│   ├── supabase.ts         # Same as web
│   ├── id-scanner/
│   │   └── aamva-parser.ts # COPY FROM WEB - NO CHANGES
│   └── utils.ts
├── assets/                  # Images, fonts
├── app.json                # Expo config
└── package.json
```

---

## Phase 2: Core POS Features (Week 1)

### Priority: Get POS Register Working

1. **Copy Shared Logic** (1-2 hours)

```bash
# Copy your existing logic files
mkdir -p lib/id-scanner
cp ../whaletools/lib/id-scanner/aamva-parser.ts ./lib/id-scanner/
cp ../whaletools/lib/supabase.ts ./lib/
```

2. **Create Supabase Client** (30 min)

`lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
```

Create `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://uaednwpxursknmwdeejn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

3. **Rebuild ID Scanner** (3-4 hours)

`components/pos/IDScanner.tsx`:
```typescript
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { parseAAMVABarcode, isLegalAge } from '@/lib/id-scanner/aamva-parser';

interface IDScannerProps {
  onScanComplete: (data: any) => void;
  onClose: () => void;
}

export function IDScanner({ onScanComplete, onClose }: IDScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera permission to scan IDs</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);

    try {
      // Use your existing parser - NO CHANGES NEEDED!
      const parsedData = parseAAMVABarcode(data);

      if (!isLegalAge(parsedData.dateOfBirth)) {
        alert('Customer is under 21');
        setScanned(false);
        return;
      }

      onScanComplete(parsedData);
    } catch (error) {
      alert('Failed to parse barcode');
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['pdf417'], // ID barcodes are PDF417
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text style={styles.instructions}>
            Position barcode on back of ID
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      {scanned && (
        <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: '80%',
    height: 200,
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 10,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
});
```

**Key differences from web version:**
- Native camera = 60fps scanning (vs 10fps web)
- Direct barcode detection (no canvas processing)
- Reliable permissions (no browser quirks)
- Your AAMVA parser logic stays EXACTLY the same

4. **Create POS Screen** (2-3 hours)

`app/(tabs)/pos.tsx`:
```typescript
import { useState } from 'react';
import { View, Text, Button, StyleSheet, Modal } from 'react-native';
import { IDScanner } from '@/components/pos/IDScanner';

export default function POSScreen() {
  const [showScanner, setShowScanner] = useState(false);
  const [customer, setCustomer] = useState<any>(null);

  const handleScanComplete = async (scannedData: any) => {
    // Call your existing API
    const response = await fetch('https://your-api.com/api/pos/customers/scan-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scannedData }),
    });

    const result = await response.json();
    setCustomer(result.customer);
    setShowScanner(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>POS Register</Text>

      <Button
        title="Scan Customer ID"
        onPress={() => setShowScanner(true)}
      />

      {customer && (
        <View style={styles.customerInfo}>
          <Text>Customer: {customer.first_name} {customer.last_name}</Text>
        </View>
      )}

      <Modal visible={showScanner} animationType="slide">
        <IDScanner
          onScanComplete={handleScanComplete}
          onClose={() => setShowScanner(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  customerInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});
```

5. **Test on Device** (1 hour)

```bash
# Start development server
npx expo start

# Scan QR code with:
# - Expo Go app (iOS/Android) - quickest way
# - Or connect device via USB

# Camera will work on real device (not simulator)
```

---

## Phase 3: Full Migration (Week 2-3)

### Week 2: Product Catalog & Cart

**Strategy:** Convert one screen at a time

1. **Products List** - Port your product grid
2. **Product Detail** - Same logic, new styling
3. **Cart** - Reuse your cart logic exactly
4. **Checkout** - Payment integration stays same

### Week 3: Vendor Dashboard

1. **Dashboard Home** - Analytics/stats
2. **Inventory Management**
3. **Order Management**
4. **Settings**

### Styling Conversion

**Web (Tailwind CSS):**
```tsx
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-lg">
  <h1 className="text-2xl font-bold text-gray-900">Products</h1>
</div>
```

**React Native (NativeWind - same syntax!):**
```tsx
<View className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-lg">
  <Text className="text-2xl font-bold text-gray-900">Products</Text>
</View>
```

**Or React Native (StyleSheet):**
```tsx
<View style={styles.container}>
  <Text style={styles.title}>Products</Text>
</View>

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 16,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
});
```

**Recommended:** Use NativeWind so you can keep your Tailwind classes!

---

## Phase 4: Deploy & Updates (Week 4)

### Build for Production

```bash
# Build iOS (requires Mac + Xcode)
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production

# Build both
eas build --platform all --profile production
```

This takes 15-30 minutes. EAS builds in the cloud, so you don't need local setup.

### Submit to App Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

**Requirements:**
- Apple Developer account ($99/year)
- Google Play Developer account ($25 one-time)

### Push OTA Updates (THE MAGIC)

```bash
# Make changes to your code
# (fix bug, add feature, update UI)

# Test locally
npx expo start

# Push update to production
eas update --branch production --message "Fixed ID scanner bug"

# That's it! Users get update on next app open (2-30 seconds)
```

**Update workflow:**
```bash
# Development workflow
git checkout -b feature/new-thing
# Make changes
npx expo start  # Test locally

# Deploy to preview channel
eas update --branch preview --message "Testing new feature"

# After testing, deploy to production
git checkout main
git merge feature/new-thing
eas update --branch production --message "Release new feature"
```

**Update limits:**
- Unlimited OTA updates
- Free tier: Works for small teams
- Pro tier ($29/user/mo): Team features, more build minutes

---

## Code Examples

### API Calls (Identical to Web)

```typescript
// Works exactly the same in React Native
const response = await fetch('https://your-api.com/api/products', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const products = await response.json();
```

### Supabase (Identical to Web)

```typescript
// Same code as web
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('vendor_id', vendorId);
```

### Storage/AsyncStorage (Replaces localStorage)

```typescript
// Web
localStorage.setItem('token', token);

// React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('token', token);
```

### Navigation

**Web (Next.js):**
```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/products');
```

**React Native (Expo Router):**
```tsx
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/products');
```

---

## Common Gotchas

### 1. No HTML Elements
❌ `<div>`, `<span>`, `<p>`, `<img>`
✅ `<View>`, `<Text>`, `<Image>`

### 2. All Text Must Be in `<Text>`
```tsx
// ❌ Won't work
<View>Hello</View>

// ✅ Correct
<View><Text>Hello</Text></View>
```

### 3. Styling Differences
- No CSS files (use StyleSheet or NativeWind)
- `flexbox` is default (not block)
- No `px` units (just numbers: `width: 100` not `width: '100px'`)

### 4. Images Need Dimensions
```tsx
// ❌ Won't show
<Image source={{ uri: 'https://...' }} />

// ✅ Correct
<Image
  source={{ uri: 'https://...' }}
  style={{ width: 200, height: 200 }}
/>
```

### 5. Buttons Are Different
```tsx
// Basic button (ugly but works)
import { Button } from 'react-native';
<Button title="Click Me" onPress={() => {}} />

// Custom button (recommended)
<TouchableOpacity onPress={() => {}}>
  <Text>Click Me</Text>
</TouchableOpacity>
```

---

## Testing Strategy

### Week 1: POS Core
- ID Scanner works on real device
- Customer lookup/creation
- Basic cart functionality

### Week 2: Full POS
- Complete checkout flow
- Payment processing
- Receipt generation

### Week 3: Vendor Features
- Product management
- Order management
- Analytics

### Week 4: Polish & Deploy
- Fix bugs
- UI polish
- Submit to stores

---

## Success Metrics

✅ **Camera Issues Fixed:** Native camera API, 60fps scanning
✅ **Reliable Permissions:** Native permission system
✅ **Fast Updates:** OTA updates in seconds
✅ **Better Performance:** Native rendering
✅ **Single Codebase:** iOS + Android from same code

---

## Next Steps

1. **Install prerequisites** (Xcode, Android Studio)
2. **Create Expo project** (`npx create-expo-app`)
3. **Copy AAMVA parser** (works as-is!)
4. **Build ID scanner** (3-4 hours)
5. **Test on device** (scan real ID)

**Start small:** Get ID scanner working first, then expand.

---

## Resources

- **Expo Docs:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev
- **EAS Updates:** https://docs.expo.dev/eas-update/introduction/
- **Camera Docs:** https://docs.expo.dev/versions/latest/sdk/camera/
- **NativeWind:** https://www.nativewind.dev/

---

## Questions?

Common questions answered:

**Q: Can I run web + mobile in parallel?**
A: Yes! Keep your Next.js app running while building mobile. Share API.

**Q: How much does it cost?**
A: Free tier works for development. Production: $99/yr iOS + $25 Google Play.

**Q: How long until app is live?**
A: 1-2 days for Google Play, 1-7 days for Apple App Store (first submission).

**Q: Can I test without publishing?**
A: Yes! Use Expo Go app or build internal preview builds.

**Q: Do I need a Mac for iOS?**
A: Yes for local development. No for EAS cloud builds (builds iOS for you).
