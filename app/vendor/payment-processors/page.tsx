"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  TestTube2,
  Star,
} from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import axios from "axios";
import { showNotification } from "@/components/NotificationToast";
import AdminModal from "@/components/AdminModal";

import { logger } from "@/lib/logger";
interface PaymentProcessor {
  id: string;
  processor_type: string;
  processor_name: string;
  is_active: boolean;
  is_default: boolean;
  environment: string;
  location: {
    id: string;
    name: string;
  };
  dejavoo_merchant_id?: string;
  dejavoo_store_number?: string;
  dejavoo_v_number?: string;
  last_tested_at?: string;
  last_test_status?: string;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
}

export default function PaymentProcessors() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const [processors, setProcessors] = useState<PaymentProcessor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProcessor, setEditingProcessor] = useState<PaymentProcessor | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  // New processor form state
  const [newProcessor, setNewProcessor] = useState({
    location_id: "",
    processor_type: "dejavoo",
    processor_name: "",
    environment: "production",
    dejavoo_authkey: "",
    dejavoo_tpn: "",
    dejavoo_merchant_id: "",
    dejavoo_store_number: "",
    dejavoo_v_number: "",
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadProcessors();
      loadLocations();
    }
  }, [authLoading, isAuthenticated]);

  async function loadProcessors() {
    try {
      setLoading(true);
      const response = await axios.get("/api/vendor/payment-processors");

      if (response.data.processors) {
        setProcessors(response.data.processors);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading processors:", error);
      }
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to load payment processors",
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
        logger.error("Error loading locations:", error);
      }
    }
  }

  async function createProcessor() {
    try {
      if (!newProcessor.location_id || !newProcessor.processor_name) {
        showNotification({
          type: "error",
          title: "Error",
          message: "Please fill in all required fields",
        });
        return;
      }

      if (newProcessor.processor_type === "dejavoo" && !newProcessor.dejavoo_authkey) {
        showNotification({
          type: "error",
          title: "Error",
          message: "Dejavoo Authkey is required",
        });
        return;
      }

      const response = await axios.post("/api/vendor/payment-processors", {
        action: "create",
        ...newProcessor,
      });

      if (response.data.processor) {
        showNotification({
          type: "success",
          title: "Processor Created",
          message: "Payment processor added successfully",
        });
        setShowAddModal(false);
        setNewProcessor({
          location_id: "",
          processor_type: "dejavoo",
          processor_name: "",
          environment: "production",
          dejavoo_authkey: "",
          dejavoo_tpn: "",
          dejavoo_merchant_id: "",
          dejavoo_store_number: "",
          dejavoo_v_number: "",
        });
        loadProcessors();
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "Failed to create processor",
      });
    }
  }

  async function testProcessor(processorId: string) {
    try {
      setTesting(processorId);
      const response = await axios.post("/api/vendor/payment-processors", {
        action: "test",
        id: processorId,
      });

      if (response.data.success) {
        showNotification({
          type: "success",
          title: "Connection Test",
          message: "Payment processor connection successful",
        });
      } else {
        showNotification({
          type: "error",
          title: "Connection Test",
          message: "Payment processor connection failed",
        });
      }
      loadProcessors();
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "Connection test failed",
      });
    } finally {
      setTesting(null);
    }
  }

  async function setAsDefault(processorId: string, locationId: string) {
    try {
      const response = await axios.post("/api/vendor/payment-processors", {
        action: "set_default",
        id: processorId,
        location_id: locationId,
      });

      if (response.data.processor) {
        showNotification({
          type: "success",
          title: "Default Processor",
          message: "Default payment processor updated",
        });
        loadProcessors();
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "Failed to set default processor",
      });
    }
  }

  async function deleteProcessor(processorId: string) {
    if (!confirm("Are you sure you want to delete this payment processor?")) {
      return;
    }

    try {
      const response = await axios.post("/api/vendor/payment-processors", {
        action: "delete",
        id: processorId,
      });

      showNotification({
        type: "success",
        title: "Processor Deleted",
        message: "Payment processor deleted successfully",
      });
      loadProcessors();
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "Failed to delete processor",
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Payment Processors</h1>
                <p className="text-gray-600 mt-1">
                  Configure payment processing for your locations
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Processor
            </button>
          </div>
        </div>

        {/* Processors Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading processors...</p>
          </div>
        ) : processors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No payment processors configured
            </h3>
            <p className="text-gray-600 mb-6">
              Add a payment processor to start accepting card payments
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Processor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processors.map((processor) => (
              <div
                key={processor.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Status Badges */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        processor.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {processor.is_active ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {processor.is_active ? "Active" : "Inactive"}
                    </span>
                    {processor.is_default && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Star className="w-3 h-3 mr-1" />
                        Default
                      </span>
                    )}
                  </div>

                  {/* Processor Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {processor.processor_name}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">{processor.processor_type}</p>
                  </div>

                  {/* Location */}
                  <div className="mb-3 flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {processor.location.name}
                  </div>

                  {/* Environment */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        processor.environment === "production"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {processor.environment}
                    </span>
                  </div>

                  {/* Dejavoo Info */}
                  {processor.processor_type === "dejavoo" && processor.dejavoo_merchant_id && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-500 font-semibold mb-1">Dejavoo Config</p>
                      <p className="text-xs text-gray-600">MID: {processor.dejavoo_merchant_id}</p>
                      {processor.dejavoo_store_number && (
                        <p className="text-xs text-gray-600">
                          Store: {processor.dejavoo_store_number}
                        </p>
                      )}
                      {processor.dejavoo_v_number && (
                        <p className="text-xs text-gray-600">V#: {processor.dejavoo_v_number}</p>
                      )}
                    </div>
                  )}

                  {/* Last Test */}
                  {processor.last_tested_at && (
                    <div className="mb-4 text-xs text-gray-500">
                      <p>Last tested: {new Date(processor.last_tested_at).toLocaleString()}</p>
                      <p
                        className={
                          processor.last_test_status === "success"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        Status: {processor.last_test_status}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => testProcessor(processor.id)}
                      disabled={testing === processor.id}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50"
                    >
                      <TestTube2 className="w-4 h-4 mr-1" />
                      {testing === processor.id ? "Testing..." : "Test Connection"}
                    </button>

                    {!processor.is_default && (
                      <button
                        onClick={() => setAsDefault(processor.id, processor.location.id)}
                        className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Set as Default
                      </button>
                    )}

                    <button
                      onClick={() => deleteProcessor(processor.id)}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Processor Modal */}
      <AdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Payment Processor"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <select
              value={newProcessor.location_id}
              onChange={(e) =>
                setNewProcessor({
                  ...newProcessor,
                  location_id: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Processor Type *</label>
            <select
              value={newProcessor.processor_type}
              onChange={(e) =>
                setNewProcessor({
                  ...newProcessor,
                  processor_type: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="dejavoo">Dejavoo</option>
              <option value="authorize_net">Authorize.Net</option>
              <option value="stripe">Stripe</option>
              <option value="square">Square</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Processor Name *</label>
            <input
              type="text"
              value={newProcessor.processor_name}
              onChange={(e) =>
                setNewProcessor({
                  ...newProcessor,
                  processor_name: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Dejavoo - Main Location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Environment *</label>
            <select
              value={newProcessor.environment}
              onChange={(e) =>
                setNewProcessor({
                  ...newProcessor,
                  environment: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="production">Production</option>
              <option value="sandbox">Sandbox (Testing)</option>
            </select>
          </div>

          {newProcessor.processor_type === "dejavoo" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authkey *</label>
                <input
                  type="text"
                  value={newProcessor.dejavoo_authkey}
                  onChange={(e) =>
                    setNewProcessor({
                      ...newProcessor,
                      dejavoo_authkey: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10 character authkey"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terminal Profile Number (TPN) *
                </label>
                <input
                  type="text"
                  value={newProcessor.dejavoo_tpn}
                  onChange={(e) =>
                    setNewProcessor({
                      ...newProcessor,
                      dejavoo_tpn: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10-12 character TPN"
                  maxLength={12}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
                <input
                  type="text"
                  value={newProcessor.dejavoo_merchant_id}
                  onChange={(e) =>
                    setNewProcessor({
                      ...newProcessor,
                      dejavoo_merchant_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000000069542"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={createProcessor}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Processor
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
