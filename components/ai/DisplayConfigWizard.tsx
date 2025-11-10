"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Monitor,
  MapPin,
  Target,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface DisplayConfigWizardProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  deviceName: string;
  vendorId: string;
  onComplete: (profileId: string) => void;
}

interface ProfileData {
  screenWidthInches: number;
  screenHeightInches: number;
  resolutionWidth: number;
  resolutionHeight: number;
  viewingDistanceFeet: number;
  locationType: string;
  ambientLighting: string;
  avgDwellTimeSeconds: number;
  customerBehavior: string;
  adjacentTo: string;
  storeType: string;
  brandVibe: string;
  targetAudience: string;
  businessGoals: string[];
}

const SCREEN_SIZES = [
  { label: '32"', width: 28, height: 16 },
  { label: '43"', width: 37.5, height: 21 },
  { label: '50"', width: 43.6, height: 24.5 },
  { label: '55"', width: 47.9, height: 27 },
  { label: '65"', width: 56.7, height: 31.9 },
  { label: '75"', width: 65.4, height: 36.8 },
  { label: "Custom", width: 0, height: 0 },
];

const RESOLUTIONS = [
  { label: "Full HD", width: 1920, height: 1080 },
  { label: "4K UHD", width: 3840, height: 2160 },
];

const LOCATION_TYPES = [
  {
    value: "checkout",
    label: "Checkout Counter",
    description: "Quick glance while paying",
  },
  {
    value: "entrance",
    label: "Store Entrance",
    description: "First impression, quick scan",
  },
  {
    value: "waiting",
    label: "Waiting Area",
    description: "Longer viewing time",
  },
  {
    value: "wall_menu",
    label: "Wall Menu",
    description: "Main product browsing",
  },
  { value: "other", label: "Other Location", description: "Custom placement" },
];

const BUSINESS_GOALS = [
  "Increase high-margin sales",
  "Educate customers",
  "Clear old inventory",
  "Promote new products",
  "Build brand awareness",
  "Speed up checkout",
];

export default function DisplayConfigWizard({
  isOpen,
  onClose,
  deviceId,
  deviceName,
  vendorId,
  onComplete,
}: DisplayConfigWizardProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    screenWidthInches: 55,
    screenHeightInches: 31,
    resolutionWidth: 1920,
    resolutionHeight: 1080,
    viewingDistanceFeet: 10,
    locationType: "wall_menu",
    ambientLighting: "medium",
    avgDwellTimeSeconds: 30,
    customerBehavior: "",
    adjacentTo: "",
    storeType: "dispensary",
    brandVibe: "casual",
    targetAudience: "",
    businessGoals: [],
  });

  const updateProfile = (updates: Partial<ProfileData>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const selectScreenSize = (size: (typeof SCREEN_SIZES)[0]) => {
    if (size.width > 0) {
      updateProfile({
        screenWidthInches: size.width,
        screenHeightInches: size.height,
      });
    }
  };

  const toggleBusinessGoal = (goal: string) => {
    const current = profile.businessGoals;
    const updated = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : [...current, goal];
    updateProfile({ businessGoals: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Save profile
      const response = await fetch("/api/ai/display-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          vendorId,
          ...profile,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save profile");
      }

      onComplete(data.profileId);
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving profile:", err);
      }
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const canProgress = () => {
    if (step === 1)
      return profile.screenWidthInches > 0 && profile.screenHeightInches > 0;
    if (step === 2)
      return profile.viewingDistanceFeet > 0 && profile.locationType;
    if (step === 3) return true;
    return true;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-black border border-white/20 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className="text-2xl font-black text-white"
                style={{ fontWeight: 900 }}
              >
                Configure Display
              </h2>
              <p className="text-white/40 text-sm mt-1">{deviceName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-white/60" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-all ${
                  s <= step ? "bg-white" : "bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Monitor size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Physical Specs
                    </h3>
                    <p className="text-white/40 text-sm">
                      Tell us about your display
                    </p>
                  </div>
                </div>

                {/* Screen Size */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Screen Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {SCREEN_SIZES.map((size) => (
                      <button
                        key={size.label}
                        type="button"
                        onClick={() => selectScreenSize(size)}
                        className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${
                          profile.screenWidthInches === size.width
                            ? "border-white bg-white/10 text-white"
                            : "border-white/10 text-white/60 hover:border-white/30"
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Size */}
                {profile.screenWidthInches === 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-2">
                        Width (inches)
                      </label>
                      <input
                        type="number"
                        value={profile.screenWidthInches || ""}
                        onChange={(e) =>
                          updateProfile({
                            screenWidthInches: parseFloat(e.target.value),
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-2">
                        Height (inches)
                      </label>
                      <input
                        type="number"
                        value={profile.screenHeightInches || ""}
                        onChange={(e) =>
                          updateProfile({
                            screenHeightInches: parseFloat(e.target.value),
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Resolution */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Resolution
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {RESOLUTIONS.map((res) => (
                      <button
                        key={res.label}
                        type="button"
                        onClick={() =>
                          updateProfile({
                            resolutionWidth: res.width,
                            resolutionHeight: res.height,
                          })
                        }
                        className={`p-4 rounded-xl border-2 transition-all ${
                          profile.resolutionWidth === res.width
                            ? "border-white bg-white/10"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="text-white font-bold mb-1">
                          {res.label}
                        </div>
                        <div className="text-white/40 text-xs">
                          {res.width} × {res.height}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Context & Location
                    </h3>
                    <p className="text-white/40 text-sm">
                      Where and how customers see it
                    </p>
                  </div>
                </div>

                {/* Viewing Distance */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Viewing Distance (feet)
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    value={profile.viewingDistanceFeet}
                    onChange={(e) =>
                      updateProfile({
                        viewingDistanceFeet: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-white/40 text-sm mt-2">
                    <span>3ft (close)</span>
                    <span className="text-white font-bold">
                      {profile.viewingDistanceFeet}ft
                    </span>
                    <span>30ft (far)</span>
                  </div>
                </div>

                {/* Location Type */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Display Location
                  </label>
                  <div className="space-y-2">
                    {LOCATION_TYPES.map((loc) => (
                      <button
                        key={loc.value}
                        type="button"
                        onClick={() =>
                          updateProfile({ locationType: loc.value })
                        }
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          profile.locationType === loc.value
                            ? "border-white bg-white/10"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="text-white font-bold mb-1">
                          {loc.label}
                        </div>
                        <div className="text-white/40 text-xs">
                          {loc.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lighting */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Ambient Lighting
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["bright", "medium", "dim"].map((lighting) => (
                      <button
                        key={lighting}
                        type="button"
                        onClick={() =>
                          updateProfile({ ambientLighting: lighting })
                        }
                        className={`p-3 rounded-xl border-2 transition-all capitalize ${
                          profile.ambientLighting === lighting
                            ? "border-white bg-white/10 text-white"
                            : "border-white/10 text-white/60 hover:border-white/30"
                        }`}
                      >
                        {lighting}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dwell Time */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Average Customer Viewing Time (seconds)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    value={profile.avgDwellTimeSeconds}
                    onChange={(e) =>
                      updateProfile({
                        avgDwellTimeSeconds: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-white/40 text-sm mt-2">
                    <span>5s (quick)</span>
                    <span className="text-white font-bold">
                      {profile.avgDwellTimeSeconds}s
                    </span>
                    <span>2min (browsing)</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Target size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Business Goals
                    </h3>
                    <p className="text-white/40 text-sm">
                      What do you want to achieve?
                    </p>
                  </div>
                </div>

                {/* Brand Vibe */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Brand Vibe
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {["premium", "casual", "medical", "recreational"].map(
                      (vibe) => (
                        <button
                          key={vibe}
                          type="button"
                          onClick={() => updateProfile({ brandVibe: vibe })}
                          className={`p-3 rounded-xl border-2 transition-all capitalize ${
                            profile.brandVibe === vibe
                              ? "border-white bg-white/10 text-white"
                              : "border-white/10 text-white/60 hover:border-white/30"
                          }`}
                        >
                          {vibe}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Target Audience (optional)
                  </label>
                  <input
                    type="text"
                    value={profile.targetAudience}
                    onChange={(e) =>
                      updateProfile({ targetAudience: e.target.value })
                    }
                    placeholder="e.g., medical patients, young professionals"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30"
                  />
                </div>

                {/* Business Goals */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Business Goals (select all that apply)
                  </label>
                  <div className="space-y-2">
                    {BUSINESS_GOALS.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleBusinessGoal(goal)}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                          profile.businessGoals.includes(goal)
                            ? "border-white bg-white/10 text-white"
                            : "border-white/10 text-white/60 hover:border-white/30"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}

            <div className="flex-1" />

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProgress()}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-black rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-black rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-white/10"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <Sparkles size={18} />
                    Let AI Optimize
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
