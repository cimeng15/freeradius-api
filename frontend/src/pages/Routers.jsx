import { useState, useEffect } from 'react';
import { routerAPI } from '../lib/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Search, Wifi, WifiOff, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Routers() {
  const { user } = useAuth();
  const [routers, setRouters] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingRouter, setEditingRouter] = useState(null);
  const [routerStats, setRouterStats] = useState(null);
  const [form, setForm] = useState({
    name: '', ip_address: '', secret: '', type: 'both', location: '', status: 'active'
  });

  useEffect(() => { fetchRouters(); }, [search]);

  const fetchRouters = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      const res = await routerAPI.list(params);
      const d = res.data.data || res.data;
      setRouters(d.data || d);
      setPagination(d);
    } catch (error) {
      toast.error('Failed to load routers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRouter) {
        await routerAPI.update(editingRouter.id, form);
        toast.success('Router updated');
      } else {
        const res = await routerAPI.create(form);
        toast.success(res.data.radius_synced ? 'Router created & synced to FreeRADIUS' : 'Router created (FreeRADIUS sync pending)');
      }
      setShowModal(false);
      resetForm();
      fetchRouters();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this router?')) return;
    try {
      await routerAPI.delete(id);
      toast.success('Router deleted');
      fetchRouters();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const handleTest = async (id) => {
    const tid = toast.loading('Testing connection...');
    try {
      const res = await routerAPI.test(id);
      res.data.reachable ? toast.success('Router is reachable!', { id: tid }) : toast.error('Router is not reachable', { id: tid });
    } catch { toast.error('Test failed', { id: tid }); }
  };

  const handleStats = async (id) => {
    try {
      const res = await routerAPI.statistics(id);
      setRouterStats(res.data);
      setShowStatsModal(true);
    } catch { toast.error('Failed to load statistics'); }
  };

  const openEdit = (r) => {
    setEditingRouter(r);
    setForm({ name: r.name, ip_address: r.ip_address, secret: r.secret || '', type: r.type || 'both', location: r.location || '', status: r.status });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingRouter(null);
    setForm({ name: '', ip_address: '', secret: '', type: 'both', location: '', status: 'active' });
  };

  const canEdit = user?.role === 'superadmin';

  const columns = [
    { key: 'name', label: 'Name', render: (row) => (
      <div className="flex items-center gap-2">
        {row.status === 'active' ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
        <span className="font-medium">{row.name}</span>
      </div>
    )},
    { key: 'ip_address', label: 'IP Address', render: (row) => <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">{row.ip_address}</code> },
    { key: 'type', label: 'Type', render: (row) => (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{row.type}</span>
    )},
    { key: 'location', label: 'Location', render: (row) => row.location || '-' },
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{row.status}</span>
    )},
    ...(canEdit ? [{ key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => handleTest(row.id)} className="p-1 text-green-600 hover:text-green-800" title="Test"><Wifi className="h-4 w-4" /></button>
        <button onClick={() => handleStats(row.id)} className="p-1 text-purple-600 hover:text-purple-800" title="Stats"><BarChart3 className="h-4 w-4" /></button>
        <button onClick={() => openEdit(row)} className="p-1 text-blue-600 hover:text-blue-800" title="Edit"><Edit className="h-4 w-4" /></button>
        <button onClick={() => handleDelete(row.id)} className="p-1 text-red-600 hover:text-red-800" title="Delete"><Trash2 className="h-4 w-4" /></button>
      </div>
    )}] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routers</h1>
          <p className="text-gray-500 mt-1">Manage Mikrotik routers</p>
        </div>
        {canEdit && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Router
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search routers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      <DataTable columns={columns} data={routers} pagination={pagination} onPageChange={fetchRouters} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRouter ? 'Edit Router' : 'Add Router'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Router Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
              <input type="text" value={form.ip_address} onChange={(e) => setForm({...form, ip_address: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RADIUS Secret</label>
              <input type="text" value={form.secret} onChange={(e) => setForm({...form, secret: e.target.value})} className="input-field" required minLength={8} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="input-field">
                <option value="both">Both</option>
                <option value="hotspot">Hotspot</option>
                <option value="pppoe">PPPoE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="input-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingRouter ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} title="Router Statistics">
        {routerStats && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">{routerStats.router?.name}</h4>
              <p className="text-sm text-gray-500">{routerStats.router?.ip_address}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Clients', value: routerStats.statistics?.total_clients, color: 'blue' },
                { label: 'Active', value: routerStats.statistics?.active_clients, color: 'green' },
                { label: 'Suspended', value: routerStats.statistics?.suspended_clients, color: 'yellow' },
                { label: 'Terminated', value: routerStats.statistics?.expired_clients, color: 'red' },
              ].map((s, i) => (
                <div key={i} className={`p-4 bg-${s.color}-50 rounded-lg text-center`}>
                  <p className={`text-2xl font-bold text-${s.color}-700`}>{s.value || 0}</p>
                  <p className={`text-sm text-${s.color}-600`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
