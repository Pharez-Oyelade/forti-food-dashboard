import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { get, post, put } from "@/services/api";
import { Card, Button, StatusBadge, LoadingSpinner } from "@/components/common";
import { Users, Shield, Plus, Edit2, AlertOctagon } from "lucide-react";
import { toast } from "react-toastify";

export default function UserManagementPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    is_active: true,
    password: "", // Only used for creating or explicitly changing
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        get("/users"),
        get("/users/roles"),
      ]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role?._id || "",
        is_active: user.is_active,
        password: "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        role: roles.length > 0 ? roles[0]._id : "",
        is_active: true,
        password: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password && editingUser) {
        delete payload.password; // Don't send empty password on update
      }

      if (editingUser) {
        await put(`/users/${editingUser._id}`, payload);
        toast.success("User updated");
      } else {
        await post("/users", payload);
        toast.success("User created");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save user");
    }
  };

  const handlePurgeStalledDeals = async () => {
    if (
      !window.confirm(
        "Are you sure you want to mass-close all stalled deals in the pipeline? This cannot be undone.",
      )
    )
      return;

    try {
      const res = await post("/deals/bulk-close-stalled");
      toast.success(res.message || "Stalled deals purged");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to purge deals");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
            {/* <Shield className="text-brand-lime" size={32} /> */}
            User & System Management
          </h1>
          <p className="text-gray-400 mt-1">
            Manage team access and system actions
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={handlePurgeStalledDeals}
            icon={AlertOctagon}
          >
            Purge Stalled Deals
          </Button>
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            icon={Plus}
          >
            Add User
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0 border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700/50">
                <th className="p-4 text-sm font-semibold text-slate-300">
                  Name
                </th>
                <th className="p-4 text-sm font-semibold text-slate-300">
                  Email
                </th>
                <th className="p-4 text-sm font-semibold text-slate-300">
                  Role
                </th>
                <th className="p-4 text-sm font-semibold text-slate-300">
                  Status
                </th>
                <th className="p-4 text-sm font-semibold text-slate-300 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-4 text-slate-200 font-medium">
                    {user.name}
                  </td>
                  <td className="p-4 text-slate-400">{user.email}</td>
                  <td className="p-4 text-slate-300">
                    {user.role?.role_name || "No Role"}
                  </td>
                  <td className="p-4">
                    <StatusBadge
                      status={user.is_active ? "Active" : "Inactive"}
                      type={user.is_active ? "success" : "neutral"}
                    />
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="p-2 text-slate-400 hover:text-brand-lime transition-colors rounded-lg hover:bg-slate-800"
                      title="Edit User"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">
              {editingUser ? "Edit User" : "New User"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Name
                </label>
                <input
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Email
                </label>
                <input
                  required
                  type="email"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Password {editingUser && "(Leave blank to keep)"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Role
                </label>
                <select
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="form-checkbox h-5 w-5 text-brand-lime rounded border-slate-600 bg-slate-800"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <label htmlFor="isActive" className="text-slate-300">
                  Active Account
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
