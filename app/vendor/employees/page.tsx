"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Mail,
  Phone,
  Plus,
  Edit2,
  MapPin,
  Trash2,
  UserX,
  UserCheck,
  Key,
} from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import { ds, cn } from "@/lib/design-system";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  employee_id: string | null;
  status: string;
}

interface Location {
  id: string;
  name: string;
  is_primary: boolean;
}

// Button styles
const buttonStyles = {
  base: "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-light uppercase tracking-wide transition-all duration-200",
  primary:
    "bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white/90 hover:text-white",
  ghost:
    "bg-transparent hover:bg-white/5 text-white/60 hover:text-white/80 border border-transparent hover:border-white/10",
};

export default function EmployeesPage() {
  const { vendor, locations: vendorLocations } = useAppAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  useEffect(() => {
    if (vendor?.id) {
      loadEmployees();
    }
  }, [vendor?.id]);

  async function loadEmployees() {
    if (!vendor?.id) return;

    try {
      setLoading(true);
      const response = await fetch("/api/vendor/employees", {
        headers: { "x-vendor-id": vendor.id },
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading employees:", error);
      }
    } finally {
      setLoading(false);
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "vendor_owner":
        return "bg-purple-500/10 text-purple-400/80 border-purple-500/20";
      case "vendor_manager":
        return "bg-blue-500/10 text-blue-400/80 border-blue-500/20";
      case "location_manager":
        return "bg-cyan-500/10 text-cyan-400/80 border-cyan-500/20";
      case "pos_staff":
        return "bg-green-500/10 text-green-400/80 border-green-500/20";
      case "inventory_staff":
        return "bg-yellow-500/10 text-yellow-400/80 border-yellow-500/20";
      case "readonly":
        return "bg-gray-500/10 text-gray-400/80 border-gray-500/20";
      default:
        return "bg-white/5 text-white/60 border-white/10";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "vendor_owner":
        return "Owner";
      case "vendor_manager":
        return "Manager";
      case "location_manager":
        return "Location Manager";
      case "pos_staff":
        return "POS Staff";
      case "inventory_staff":
        return "Inventory Staff";
      case "readonly":
        return "Read Only";
      default:
        return role;
    }
  };

  function handleAddEmployee() {
    setEditingEmployee(null);
    setShowEmployeeModal(true);
  }

  function handleEditEmployee(emp: Employee) {
    setEditingEmployee(emp);
    setShowEmployeeModal(true);
  }

  function handleAssignLocations(emp: Employee) {
    setSelectedEmployee(emp);
    setShowLocationModal(true);
  }

  function handleSetPassword(emp: Employee) {
    setSelectedEmployee(emp);
    setShowPasswordModal(true);
  }

  async function handleDeleteEmployee(emp: Employee) {
    if (
      !confirm(
        `Are you sure you want to remove ${emp.first_name} ${emp.last_name}? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/vendor/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor!.id,
        },
        body: JSON.stringify({
          action: "delete",
          employee_id: emp.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadEmployees();
      } else {
        alert(data.error || "Failed to delete employee");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error deleting employee:", error);
      }
      alert("Failed to delete employee");
    }
  }

  async function handleToggleStatus(emp: Employee) {
    const newStatus = emp.status === "active" ? "inactive" : "active";

    try {
      const response = await fetch("/api/vendor/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor!.id,
        },
        body: JSON.stringify({
          action: "toggle_status",
          employee_id: emp.id,
          status: newStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadEmployees();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error toggling status:", error);
      }
      alert("Failed to update status");
    }
  }

  return (
    <div className="w-full min-h-screen p-8">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-white/70 text-2xl tracking-tight mb-1 font-light">
            Team
          </h1>
          <p className="text-white/25 text-[11px] uppercase tracking-[0.2em] font-light">
            {employees.length}{" "}
            {employees.length === 1 ? "Employee" : "Employees"}
          </p>
        </div>
        <button
          onClick={handleAddEmployee}
          className={cn(buttonStyles.base, buttonStyles.primary)}
        >
          <Plus size={16} strokeWidth={1.5} />
          <span>Add Employee</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Users size={48} className="text-white/20 mb-4" strokeWidth={1} />
          <div className="text-white/40 text-sm mb-2">No employees found</div>
          <div className="text-white/30 text-xs mb-6">
            Add team members to get started
          </div>
          <button
            onClick={handleAddEmployee}
            className={cn(buttonStyles.base, buttonStyles.primary)}
          >
            <Plus size={16} strokeWidth={1.5} className="mr-2" />
            Add First Employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-[#0a0a0a] border border-white/[0.04] rounded-3xl p-6 relative group"
            >
              {/* Status indicator */}
              {emp.status !== "active" && (
                <div className="absolute top-4 left-4">
                  <span className="px-2 py-1 rounded-lg border text-[9px] uppercase tracking-wider font-light bg-red-500/10 text-red-400/80 border-red-500/20">
                    {emp.status}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <Users
                    size={18}
                    className="text-white/40"
                    strokeWidth={1.5}
                  />
                </div>
                <span
                  className={`px-2 py-1 rounded-lg border text-[9px] uppercase tracking-wider font-light ${getRoleBadgeColor(emp.role)}`}
                >
                  {getRoleLabel(emp.role)}
                </span>
              </div>

              <h3 className="text-white/80 text-lg font-light tracking-tight mb-1">
                {emp.first_name} {emp.last_name}
              </h3>

              {emp.employee_id && (
                <div className="text-white/30 text-[10px] mb-4 font-mono">
                  #{emp.employee_id}
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-white/30" strokeWidth={1.5} />
                  <span className="text-white/40 text-[11px] font-light truncate">
                    {emp.email}
                  </span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone
                      size={12}
                      className="text-white/30"
                      strokeWidth={1.5}
                    />
                    <span className="text-white/40 text-[11px] font-light">
                      {emp.phone}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditEmployee(emp)}
                  className={cn(
                    buttonStyles.base,
                    buttonStyles.ghost,
                    "flex-1 text-[10px] py-2",
                  )}
                  title="Edit employee"
                >
                  <Edit2 size={12} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleAssignLocations(emp)}
                  className={cn(
                    buttonStyles.base,
                    buttonStyles.ghost,
                    "flex-1 text-[10px] py-2",
                  )}
                  title="Assign locations"
                >
                  <MapPin size={12} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleSetPassword(emp)}
                  className={cn(
                    buttonStyles.base,
                    buttonStyles.ghost,
                    "flex-1 text-[10px] py-2",
                  )}
                  title="Set password"
                >
                  <Key size={12} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleToggleStatus(emp)}
                  className={cn(
                    buttonStyles.base,
                    buttonStyles.ghost,
                    "flex-1 text-[10px] py-2",
                  )}
                  title={emp.status === "active" ? "Deactivate" : "Activate"}
                >
                  {emp.status === "active" ? (
                    <UserX size={12} strokeWidth={1.5} />
                  ) : (
                    <UserCheck size={12} strokeWidth={1.5} />
                  )}
                </button>
                <button
                  onClick={() => handleDeleteEmployee(emp)}
                  className={cn(
                    buttonStyles.base,
                    buttonStyles.ghost,
                    "flex-1 text-[10px] py-2 text-red-400/60 hover:text-red-400",
                  )}
                  title="Delete employee"
                >
                  <Trash2 size={12} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employee Modal */}
      {showEmployeeModal && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setShowEmployeeModal(false);
            setEditingEmployee(null);
          }}
          onSuccess={() => {
            setShowEmployeeModal(false);
            setEditingEmployee(null);
            loadEmployees();
          }}
          vendorId={vendor!.id}
        />
      )}

      {/* Location Assignment Modal */}
      {showLocationModal && selectedEmployee && (
        <LocationAssignmentModal
          employee={selectedEmployee}
          locations={vendorLocations || []}
          onClose={() => {
            setShowLocationModal(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            setShowLocationModal(false);
            setSelectedEmployee(null);
            loadEmployees();
          }}
          vendorId={vendor!.id}
        />
      )}

      {/* Set Password Modal */}
      {showPasswordModal && selectedEmployee && (
        <SetPasswordModal
          employee={selectedEmployee}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            setShowPasswordModal(false);
            setSelectedEmployee(null);
            alert("Password updated successfully");
          }}
          vendorId={vendor!.id}
        />
      )}
    </div>
  );
}

// Employee Add/Edit Modal Component
function EmployeeModal({
  employee,
  onClose,
  onSuccess,
  vendorId,
}: {
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
  vendorId: string;
}) {
  const [formData, setFormData] = useState({
    first_name: employee?.first_name || "",
    last_name: employee?.last_name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    role: employee?.role || "pos_staff",
    emp_id: employee?.employee_id || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = [
    {
      value: "vendor_owner",
      label: "Owner",
      description: "Full access to all features",
    },
    {
      value: "vendor_manager",
      label: "Manager",
      description: "Manage locations and staff",
    },
    {
      value: "location_manager",
      label: "Location Manager",
      description: "Manage single location",
    },
    {
      value: "pos_staff",
      label: "POS Staff",
      description: "Point of sale operations",
    },
    {
      value: "inventory_staff",
      label: "Inventory Staff",
      description: "Inventory management",
    },
    { value: "readonly", label: "Read Only", description: "View-only access" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/vendor/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          action: employee ? "update" : "create",
          employee_id: employee?.id,
          ...formData,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "Failed to save employee");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save employee");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-white/80 text-xl font-light tracking-tight mb-6">
          {employee ? "Edit Employee" : "Add New Employee"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={cn(
                  ds.typography.size.xs,
                  ds.colors.text.quaternary,
                  "block mb-2 uppercase tracking-wider",
                )}
              >
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className={cn(ds.components.input, "w-full")}
              />
            </div>
            <div>
              <label
                className={cn(
                  ds.typography.size.xs,
                  ds.colors.text.quaternary,
                  "block mb-2 uppercase tracking-wider",
                )}
              >
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className={cn(ds.components.input, "w-full")}
              />
            </div>
          </div>

          <div>
            <label
              className={cn(
                ds.typography.size.xs,
                ds.colors.text.quaternary,
                "block mb-2 uppercase tracking-wider",
              )}
            >
              Email *
            </label>
            <input
              type="email"
              required
              disabled={!!employee}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={cn(
                ds.components.input,
                "w-full",
                employee && "opacity-50 cursor-not-allowed",
              )}
            />
            {employee && (
              <p className="text-white/30 text-[10px] mt-1">
                Email cannot be changed after creation
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={cn(
                  ds.typography.size.xs,
                  ds.colors.text.quaternary,
                  "block mb-2 uppercase tracking-wider",
                )}
              >
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className={cn(ds.components.input, "w-full")}
              />
            </div>
            <div>
              <label
                className={cn(
                  ds.typography.size.xs,
                  ds.colors.text.quaternary,
                  "block mb-2 uppercase tracking-wider",
                )}
              >
                Employee ID
              </label>
              <input
                type="text"
                value={formData.emp_id}
                onChange={(e) =>
                  setFormData({ ...formData, emp_id: e.target.value })
                }
                className={cn(ds.components.input, "w-full")}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label
              className={cn(
                ds.typography.size.xs,
                ds.colors.text.quaternary,
                "block mb-3 uppercase tracking-wider",
              )}
            >
              Role *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className={cn(
                    "border rounded-2xl p-4 cursor-pointer transition-all",
                    formData.role === role.value
                      ? "border-white/20 bg-white/5"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="sr-only"
                  />
                  <div className="text-white/70 text-sm font-light mb-1">
                    {role.label}
                  </div>
                  <div className="text-white/30 text-[10px]">
                    {role.description}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!employee && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
              <p className="text-blue-400 text-xs">
                A password reset email will be sent to the employee's email
                address.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={cn(buttonStyles.base, buttonStyles.ghost, "flex-1")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(buttonStyles.base, buttonStyles.primary, "flex-1")}
            >
              {loading
                ? "Saving..."
                : employee
                  ? "Save Changes"
                  : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Set Password Modal Component
function SetPasswordModal({
  employee,
  onClose,
  onSuccess,
  vendorId,
}: {
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
  vendorId: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/vendor/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          action: "set_password",
          employee_id: employee.id,
          password,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "Failed to set password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-3xl p-8 max-w-md w-full">
        <h2 className="text-white/80 text-xl font-light tracking-tight mb-2">
          Set Password
        </h2>
        <p className="text-white/40 text-sm mb-6">
          {employee.first_name} {employee.last_name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className={cn(
                ds.typography.size.xs,
                ds.colors.text.quaternary,
                "block mb-2 uppercase tracking-wider",
              )}
            >
              New Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(ds.components.input, "w-full")}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
          </div>

          <div>
            <label
              className={cn(
                ds.typography.size.xs,
                ds.colors.text.quaternary,
                "block mb-2 uppercase tracking-wider",
              )}
            >
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn(ds.components.input, "w-full")}
              placeholder="Re-enter password"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={cn(buttonStyles.base, buttonStyles.ghost, "flex-1")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(buttonStyles.base, buttonStyles.primary, "flex-1")}
            >
              {loading ? "Setting..." : "Set Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Location Assignment Modal Component
function LocationAssignmentModal({
  employee,
  locations,
  onClose,
  onSuccess,
  vendorId,
}: {
  employee: Employee;
  locations: Location[];
  onClose: () => void;
  onSuccess: () => void;
  vendorId: string;
}) {
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load current assignments
  useEffect(() => {
    loadAssignments();
  }, [employee.id]);

  async function loadAssignments() {
    try {
      const { data, error } = await (
        await import("@/lib/supabase/client")
      ).supabase
        .from("user_locations")
        .select("location_id")
        .eq("user_id", employee.id);

      if (error) throw error;
      setSelectedLocationIds(data.map((d) => d.location_id));
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading assignments:", err);
      }
    }
  }

  function toggleLocation(locationId: string) {
    setSelectedLocationIds((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/vendor/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          action: "assign_locations",
          employee_id: employee.id,
          location_ids: selectedLocationIds,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "Failed to assign locations");
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign locations");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-3xl p-8 max-w-lg w-full">
        <h2 className="text-white/80 text-xl font-light tracking-tight mb-2">
          Assign Locations
        </h2>
        <p className="text-white/40 text-sm mb-6">
          {employee.first_name} {employee.last_name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            {locations.map((location) => (
              <label
                key={location.id}
                className={cn(
                  "flex items-center gap-3 border rounded-2xl p-4 cursor-pointer transition-all",
                  selectedLocationIds.includes(location.id)
                    ? "border-white/20 bg-white/5"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/10",
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedLocationIds.includes(location.id)}
                  onChange={() => toggleLocation(location.id)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5"
                />
                <div className="flex-1">
                  <div className="text-white/70 text-sm font-light">
                    {location.name}
                  </div>
                  {location.is_primary && (
                    <div className="text-white/30 text-[10px] uppercase tracking-wider mt-1">
                      Primary
                    </div>
                  )}
                </div>
                <MapPin size={16} className="text-white/30" strokeWidth={1.5} />
              </label>
            ))}
          </div>

          {locations.length === 0 && (
            <div className="text-center py-8">
              <MapPin
                size={32}
                className="text-white/20 mx-auto mb-2"
                strokeWidth={1}
              />
              <p className="text-white/40 text-sm">No locations available</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={cn(buttonStyles.base, buttonStyles.ghost, "flex-1")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || locations.length === 0}
              className={cn(buttonStyles.base, buttonStyles.primary, "flex-1")}
            >
              {loading ? "Saving..." : "Save Locations"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
