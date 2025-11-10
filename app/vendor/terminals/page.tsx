"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  Plus,
  Edit2,
  Power,
  PowerOff,
  Trash2,
  CreditCard,
  MapPin,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import axios from "axios";
import { showNotification } from "@/components/NotificationToast";
import AdminModal from "@/components/AdminModal";

interface Terminal {
  register_id: string;
  register_number: string;
  register_name: string;
  device_name?: string;
  hardware_model?: string;
  register_status: string;
  location_id: string;
  location_name: string;
  processor_type?: string;
  processor_name?: string;
  processor_active?: boolean;
  v_number?: string;
  merchant_id?: string;
  hc_pos_id?: string;
  last_active_at?: string;
}

interface Location {
  id: string;
  name: string;
}

export default function VendorTerminals() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [filterLocation, setFilterLocation] = useState<string>("all");

  // New terminal form state
  const [newTerminal, setNewTerminal] = useState({
    location_id: "",
    register_name: "",
    device_name: "",
    hardware_model: "Dejavoo P8",
    device_type: "android_tablet",
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadTerminals();
      loadLocations();
    }
  }, [authLoading, isAuthenticated]);

  async function loadTerminals() {
    try {
      setLoading(true);
      const params =
        filterLocation !== "all" ? `?location_id=${filterLocation}` : "";
      const response = await axios.get(`/api/vendor/terminals${params}`);

      if (response.data.terminals) {
        setTerminals(response.data.terminals);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading terminals:", error);
      }
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to load terminals",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadLocations() {
    try {
      const response = await axios.get("/api/vendor/locations");
      if (response.data.success) {
        setLocations(response.data.locations || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading locations:", error);
      }
    }
  }

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadTerminals();
    }
  }, [filterLocation]);

  async function createTerminal() {
    try {
      if (!newTerminal.location_id || !newTerminal.register_name) {
        showNotification({
          type: "error",
          title: "Error",
          message: "Please fill in all required fields",
        });
        return;
      }

      const response = await axios.post("/api/vendor/terminals", {
        action: "create",
        ...newTerminal,
      });

      if (response.data.terminal) {
        showNotification({
          type: "success",
          title: "Terminal Created",
          message: "New terminal added successfully",
        });
        setShowAddModal(false);
        setNewTerminal({
          location_id: "",
          register_name: "",
          device_name: "",
          hardware_model: "Dejavoo P8",
          device_type: "android_tablet",
        });
        loadTerminals();
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "Failed to create terminal",
      });
    }
  }

  async function updateTerminal() {
    if (!editingTerminal) return;

    try {
      const response = await axios.post("/api/vendor/terminals", {
        action: "update",
        id: editingTerminal.register_id,
        register_name: editingTerminal.register_name,
        device_name: editingTerminal.device_name,
        hardware_model: editingTerminal.hardware_model,
      });

      if (response.data.terminal) {
        showNotification({
          type: "success",
          title: "Terminal Updated",
          message: "Terminal updated successfully",
        });
        setShowEditModal(false);
        setEditingTerminal(null);
        loadTerminals();
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "Failed to update terminal",
      });
    }
  }

  async function toggleTerminalStatus(terminal: Terminal) {
    try {
      const action =
        terminal.register_status === "active" ? "deactivate" : "activate";

      const response = await axios.post("/api/vendor/terminals", {
        action,
        id: terminal.register_id,
      });

      if (response.data.terminal) {
        showNotification({
          type: "success",
          title: "Status Updated",
          message: `Terminal ${action}d successfully`,
        });
        loadTerminals();
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "Failed to update status",
      });
    }
  }

  async function deleteTerminal(terminal: Terminal) {
    if (
      !confirm(
        `Are you sure you want to delete terminal "${terminal.register_name}"?`,
      )
    ) {
      return;
    }

    try {
      const response = await axios.post("/api/vendor/terminals", {
        action: "delete",
        id: terminal.register_id,
      });

      showNotification({
        type: "success",
        title: "Terminal Deleted",
        message: "Terminal deleted successfully",
      });
      loadTerminals();
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "Failed to delete terminal",
      });
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredTerminals = terminals;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  POS Terminals
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your point-of-sale devices and registers
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Terminal
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Filter by Location:
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Terminals Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading terminals...</p>
          </div>
        ) : filteredTerminals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No terminals found
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first POS terminal
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Terminal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTerminals.map((terminal) => (
              <div
                key={terminal.register_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        terminal.register_status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {terminal.register_status === "active" ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {terminal.register_status}
                    </span>
                    <Activity
                      className={`w-5 h-5 ${terminal.last_active_at ? "text-green-500" : "text-gray-400"}`}
                    />
                  </div>

                  {/* Terminal Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {terminal.register_name}
                    </h3>
                    <p className="text-sm text-gray-600 font-mono">
                      {terminal.register_number}
                    </p>
                  </div>

                  {/* Device Info */}
                  {terminal.device_name && (
                    <div className="mb-3 flex items-center text-sm text-gray-600">
                      <Smartphone className="w-4 h-4 mr-2 text-gray-400" />
                      {terminal.device_name} ({terminal.hardware_model})
                    </div>
                  )}

                  {/* Location */}
                  <div className="mb-3 flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {terminal.location_name}
                  </div>

                  {/* Payment Processor */}
                  {terminal.processor_name ? (
                    <div className="mb-4 flex items-center text-sm text-gray-600">
                      <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                      {terminal.processor_name}
                    </div>
                  ) : (
                    <div className="mb-4 flex items-center text-sm text-amber-600">
                      <CreditCard className="w-4 h-4 mr-2" />
                      No processor configured
                    </div>
                  )}

                  {/* Dejavoo Info */}
                  {terminal.merchant_id && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-500 font-semibold mb-1">
                        Dejavoo Config
                      </p>
                      <p className="text-xs text-gray-600">
                        MID: {terminal.merchant_id}
                      </p>
                      {terminal.v_number && (
                        <p className="text-xs text-gray-600">
                          V#: {terminal.v_number}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Last Active */}
                  {terminal.last_active_at && (
                    <div className="text-xs text-gray-500 mb-4">
                      Last active:{" "}
                      {new Date(terminal.last_active_at).toLocaleString()}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setEditingTerminal(terminal as any);
                        setShowEditModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleTerminalStatus(terminal)}
                      className={`flex-1 inline-flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium ${
                        terminal.register_status === "active"
                          ? "border-red-300 text-red-700 bg-white hover:bg-red-50"
                          : "border-green-300 text-green-700 bg-white hover:bg-green-50"
                      }`}
                    >
                      {terminal.register_status === "active" ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteTerminal(terminal)}
                      className="p-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Terminal Modal */}
      <AdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Terminal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <select
              value={newTerminal.location_id}
              onChange={(e) =>
                setNewTerminal({ ...newTerminal, location_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Register Name *
            </label>
            <input
              type="text"
              value={newTerminal.register_name}
              onChange={(e) =>
                setNewTerminal({
                  ...newTerminal,
                  register_name: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Front Counter, Mobile 1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Name
            </label>
            <input
              type="text"
              value={newTerminal.device_name}
              onChange={(e) =>
                setNewTerminal({ ...newTerminal, device_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Dejavoo P8 #1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hardware Model
            </label>
            <select
              value={newTerminal.hardware_model}
              onChange={(e) =>
                setNewTerminal({
                  ...newTerminal,
                  hardware_model: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Dejavoo P8">Dejavoo P8</option>
              <option value="iPad Pro">iPad Pro</option>
              <option value="Android Tablet">Android Tablet</option>
              <option value="Desktop">Desktop</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={createTerminal}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
            >
              Create Terminal
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Edit Terminal Modal */}
      <AdminModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTerminal(null);
        }}
        title="Edit Terminal"
      >
        {editingTerminal && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Register Name
              </label>
              <input
                type="text"
                value={editingTerminal.register_name}
                onChange={(e) =>
                  setEditingTerminal({
                    ...editingTerminal,
                    register_name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device Name
              </label>
              <input
                type="text"
                value={editingTerminal.device_name || ""}
                onChange={(e) =>
                  setEditingTerminal({
                    ...editingTerminal,
                    device_name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hardware Model
              </label>
              <input
                type="text"
                value={editingTerminal.hardware_model || ""}
                onChange={(e) =>
                  setEditingTerminal({
                    ...editingTerminal,
                    hardware_model: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTerminal(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateTerminal}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
