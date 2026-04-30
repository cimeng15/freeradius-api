import { useState, useEffect } from 'react';
import { staffAPI } from '../lib/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Search, Shield, UserCog, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const roleConfig = {
  superadmin: { label: 'Super Admin', color: 'bg-red-100 text-red-700', desc: 'Akses penuh' },
  noc: { label: 'NOC', color: 'bg-blue-100 text-blue-700', desc: 'Monitoring & jaringan' },
  reseller: { label: 'Reseller', color: 'bg-purple-100 text-purple-700', desc: 'Kelola voucher' },
};

export default function Staff() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '',
    role: 'noc', status: 'active'
  });

  useEffect(() => { fetchStaff(); }, [search, roleFilter]);

  const fetchStaff = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await staffAPI.list(params);
      const d = res.data.data || res.data;
      setUsers(d.data || d);
      setPagination(d);
    } catch (error) {
      toast.error('Gagal memuat data staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.username) delete payload.username;
      if (!payload.password) delete payload.password;

      if (editingUser) {
        await staffAPI.update(editingUser.id, payload);
        toast.success('Staff berhasil diupdate');
      } else {
        if (!payload.password) {
          toast.error('Password wajib diisi untuk user baru');
          return;
        }
        await staffAPI.create(payload);
        toast.success('Staff berhasil ditambahkan');
      }
      setShowModal(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors;
      if (typeof msg === 'object' && msg !== null) {
        const first = Object.values(msg)[0];
        toast.error(Array.isArray(first) ? first[0] : String(first));
      } else {
        toast.error(msg || 'Operasi gagal');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus staff ini? Aksi ini tidak bisa dibatalkan.')) return;
    try {
      await staffAPI.delete(id);
      toast.success('Staff berhasil dihapus');
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus');
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
      role: user.role || 'noc',
      status: user.status || 'active',

    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setForm({ name: '', username: '', email: '', password: '', role: 'noc', status: 'active' });
    setShowPassword(false);
  };

  const columns = [
    { key: 'name', label: 'Nama', render: (row) => (
      <div>
        <p className="font-medium text-gray-900">{row.name}</p>
        {row.username && <p className="text-xs text-gray-400 font-mono">@{row.username}</p>}
      </div>
    )},
    { key: 'email', label: 'Email', render: (row) => <span className="text-sm">{row.email}</span> },
    { key: 'role', label: 'Role', render: (row) => {
      const r = roleConfig[row.role] || { label: row.role, color: 'bg-gray-100 text-gray-700' };
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${r.color}`}>
          <Shield className="h-3 w-3" />
          {r.label}
        </span>
      );
    }},
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
        row.status === 'active' ? 'bg-green-100 text-green-700' :
        row.status === 'suspended' ? 'bg-red-100 text-red-700' :
        'bg-gray-100 text-gray-600'
      }`}>
        {row.status === 'active' ? 'Aktif' : row.status === 'suspended' ? 'Nonaktif' : row.status}
      </span>
    )},
    { key: 'created_at', label: 'Dibuat', render: (row) => (
      <span className="text-xs text-gray-500">{new Date(row.created_at).toLocaleDateString('id-ID')}</span>
    )},
    { key: 'actions', label: 'Aksi', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
          <Edit className="h-4 w-4" />
        </button>
        <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Staff</h1>
          <p className="text-gray-500 mt-1">Kelola user admin, NOC, dan reseller</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Tambah Staff
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, username, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">Semua Role</option>
          <option value="superadmin">Super Admin</option>
          <option value="noc">NOC</option>
          <option value="reseller">Reseller</option>
        </select>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(roleConfig).map(([key, cfg]) => {
          const count = Array.isArray(users) ? users.filter(u => u.role === key).length : 0;
          return (
            <div key={key} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${cfg.color}`}>
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{cfg.label}</p>
                <p className="text-xs text-gray-500">{cfg.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        pagination={pagination}
        onPageChange={fetchStaff}
        loading={loading}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit Staff' : 'Tambah Staff Baru'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Username */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                className="input-field font-mono"
                placeholder="johndoe"
              />
              <p className="text-xs text-gray-400 mt-0.5">Untuk login (opsional)</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
              placeholder="john@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editingUser ? '(kosongkan jika tidak diubah)' : '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field pr-10"
                placeholder={editingUser ? '••••••••' : 'Min. 8 karakter'}
                {...(!editingUser && { required: true, minLength: 8 })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-field"
                required
              >
                <option value="superadmin">🔴 Super Admin</option>
                <option value="noc">🔵 NOC</option>
                <option value="reseller">🟣 Reseller</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field"
              >
                <option value="active">✅ Aktif</option>
                <option value="suspended">⛔ Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Reseller-specific fields */}
          {/* Role description */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              <strong>Hak akses:</strong>{' '}
              {form.role === 'superadmin' && 'Akses penuh ke semua fitur sistem.'}
              {form.role === 'noc' && 'Monitoring jaringan, lihat pelanggan & router (read-only).'}
              {form.role === 'reseller' && 'Kelola dan jual voucher hotspot.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn-primary">
              {editingUser ? 'Update' : 'Tambah Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
