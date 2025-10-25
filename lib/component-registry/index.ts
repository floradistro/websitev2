/**
 * Component Registry System - Public API
 */

// Registry functions
export {
  getAllComponentTemplates,
  getComponentTemplate,
  getComponentVariants,
  getRecommendedComponents,
  getFieldBindingsForComponent,
  getCompatibleComponents,
  createVendorComponentInstance,
  getVendorComponentInstances,
  updateComponentInstance,
  deleteComponentInstance,
  autoConfigureComponent,
} from './registry';

// Types
export type {
  ComponentTemplate,
  ComponentVariant,
  FieldComponentBinding,
  VendorComponentInstance,
} from './registry';

// Renderer
export {
  DynamicComponent,
  DynamicSection,
  registerComponent,
  getRegisteredComponents,
  isComponentRegistered,
} from './renderer';

export type {
  DynamicComponentProps,
  DynamicSectionProps,
} from './renderer';

