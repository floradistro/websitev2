"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Grid3x3, Settings, Trash2, Monitor } from "lucide-react";
import GroupConfigWizard from "./GroupConfigWizard";

import { logger } from "@/lib/logger";
interface DisplayGroup {
  id: string;
  name: string;
  description?: string;
  shared_theme: string;
  shared_display_mode: string;
  shared_grid_columns: number;
  shared_grid_rows: number;
  members: Array<{
    id: string;
    position_in_group: number;
    assigned_categories: string[];
    device: {
      id: string;
      device_name: string;
      tv_number: number;
      connection_status: string;
    };
  }>;
}

interface DisplayGroupManagerProps {
  vendorId: string;
}

export default function DisplayGroupManager({ vendorId }: DisplayGroupManagerProps) {
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DisplayGroup | null>(null);

  useEffect(() => {
    loadGroups();
  }, [vendorId]);

  const loadGroups = async () => {
    try {
      const response = await fetch(`/api/display-groups?vendor_id=${vendorId}`);
      const data = await response.json();

      if (data.success) {
        setGroups(data.groups);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading display groups:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Delete this display group? Individual displays will not be affected.")) {
      return;
    }

    try {
      const response = await fetch(`/api/display-groups/${groupId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setGroups(groups.filter((g) => g.id !== groupId));
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error deleting group:", error);
      }
    }
  };

  const handleCreateGroup = async (groupData: any) => {
    try {
      if (selectedGroup) {
        // Update existing group

        const response = await fetch(`/api/display-groups/${selectedGroup.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupData),
        });

        const data = await response.json();

        if (data.success) {
          await loadGroups();
          setShowWizard(false);
          setSelectedGroup(null);
        } else {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Failed to update display group:", data.error);
          }
        }
      } else {
        // Create new group
        const response = await fetch("/api/display-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...groupData,
            vendorId,
          }),
        });

        const data = await response.json();
        if (data.success) {
          await loadGroups();
          setShowWizard(false);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error saving group:", error);
      }
    }
  };

  const handleEditGroup = (group: DisplayGroup) => {
    setSelectedGroup(group);
    setShowWizard(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Display Groups</h2>
          <p className="text-white/60 text-sm mt-1">
            Create unified video walls with multiple displays
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Display Group
        </button>
      </div>

      {/* How It Works Info Box */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="bg-purple-500/20 p-3 rounded-lg">
            <Grid3x3 className="w-6 h-6 text-purple-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">Video Wall Management</h3>
            <p className="text-white/70 text-sm mb-3">
              Make multiple TVs side-by-side look identical (same theme & layout) while showing
              different product categories.
            </p>
            <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-white/80">
                  Click "Create Display Group" and select your TVs
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-white/80">Pick a theme and grid size for all TVs</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-white/80">
                  Assign categories: TV1 → Flower, TV2 → Edibles, TV3 → Concentrates
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="text-white/80">
                  Refresh your TV windows - they'll sync automatically!
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs text-purple-300 flex items-center gap-2">
              <Settings className="w-3 h-3" />
              <span>Click "Edit Categories" to change what each TV shows</span>
            </div>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <Grid3x3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Display Groups Yet</h3>
          <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
            Create a display group to unify multiple TVs into a cohesive video wall. All displays
            will share the same theme, layout, and style.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              {/* Group Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                  {group.description && (
                    <p className="text-white/60 text-sm mt-1">{group.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit group"
                  >
                    <Settings className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Group Info */}
              <div className="flex items-center gap-4 mb-4 text-sm text-white/60">
                <div className="flex items-center gap-1">
                  <Monitor className="w-4 h-4" />
                  <span>{group.members.length} displays grouped</span>
                </div>
              </div>

              {/* Display Members */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Displays & Categories
                  </div>
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    Edit Categories
                  </button>
                </div>
                <div className="space-y-2">
                  {group.members
                    .sort((a, b) => a.position_in_group - b.position_in_group)
                    .map((member, idx) => (
                      <div
                        key={member.id}
                        className="bg-white/10 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-white/60 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium text-white text-sm">
                                {member.device.device_name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    member.device.connection_status === "online"
                                      ? "bg-green-400"
                                      : "bg-gray-400"
                                  }`}
                                />
                                <span className="text-xs text-white/40">
                                  {member.device.connection_status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-right">
                            {member.assigned_categories.length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {member.assigned_categories.map((cat) => (
                                  <span
                                    key={cat}
                                    className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded font-medium"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-white/40 italic">All categories</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <GroupConfigWizard
            vendorId={vendorId}
            existingGroup={selectedGroup}
            onComplete={handleCreateGroup}
            onClose={() => {
              setShowWizard(false);
              setSelectedGroup(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
