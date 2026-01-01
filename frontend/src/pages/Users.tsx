import { useState, useEffect } from 'react';
import api from '../utils/api';
import type { User } from '../types';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Shield,
  UserCog,
  Users as UsersIcon,
  Key,
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff' as 'superadmin' | 'boss' | 'staff',
    fullName: '',
    phone: '',
    isActive: true,
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        role: user.role,
        fullName: user.full_name || user.fullName || '',
        phone: user.phone || '',
        isActive: user.is_active !== false,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: 'staff',
        fullName: '',
        phone: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const saveUser = async () => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          username: formData.username,
          role: formData.role,
          fullName: formData.fullName,
          phone: formData.phone,
          isActive: formData.isActive,
        });
      } else {
        if (!formData.password) {
          alert('Password is required for new users');
          return;
        }
        await api.post('/users', {
          username: formData.username,
          password: formData.password,
          role: formData.role,
          fullName: formData.fullName,
          phone: formData.phone,
        });
      }
      setShowModal(false);
      loadUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to save user');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const resetPassword = async () => {
    if (!newPassword) {
      alert('Please enter a new password');
      return;
    }
    try {
      await api.post(`/users/${selectedUserId}/reset-password`, {
        newPassword,
      });
      setShowPasswordModal(false);
      setNewPassword('');
      alert('Password reset successfully');
    } catch (error) {
      console.error('Reset password failed:', error);
      alert('Failed to reset password');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      superadmin: 'badge-error',
      boss: 'badge-warning',
      staff: 'badge-info',
    };
    return `badge ${styles[role] || 'badge-ghost'}`;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Shield size={16} />;
      case 'boss':
        return <UserCog size={16} />;
      default:
        return <UsersIcon size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-10">
                            <span>{(u.full_name || u.fullName)?.charAt(0) || 'U'}</span>
                          </div>
                        </div>
                        <span className="font-medium">{u.full_name || u.fullName}</span>
                      </div>
                    </td>
                    <td>{u.username}</td>
                    <td>
                      <span className={getRoleBadge(u.role)}>
                        {getRoleIcon(u.role)} {u.role}
                      </span>
                    </td>
                    <td>{u.phone || '-'}</td>
                    <td>
                      <span
                        className={`badge ${
                          u.is_active !== false ? 'badge-success' : 'badge-ghost'
                        }`}
                      >
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openModal(u)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setShowPasswordModal(true);
                          }}
                        >
                          <Key size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => deleteUser(u.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <div className="py-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Full Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              {!editingUser && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'superadmin' | 'boss' | 'staff',
                    })
                  }
                >
                  <option value="staff">Staff</option>
                  <option value="boss">Boss</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              {editingUser && (
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Active</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                  </label>
                </div>
              )}
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                <X size={18} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={saveUser}>
                <Check size={18} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Reset Password</h3>
            <div className="py-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
              >
                <X size={18} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={resetPassword}>
                <Check size={18} /> Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
