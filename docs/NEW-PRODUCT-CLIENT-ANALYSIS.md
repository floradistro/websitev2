# NewProductClient.tsx - Complete Feature Analysis

**File Location**: `/Users/whale/Desktop/Website/app/vendor/products/new/NewProductClient.tsx`
**Purpose**: Comprehensive product creation interface supporting single product creation, bulk import, AI enrichment, image uploads, and flexible pricing

---

## Table of Contents
1. [State Inventory](#state-inventory)
2. [Functions & Methods](#functions--methods)
3. [Feature List](#feature-list)
4. [Data Flow](#data-flow)
5. [External Dependencies](#external-dependencies)
6. [TypeScript Interfaces](#typescript-interfaces)
7. [Component Architecture](#component-architecture)

---

## State Inventory

### Core Application State

#### 1. `inputMode` (useState)
- **Type**: `'single' | 'bulk'`
- **Default**: `'single'`
- **Purpose**: Controls the primary mode toggle between single product creation and bulk import
- **Usage**: Determines which UI sections are rendered

#### 2. `formData` (useState)
- **Type**: Object
- **Default**:
  ```typescript
  {
    name: '',
    description: '',
    category_id: '',
    price: '',
    cost_price: '',
    initial_quantity: '',
  }
  ```
- **Purpose**: Stores single product form data
- **Fields**:
  - `name`: Product name
  - `description`: Product description
  - `category_id`: Selected category UUID
  - `price`: Product price (for single pricing mode)
  - `cost_price`: Cost/wholesale price
  - `initial_quantity`: Starting inventory in grams

### Category & Field Management

#### 3. `categories` (useState)
- **Type**: `Category[]`
- **Default**: `[]`
- **Purpose**: Stores available product categories fetched from API
- **Interface**: `{ id: string; name: string; slug: string }`

#### 4. `dynamicFields` (useState)
- **Type**: `DynamicField[]`
- **Default**: `[]`
- **Purpose**: Category-specific custom fields (strain info, effects, etc.)
- **Interface**:
  ```typescript
  {
    name: string;
    slug?: string;
    type: string;  // 'text' | 'number' | 'textarea' | 'select' | 'multiselect'
    label: string;
    placeholder?: string;
    description?: string;
    required?: boolean;
    options?: string[];
    groupName?: string;
  }
  ```

#### 5. `customFieldValues` (useState)
- **Type**: `Record<string, any>`
- **Default**: `{}`
- **Purpose**: Stores values for dynamic custom fields
- **Example**: `{ strain_type: 'Indica', lineage: 'OG Kush x Durban Poison', effects: ['Relaxed', 'Happy'] }`

### Pricing State

#### 6. `pricingMode` (useState)
- **Type**: `'single' | 'tiered'`
- **Default**: `'single'`
- **Purpose**: Controls pricing strategy for single products
- **Options**:
  - `single`: One price for the product
  - `tiered`: Multiple price points based on weight/quantity

#### 7. `pricingTiers` (useState)
- **Type**: `Array<{ weight: string; qty: number; price: string }>`
- **Default**: `[]`
- **Purpose**: Stores tiered pricing structure (e.g., 1g=$10, 3.5g=$30, 7g=$50)
- **Structure**:
  - `weight`: Display weight (e.g., "1g", "3.5g")
  - `qty`: Multiplier for calculations
  - `price`: Price for this tier

### Image Management

#### 8. `imageFiles` (useState)
- **Type**: `File[]`
- **Default**: `[]`
- **Purpose**: Stores raw File objects for uploaded images

#### 9. `imagePreviews` (useState)
- **Type**: `string[]`
- **Default**: `[]`
- **Purpose**: Base64 data URLs for image preview display
- **Generated**: Via FileReader.readAsDataURL()

#### 10. `uploadedImageUrls` (useState)
- **Type**: `string[]`
- **Default**: `[]`
- **Purpose**: Cloud storage URLs returned after successful upload
- **Usage**: Sent to backend during product creation

### Bulk Import State

#### 11. `bulkInput` (useState)
- **Type**: `string`
- **Default**: `''`
- **Purpose**: Raw CSV-style text input for bulk products
- **Format**: `"Name, Price, Cost\nName2, Price2, Cost2"`
- **Example**:
  ```
  Blue Dream, 45, 20
  Wedding Cake, 50, 25
  Gelato, 55, 30
  ```

#### 12. `bulkCategory` (useState)
- **Type**: `string`
- **Default**: `''`
- **Purpose**: Category ID applied to all bulk imported products

#### 13. `bulkProducts` (useState)
- **Type**: `BulkProduct[]`
- **Default**: `[]`
- **Purpose**: Parsed and enriched product objects ready for submission
- **Interface**:
  ```typescript
  {
    name: string;
    price: string;
    cost_price: string;
    pricing_mode: 'single' | 'tiered';
    pricing_tiers: Array<{weight: string, qty: number, price: string}>;
    custom_fields: Record<string, any>;
  }
  ```

#### 14. `currentReviewIndex` (useState)
- **Type**: `number`
- **Default**: `0`
- **Purpose**: Tracks which bulk product is being reviewed/edited
- **Range**: 0 to `bulkProducts.length - 1`

#### 15. `bulkImages` (useState)
- **Type**: `Array<{file: File, url: string, matchedTo: string | null}>`
- **Default**: `[]`
- **Purpose**: Images for bulk import with optional product matching
- **Status**: Currently defined but not fully implemented in UI

#### 16. `bulkEnrichedData` (useState)
- **Type**: `Record<string, any>`
- **Default**: `{}`
- **Purpose**: AI-generated data indexed by product name
- **Example**:
  ```typescript
  {
    "Blue Dream": {
      strain_type: "Hybrid",
      lineage: "Blueberry x Haze",
      nose: ["Berry", "Sweet", "Herbal"],
      effects: ["Uplifting", "Creative"],
      terpene_profile: ["Myrcene", "Pinene"],
      description: "..."
    }
  }
  ```

### Loading States

#### 17. `loading` (useState)
- **Type**: `boolean`
- **Default**: `false`
- **Purpose**: Single product submission loading state

#### 18. `loadingFields` (useState)
- **Type**: `boolean`
- **Default**: `false`
- **Purpose**: Dynamic fields loading state (when category changes)

#### 19. `uploadingImages` (useState)
- **Type**: `boolean`
- **Default**: `false`
- **Purpose**: Image upload in progress indicator

#### 20. `loadingAI` (useState)
- **Type**: `boolean`
- **Default**: `false`
- **Purpose**: AI autofill/enrichment processing state

#### 21. `bulkProcessing` (useState)
- **Type**: `boolean`
- **Default**: `false`
- **Purpose**: Bulk product submission loading state

---

## Functions & Methods

### Lifecycle & Data Loading

#### `useEffect` - Load Categories (Lines 92-104)
- **Trigger**: Component mount
- **Purpose**: Fetches available product categories
- **API Call**: `GET /api/supabase/categories?parent=null&active=true`
- **Success**: Updates `categories` state
- **Error Handling**: Console log, no user notification

#### `useEffect` - Load Dynamic Fields (Lines 106-137)
- **Trigger**: `formData.category_id`, `bulkCategory`, `vendor.id`, or `inputMode` change
- **Purpose**: Fetches category-specific custom fields
- **Logic**:
  1. Determines category ID based on input mode
  2. Returns early if no category or vendor
  3. Sets `loadingFields` to true
  4. Calls API with vendor authentication
  5. Maps response to standardized field structure
- **API Call**: `GET /api/vendor/product-fields?category_id={categoryId}` (with `x-vendor-id` header)
- **Transform**: Ensures `label` and `name` fields are populated
- **Dependencies**: `vendor.id`, category selection

### AI Features

#### `handleAIAutofill` (Lines 139-205)
- **Purpose**: AI-powered single product data enrichment
- **Validations**:
  - Requires `formData.name` to be non-empty
  - Requires `formData.category_id` to be selected
- **Process**:
  1. Validates product name and category
  2. Finds category name from categories array
  3. Calls AI API with product name and category
  4. Parses suggestions for specific fields: `strain_type`, `lineage`, `nose`, `effects`, `terpene_profile`, `description`
  5. Transforms arrays (nose) to comma-separated strings
  6. Updates `customFieldValues` and `formData.description`
- **API Call**: `POST /api/ai/quick-autofill`
- **Payload**:
  ```typescript
  {
    productName: string,
    category: string,
    selectedFields: string[]
  }
  ```
- **Success Notification**: Shows count of fields populated
- **Error Handling**: Shows error notification, console log

#### `handleBulkAIEnrich` (Lines 207-340)
- **Purpose**: AI enrichment for multiple products via streaming API
- **Validations**:
  - Requires `bulkInput` to be non-empty
  - Requires `bulkCategory` to be selected
- **Process**:
  1. Validates input and category
  2. Parses bulk input line-by-line
  3. Extracts product name, price, cost from CSV format
  4. Creates preliminary product objects
  5. Calls streaming AI API
  6. Reads streaming response using ReadableStream API
  7. Buffers and parses SSE (Server-Sent Events) format
  8. Collects complete results
  9. Maps AI data to product custom_fields
  10. Updates `bulkProducts` and `bulkEnrichedData`
- **API Call**: `POST /api/ai/bulk-autofill-stream` (streaming)
- **Payload**:
  ```typescript
  {
    products: Array<{name: string, price: string, cost: string}>,
    category: string,
    selectedFields: string[]
  }
  ```
- **Streaming Protocol**: SSE with `data: {JSON}` format
- **Success**: Shows enrichment success ratio (X/Y products)
- **Error Handling**: Catches stream errors, shows error notification

### Image Management

#### `handleImageUpload` (Lines 342-400)
- **Purpose**: Handles image file selection, preview generation, and cloud upload
- **Trigger**: File input change event
- **Process**:
  1. Converts FileList to array
  2. Appends to `imageFiles` state
  3. Generates base64 previews via FileReader
  4. Uploads files to cloud storage in parallel
  5. Stores returned URLs in `uploadedImageUrls`
- **API Call**: `POST /api/supabase/vendor/upload` (with `x-vendor-id` header)
- **Upload Details**:
  - FormData with `file` and `type: 'product'`
  - Parallel uploads via `Promise.all`
- **Success**: Shows count of uploaded images
- **Error Handling**: Catches upload failures, shows error notification
- **Authentication**: Requires `vendor.id`

#### `removeImage` (Lines 402-406)
- **Purpose**: Removes image from all image-related state arrays
- **Parameters**: `index: number`
- **Updates**: Filters `imageFiles`, `imagePreviews`, and `uploadedImageUrls`
- **Note**: Does not delete from cloud storage (file remains)

### Pricing Management

#### `addPricingTier` (Lines 409-411)
- **Purpose**: Adds new empty pricing tier
- **Default Values**: `{ weight: '', qty: 1, price: '' }`
- **Updates**: Appends to `pricingTiers` array

#### `updatePricingTier` (Lines 413-421)
- **Purpose**: Updates specific field in pricing tier
- **Parameters**:
  - `index: number` - Tier index
  - `field: string` - Field to update
  - `value: string` - New value
- **Special Handling**: Parses `qty` field as integer
- **Immutability**: Maps over array, returns new array

#### `removePricingTier` (Lines 423-425)
- **Purpose**: Removes pricing tier by index
- **Parameters**: `index: number`
- **Updates**: Filters `pricingTiers` array

### Product Submission

#### `handleBulkSubmit` (Lines 427-538)
- **Purpose**: Submits all bulk products to backend
- **Validations**: Requires `bulkProducts.length > 0`
- **Process**:
  1. Validates products exist
  2. Sets `bulkProcessing` to true
  3. Iterates through each product sequentially
  4. Builds product data object with enriched fields
  5. Handles conditional pricing fields
  6. Submits via authenticated API call
  7. Tracks success/fail counts
  8. Shows first failure details
  9. Shows final summary
  10. Redirects to products page on success
- **API Call**: `POST /api/vendor/products` (with `x-vendor-id` header, withCredentials)
- **Payload Structure**:
  ```typescript
  {
    name: string,
    category_id: string,
    product_type: 'simple',
    product_visibility: 'internal',
    pricing_mode: 'single' | 'tiered',
    custom_fields: Record<string, any>,
    description: string,
    price?: number,           // if single pricing
    cost_price?: number,      // if single pricing
    pricing_tiers?: Array     // if tiered pricing
  }
  ```
- **Error Details**: Parses validation errors, shows field-specific messages
- **Success**: Shows success/fail counts, redirects after 1.5s
- **Note**: Products created even if some fail

#### `handleSubmit` (Lines 540-612)
- **Purpose**: Submits single product form
- **Trigger**: Form submit event
- **Validations**:
  - Product name required
  - Category required
  - Price required (if single pricing)
  - At least one tier required (if tiered pricing)
- **Process**:
  1. Prevents default form submission
  2. Validates required fields
  3. Builds product data object
  4. Includes uploaded image URLs
  5. Handles pricing mode conditionally
  6. Submits via authenticated API
  7. Shows success notification
  8. Redirects after 1.5s delay
- **API Call**: `POST /api/vendor/products` (same as bulk)
- **Payload Structure**: Same as bulk, but with `image_urls` and `initial_quantity`
- **Special Fields**:
  - `cost_price`: Nullable, parsed as float
  - `initial_quantity`: Nullable, parsed as float
  - `image_urls`: Array of cloud URLs
- **Error Handling**: Shows error notification with API error message

### UI Rendering

#### `renderField` (Lines 614-692)
- **Purpose**: Dynamically renders custom field inputs based on type
- **Parameters**: `field: DynamicField`
- **Return**: React component or null
- **Field Types**:
  1. **text/number**: Standard Input component
  2. **textarea**: Textarea component (3 rows)
  3. **select**: Dropdown with options
  4. **multiselect**: Pill-style multi-selection buttons
- **State Management**: Reads/writes from `customFieldValues`
- **Styling**: Uses design system classes (`ds.*`)
- **MultiSelect Behavior**: Toggle-style selection, stores array

#### `groupedFields` (Lines 695-700)
- **Purpose**: Groups dynamic fields by `groupName` for organized display
- **Method**: Reduce operation creating object keyed by group name
- **Default Group**: 'Other' if no group specified
- **Return**: `Record<string, DynamicField[]>`
- **Usage**: Renders fields in sections with optional group headers

---

## Feature List

### Core Features

1. **Dual Input Modes**
   - Single product creation with full form
   - Bulk import via CSV-style text input
   - Mode toggle with visual indicators

2. **Category Management**
   - Dynamic category dropdown
   - Loads active parent categories only
   - Triggers custom field loading on selection

3. **Dynamic Custom Fields**
   - Category-specific fields (strain info, effects, etc.)
   - Multiple field types: text, number, textarea, select, multiselect
   - Optional field grouping
   - Required field indicators
   - Help text/descriptions

4. **Flexible Pricing**
   - **Single Pricing**: One price per product
   - **Tiered Pricing**: Multiple weight/price combinations
   - Cost price tracking
   - Dynamic tier management (add/remove)

5. **Image Upload**
   - Multiple image selection
   - Real-time preview generation
   - Cloud storage upload with progress
   - Individual image removal
   - Drag-and-drop ready UI

6. **AI-Powered Autofill**
   - **Single Product**: Quick autofill for strain data
   - **Bulk Products**: Batch enrichment via streaming API
   - Enriches: strain_type, lineage, nose, effects, terpene_profile, description
   - Real-time streaming feedback for bulk operations

7. **Bulk Import Workflow**
   - CSV-style text input (Name, Price, Cost)
   - AI enrichment before submission
   - Product-by-product review interface
   - Navigation controls (prev/next)
   - Inline editing of parsed data
   - Batch submission with progress tracking

8. **Inventory Management**
   - Initial quantity field (grams)
   - Conditional display based on category selection

9. **Validation & Error Handling**
   - Required field validation
   - Inline error messages
   - Detailed API error display
   - First-failure focus in bulk operations

10. **User Feedback**
    - Toast notifications for all operations
    - Loading states for all async operations
    - Success/failure counts for bulk operations
    - Progress indicators

### User Experience Features

11. **Responsive Navigation**
    - Back to products link
    - Cancel buttons with confirmation
    - Auto-redirect on successful submission

12. **Visual Polish**
    - Design system consistency
    - Icon-enhanced buttons
    - Hover states and transitions
    - Disabled state styling
    - Loading spinners

13. **Data Persistence**
    - Form state maintained during field changes
    - Bulk review maintains product edits
    - Image previews persist until removal

14. **Accessibility**
    - Proper label associations
    - Keyboard navigation support
    - Focus management
    - Semantic HTML structure

---

## Data Flow

### Single Product Creation Flow

```
1. User enters product name
   └─> formData.name updated

2. User selects category
   └─> formData.category_id updated
   └─> Triggers field loading
       └─> API: GET /api/vendor/product-fields
       └─> dynamicFields populated
       └─> Custom fields rendered

3. (Optional) User clicks "AI Fill"
   └─> handleAIAutofill() called
   └─> API: POST /api/ai/quick-autofill
   └─> customFieldValues updated
   └─> formData.description updated

4. User fills form fields
   └─> formData updated (basic fields)
   └─> customFieldValues updated (custom fields)
   └─> pricingTiers updated (if tiered)

5. User uploads images
   └─> handleImageUpload() called
   └─> imageFiles, imagePreviews updated
   └─> API: POST /api/supabase/vendor/upload
   └─> uploadedImageUrls populated

6. User clicks "Create Product"
   └─> handleSubmit() called
   └─> Validation checks performed
   └─> Product data object built
   └─> API: POST /api/vendor/products
   └─> Success: Redirect to /vendor/products
   └─> Error: Show notification
```

### Bulk Import Flow

```
1. User selects bulk mode
   └─> inputMode set to 'bulk'

2. User selects category
   └─> bulkCategory updated
   └─> Triggers field loading
       └─> API: GET /api/vendor/product-fields
       └─> dynamicFields populated (for reference)

3. User pastes bulk data
   └─> bulkInput updated
   └─> Format: "Name, Price, Cost" per line

4. User clicks "Enrich with AI"
   └─> handleBulkAIEnrich() called
   └─> Parse bulkInput into product list
   └─> API: POST /api/ai/bulk-autofill-stream
   └─> Stream processing:
       ├─> Read chunks via ReadableStream
       ├─> Parse SSE messages
       └─> Accumulate results
   └─> bulkEnrichedData populated
   └─> bulkProducts created with AI data
   └─> currentReviewIndex set to 0

5. Review phase activated
   └─> User reviews each product
   └─> Can edit name, price, cost_price
   └─> Navigate with prev/next buttons
   └─> AI data displayed as read-only reference

6. User clicks "Create X Products"
   └─> handleBulkSubmit() called
   └─> Sequential API calls:
       ├─> For each product:
       │   └─> API: POST /api/vendor/products
       └─> Track success/fail counts
   └─> Show summary notification
   └─> Success: Redirect to /vendor/products
   └─> Partial success: Stay on page
```

### Category Field Loading Flow

```
Category Selection
   └─> useEffect triggered
   └─> Determine category (single or bulk)
   └─> loadingFields set to true
   └─> API: GET /api/vendor/product-fields?category_id={id}
       Headers: x-vendor-id
   └─> Response transformed:
       ├─> Ensure label field
       ├─> Ensure name/slug field
       └─> Map to DynamicField interface
   └─> dynamicFields updated
   └─> loadingFields set to false
   └─> Fields rendered via renderField()
   └─> Grouped by groupName
```

### Image Upload Flow

```
User selects files
   └─> handleImageUpload() triggered
   └─> File validation (client-side)
   └─> For each file:
       ├─> Add to imageFiles
       ├─> Generate preview:
       │   └─> FileReader.readAsDataURL()
       │   └─> Add to imagePreviews
       └─> Upload to cloud:
           └─> FormData created
           └─> API: POST /api/supabase/vendor/upload
               Headers: x-vendor-id
               Body: file + type
           └─> URL returned
           └─> Add to uploadedImageUrls
   └─> Parallel upload via Promise.all
   └─> Success notification
   └─> Images displayed with remove option
```

---

## External Dependencies

### Context Providers

1. **useAppAuth** (`@/context/AppAuthContext`)
   - **Provides**: `vendor` object
   - **Used For**:
     - Vendor ID for API authentication
     - Headers: `x-vendor-id`
     - Credentials validation
   - **Properties Used**:
     - `vendor.id`: Vendor UUID
     - `vendor.store_name`: (available but not used)

### Routing

2. **useRouter** (`next/navigation`)
   - **Used For**: Navigation after successful submission
   - **Method**: `router.push('/vendor/products')`
   - **Timing**: 1500ms delay after success notification

### UI Components

3. **Design System** (`@/components/ds`)
   - **Button**: Primary action buttons
   - **Input**: Text/number inputs
   - **Textarea**: Multi-line text fields
   - **ds**: Design tokens (colors, typography, spacing)
   - **cn**: className utility function

4. **Notification System** (`@/components/NotificationToast`)
   - **showNotification**: Display toast messages
   - **Types**: success, error, warning, info
   - **Parameters**: type, title, message, duration

### Icons

5. **lucide-react**
   - ArrowLeft, Save, Sparkles, Package, Upload, X
   - ChevronLeft, ChevronRight, Layers
   - ImageIcon, DollarSign, Plus, Minus
   - **Usage**: Button icons, visual indicators

### HTTP Client

6. **axios**
   - **Used For**: Most API calls
   - **Configuration**:
     - Headers: `x-vendor-id`, `Content-Type`
     - Credentials: `withCredentials: true`
   - **Methods**: `axios.get()`, `axios.post()`

7. **fetch API**
   - **Used For**: Streaming AI API only
   - **Reason**: Requires ReadableStream support
   - **Method**: `fetch()` with manual stream reading

### Utilities

8. **React Hooks**
   - `useState`: All state management
   - `useEffect`: Lifecycle and data loading

9. **TypeScript**
   - Strong typing for all state and props
   - Interface definitions for API responses
   - Type safety in function parameters

---

## TypeScript Interfaces

### Defined in Component

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
}

interface DynamicField {
  name: string;
  slug?: string;
  type: string;  // 'text' | 'number' | 'textarea' | 'select' | 'multiselect'
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: string[];
  groupName?: string;
}

interface BulkProduct {
  name: string;
  price: string;
  cost_price: string;
  pricing_mode: 'single' | 'tiered';
  pricing_tiers: Array<{weight: string, qty: number, price: string}>;
  custom_fields: Record<string, any>;
}
```

### From Context (AppAuthContext)

```typescript
interface Vendor {
  id: string;
  store_name: string;
  slug: string;
  logo_url?: string;
  vendor_type?: 'standard' | 'distributor' | 'both';
  wholesale_enabled?: boolean;
  pos_enabled?: boolean;
  marketing_provider?: 'builtin' | 'alpineiq';
  marketing_config?: any;
}
```

---

## Component Architecture

### File Structure

```
NewProductClient (Root Component)
├─> Router Integration (useRouter)
├─> Authentication (useAppAuth)
├─> State Management (21 useState hooks)
├─> Effects
│   ├─> Category Loading
│   └─> Dynamic Field Loading
├─> Event Handlers
│   ├─> AI Autofill (single & bulk)
│   ├─> Image Management
│   ├─> Pricing Management
│   └─> Form Submission (single & bulk)
├─> Render Utilities
│   ├─> renderField()
│   └─> groupedFields computation
└─> JSX Structure
    ├─> Header
    ├─> Mode Toggle
    ├─> Single Product Form
    │   ├─> Basic Info Section
    │   ├─> Pricing Section
    │   ├─> Images Section
    │   ├─> Dynamic Fields Section
    │   ├─> Inventory Section
    │   └─> Action Buttons
    └─> Bulk Import Interface
        ├─> Category Selection
        ├─> Text Input Area
        ├─> AI Enrich Button
        ├─> Review Interface (when products parsed)
        │   ├─> Product Navigator
        │   ├─> Edit Fields
        │   └─> AI Data Display
        └─> Submit Button
```

### Component Responsibilities

1. **Data Fetching**: Categories and dynamic fields
2. **User Input**: Form fields, file uploads, text areas
3. **Data Transformation**: CSV parsing, AI enrichment mapping
4. **Validation**: Client-side checks before submission
5. **API Communication**: Product creation, image upload, AI calls
6. **State Synchronization**: Coordinating 21 state variables
7. **User Feedback**: Loading states, notifications, errors
8. **Navigation**: Mode switching, bulk review navigation

### Key Design Patterns

1. **Controlled Components**: All inputs tied to state
2. **Conditional Rendering**: Based on mode and state
3. **Async/Await**: For all API calls except streaming
4. **Stream Processing**: For bulk AI enrichment
5. **Error Boundaries**: Try-catch blocks on all operations
6. **Optimistic Updates**: State updates before API confirmation
7. **Declarative UI**: JSX structure based on state
8. **Functional Programming**: Map, filter, reduce for transformations

---

## API Endpoints Used

### Product Operations
- **POST** `/api/vendor/products` - Create product (single or bulk)
  - Auth: x-vendor-id header, HTTP-only cookie
  - Payload: Product data object

### Category & Field Management
- **GET** `/api/supabase/categories?parent=null&active=true` - Fetch categories
- **GET** `/api/vendor/product-fields?category_id={id}` - Fetch custom fields
  - Auth: x-vendor-id header

### AI Services
- **POST** `/api/ai/quick-autofill` - Single product enrichment
  - Payload: productName, category, selectedFields
- **POST** `/api/ai/bulk-autofill-stream` - Bulk enrichment (streaming)
  - Payload: products array, category, selectedFields
  - Response: SSE stream

### File Management
- **POST** `/api/supabase/vendor/upload` - Image upload
  - Auth: x-vendor-id header
  - Payload: FormData with file and type
  - Returns: { success: boolean, file: { url: string } }

---

## Critical Implementation Notes

### Authentication
- All vendor operations require `vendor.id` from context
- Headers use `x-vendor-id` for API authentication
- Backend validates via HTTP-only session cookie

### AI Integration
- Single product uses quick-autofill (regular request)
- Bulk uses streaming API for better UX
- Streaming parses SSE format: `data: {JSON}\n`
- Enrichment is optional and may fail gracefully

### Image Handling
- Files uploaded immediately on selection
- URLs stored separately from file objects
- Remove function doesn't delete from cloud storage
- Upload happens in parallel via Promise.all

### Bulk Import
- Sequential submission (not parallel)
- First error shown in detail, rest counted
- Partial success allowed (some products may succeed)
- Review interface allows editing before submission

### Form Validation
- Client-side only (no server-side re-validation shown)
- Required fields checked before submission
- Pricing mode determines required fields
- Category selection triggers field reload

### State Management
- No global state management library used
- 21 local state variables
- Some state interdependencies (category triggers fields)
- Reset patterns not implemented (page reload required)

### Performance Considerations
- Parallel image uploads for speed
- Streaming AI for large bulk operations
- Sequential bulk submission (could be parallelized)
- No debouncing on inputs (immediate state updates)

---

## Refactoring Recommendations

If refactoring this component, consider:

1. **State Management**: Extract to custom hooks or context
2. **Form Handling**: Use react-hook-form or similar
3. **API Layer**: Abstract API calls into service modules
4. **Validation**: Centralized validation schema (Zod/Yup)
5. **Component Split**:
   - SingleProductForm component
   - BulkImportForm component
   - ImageUploader component
   - PricingManager component
   - DynamicFieldRenderer component
6. **Error Handling**: Centralized error handling utility
7. **Type Safety**: Extract interfaces to shared types file
8. **Testing**: Current structure difficult to test, needs modularization
9. **Accessibility**: Add ARIA labels, focus management
10. **Performance**: Memoization for expensive computations

---

**Document Version**: 1.0
**Last Updated**: 2025-11-04
**Lines of Code**: 1255
**Complexity**: High (21 state variables, 15+ functions, 3 API integrations)
