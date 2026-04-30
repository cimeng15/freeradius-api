import { useState, useEffect } from 'react';
import { clientAPI, packageAPI } from '../lib/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Search, Pause, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', username: '', password: '', package_id: '',
    ip_address: '', installation_address: '', phone: '', billing_date: '1'
  });

  useEffect(() => { fetchClients(); loadPackages(); }, [search, statusFilter]);

  const loadPackages = async () => {
    try {
      const res = await packageAPI.list();
      setPackages(res.data.data || []);
    } catch (e) { /* ignore */ }
  };

  const fetchClients = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await clientAPI.list(params);
      const d = res.data.data || res.data;
      setClients(d.data || d);
      setPagination(d);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, billing_date: Number(form.billing_date) };
      if (!payload.ip_address) delete payload.ip_address;

      if (editingClient) {
        const updateData = {};
        ['name', 'email', 'package_id', 'ip_address', 'installation_address', 'phone'].forEach(k => {
          if (form[k]) updateData[k] = form[k];
        });
        updateData.billing_date = Number(form.billing_date);
        await clientAPI.update(editingClient.id, updateData);
        toast.success('Client updated');
      } else {
        await clientAPI.create(payload);
        toast.success('Client created & synced to FreeRADIUS');
      }
      setShowModal(false);
      resetForm();
      fetchClients();
    } catch (error) {
      const msg = error.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this client? This will also remove from FreeRADIUS.')) return;
    try {
      await clientAPI.delete(id);
      toast.success('Client deleted');
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSuspend = async (id) => {
    try { await clientAPI.suspend(id); toast.success('Client suspended'); fetchClients(); }
    catch { toast.error('Failed to suspend'); }
  };

  const handleActivate = async (id) => {
    try { await clientAPI.activate(id); toast.success('Client activated'); fetchClients(); }
    catch { toast.error('Failed to activate'); }
  };

  const openEdit = (c) => {
    setEditingClient(c);
    setForm({
      name: c.user?.name || '', email: c.user?.email || '',
      username: c.username || '', password: '',
      package_id: c.package_id?.toString() || '',
      ip_address: c.ip_address || '',
      installation_address: c.installation_address || '',
      phone: c.phone || '', billing_date: c.billing_date?.toString() || '1'
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingClient(null);
    setForm({ name: '', email: '', username: '', password: '', package_id: '', ip_address: '', installation_address: '', phone: '', billing_date: '1' });
  };

  const canEdit = user?.role === 'superadmin';

  const columns = [
    { key: 'client_id', label: 'ID Pelanggan', render: (row) => (
      <span className="font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{row.client_id || '-'}</span>
    )},
    { key: 'username', label: 'Username', render: (row) => <span className="font-mono text-sm">{row.username}</span> },
    { key: 'password', label: 'Password', render: (row) => (
      row.pppoe_password ? <code className="text-xs bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded font-mono">{row.pppoe_password}</code> : <span className="text-gray-400 text-xs">-</span>
    )},
    { key: 'name', label: 'Nama', render: (row) => row.user?.name || '-' },
    { key: 'package', label: 'Paket', render: (row) => (
      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{row.package?.name || '-'}</span>
    )},
    { key: 'phone', label: 'Telepon', render: (row) => row.phone || '-' },
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.status === 'active' ? 'bg-green-100 text-green-700' :
        row.status === 'suspended' ? 'bg-red-100 text-red-700' :
        'bg-gray-100 text-gray-700'
      }`}>{row.status}</span>
    )},
    ...(canEdit ? [{ key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="p-1 text-blue-600 hover:text-blue-800" title="Edit"><Edit className="h-4 w-4" /></button>
        {row.status === 'active' ? (
          <button onClick={() => handleSuspend(row.id)} className="p-1 text-yellow-600 hover:text-yellow-800" title="Suspend"><Pause className="h-4 w-4" /></button>
        ) : row.status === 'suspended' ? (
          <button onClick={() => handleActivate(row.id)} className="p-1 text-green-600 hover:text-green-800" title="Activate"><Play className="h-4 w-4" /></button>
        ) : null}
        <button onClick={() => handleDelete(row.id)} className="p-1 text-red-600 hover:text-red-800" title="Delete"><Trash2 className="h-4 w-4" /></button>
      </div>
    )}] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage PPPoE clients</p>
        </div>
        {canEdit && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Client
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      <DataTable columns={columns} data={clients} pagination={pagination} onPageChange={fetchClients} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingClient ? 'Edit Client' : 'Add Client'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" required />
            </div>
          </div>
          {!editingClient && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username (PPPoE)</label>
                <input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="text" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="input-field" required />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
              <select value={form.package_id} onChange={(e) => setForm({...form, package_id: e.target.value})} className="input-field" required>
                <option value="">Select Package</option>
                {packages.filter(p => p.type === 'pppoe' && p.is_active).map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.speed_download}M/{p.speed_upload}M</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Address (optional)</label>
              <input type="text" value={form.ip_address} onChange={(e) => setForm({...form, ip_address: e.target.value})} className="input-field" placeholder="Auto assign" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Date (1-31)</label>
              <input type="number" min="1" max="31" value={form.billing_date} onChange={(e) => setForm({...form, billing_date: e.target.value})} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Installation Address</label>
            <textarea value={form.installation_address} onChange={(e) => setForm({...form, installation_address: e.target.value})} className="input-field" rows="2" required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingClient ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
