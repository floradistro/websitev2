'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Monitor, Grid3x3, Check, Settings } from 'lucide-react';

interface Device {
  id: string;
  device_name: string;
  tv_number: number;
  screen_size_inches: number;
  connection_status: string;
}

interface GroupConfigWizardProps {
  vendorId: string;
  existingGroup?: any;
  onComplete: (groupData: any) => void;
  onClose: () => void;
}

// Display groups now only configure layout - all theme/pricing/display settings moved to main menu editor

export default function GroupConfigWizard({ vendorId, existingGroup, onComplete, onClose }: GroupConfigWizardProps) {
  const [step, setStep] = useState(1);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availablePricingTiers, setAvailablePricingTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state - ONLY device grouping (all config moved to main menu editor)
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [deviceCategories, setDeviceCategories] = useState<{ [deviceId: string]: string[] }>({});

  useEffect(() => {
    loadData();
  }, [vendorId]);

  // Pre-fill form when editing
  useEffect(() => {
    if (existingGroup) {
      setGroupName(existingGroup.name || '');
      setGroupDescription(existingGroup.description || '');

      // Set selected devices and categories
      if (existingGroup.members) {
        const deviceIds = existingGroup.members.map((m: any) => m.device_id);
        setSelectedDevices(deviceIds);

        const categories: { [deviceId: string]: string[] } = {};
        existingGroup.members.forEach((m: any) => {
          categories[m.device_id] = m.assigned_categories || [];
        });
        setDeviceCategories(categories);
      }
    }
  }, [existingGroup]);

  const loadData = async () => {
    try {
      // Load available devices
      const devicesResponse = await fetch(`/api/vendor/tv-devices?vendor_id=${vendorId}`);
      const devicesData = await devicesResponse.json();
      if (devicesData.success) {
        setAvailableDevices(devicesData.devices);
      }

      // Load available categories
      const categoriesResponse = await fetch(`/api/vendor/products/categories?vendor_id=${vendorId}`);
      const categoriesData = await categoriesResponse.json();
      console.log('📂 Categories API response:', categoriesData);
      if (categoriesData.success) {
        console.log('✅ Loaded categories:', categoriesData.categories);
        setAvailableCategories(categoriesData.categories || []);
      } else {
        console.error('❌ Failed to load categories:', categoriesData.error);
        setAvailableCategories([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    );
  };

  const handleCategoryToggle = (deviceId: string, category: string) => {
    setDeviceCategories((prev) => {
      const current = prev[deviceId] || [];
      const updated = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return { ...prev, [deviceId]: updated };
    });
  };

  const handleComplete = () => {
    const devices = selectedDevices.map((deviceId, index) => ({
      deviceId,
      position: index + 1,
      categories: deviceCategories[deviceId] || [],
    }));

    onComplete({
      name: groupName,
      description: groupDescription,
      devices,
    });
  };

  const canProceed = () => {
    if (step === 1) return groupName.trim() && selectedDevices.length >= 2;
    return false; // Only 2 steps now
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Display Group</h2>
            <p className="text-white/60 text-sm mt-1">
              Step {step} of 2: {step === 1 ? 'Select Displays & Name' : 'Assign Categories Per Display'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: '50%' }}
            animate={{ width: `${(step / 2) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Displays */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Main Wall, Checkout Counter"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Brief description of this display group"
                    rows={2}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Select Displays (minimum 2) *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableDevices.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => handleDeviceToggle(device.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedDevices.includes(device.id)
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-white/60" />
                            <span className="font-medium text-white">{device.device_name}</span>
                          </div>
                          {selectedDevices.includes(device.id) && (
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/60">
                          <span>{device.screen_size_inches}"</span>
                          <span className="w-1 h-1 rounded-full bg-white/40" />
                          <span>TV #{device.tv_number}</span>
                          <span className="w-1 h-1 rounded-full bg-white/40" />
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                device.connection_status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                              }`}
                            />
                            <span>{device.connection_status}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedDevices.length === 1 && (
                    <p className="text-yellow-400 text-sm mt-2">
                      Select at least one more display to create a group
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Assign Categories */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl mb-4">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Grid3x3 className="w-5 h-5 text-purple-400" />
                    Category Assignment Per Display
                  </h3>
                  <p className="text-sm text-white/70">
                    Assign specific product categories to each display. All grid, theme, pricing, and display settings are configured in the main "Displays & Menus" editor.
                  </p>
                  <p className="text-xs text-white/50 mt-2">
                    💡 Tip: Leave empty to show all categories on that display
                  </p>
                </div>

                {availableCategories.length === 0 ? (
                  <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                    <p className="text-yellow-200 mb-2">No categories found</p>
                    <p className="text-sm text-white/60">
                      Add product categories in your Products page first, then they'll appear here.
                    </p>
                  </div>
                ) : (
                  selectedDevices.map((deviceId, index) => {
                    const device = availableDevices.find((d) => d.id === deviceId);
                    if (!device) return null;

                    const selectedCount = (deviceCategories[deviceId] || []).length;

                    return (
                      <div key={deviceId} className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                              <Monitor className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <div className="font-medium text-white">{device.device_name}</div>
                              <div className="text-xs text-white/40">
                                Display {index + 1} of {selectedDevices.length}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm">
                            {selectedCount > 0 ? (
                              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                                {selectedCount} {selectedCount === 1 ? 'category' : 'categories'}
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-white/10 text-white/40 rounded-full">
                                All categories
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {availableCategories.map((category) => {
                            const isSelected = (deviceCategories[deviceId] || []).includes(category);
                            return (
                              <button
                                key={category}
                                onClick={() => handleCategoryToggle(deviceId, category)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                {category}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-sm text-white/80">
                    <div className="font-medium mb-1">AI Tip</div>
                    <div className="text-white/60">
                      Try to balance product counts across displays for a professional look. Categories with similar product counts work best together.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all"
              >
                <Check className="w-4 h-4" />
                Create Display Group
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
