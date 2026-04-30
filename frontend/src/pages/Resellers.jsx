import { useState, useEffect } from 'react';
import { resellerAPI } from '../lib/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Search, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Resellers() {
  const [resellers, setResellers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editingReseller, setEditingReseller] = useState(null);
  const [selectedReseller, setSelectedReseller] = useState(null);
  const [balanceAction, setBalanceAction] = useState('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    commission_percentage: '10', balance: '0', status: 'active'
  });

  useEffect(() => { fetchResellers(); }, [search]);

  const fetchResellers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      const res = await resellerAPI.list(params);
      const responseData = res.data.data || res.data;
      setResellers(responseData.data || responseData);
      setPagination(responseData);
    } catch (error) {
      toast.error('Failed to load resellers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        commission_percentage: Number(form.commission_percentage),
        balance: Number(form.balance)
      };

      if (editingReseller) {
        if (!payload.password) delete payload.password;
        await resellerAPI.update(editingReseller.id, payload);
        toast.success('Reseller updated');
      } else {
        await resellerAPI.create(payload);
        toast.success('Reseller created');
      }
      setShowModal(false);
      resetForm();
      fetchResellers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this reseller?')) return;
    try {
      await resellerAPI.delete(id);
      toast.success('Reseller deleted');
      fetchResellers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const handleBalance = async (e) => {
    e.preventDefault();
    try {
      if (balanceAction === 'add') {
        await resellerAPI.addBalance(selectedReseller.id, { amount: Number(balanceAmount) });
        toast.success('Balance added');
      } else {
        await resellerAPI.deductBalance(selectedReseller.id, { amount: Number(balanceAmount) });
        toast.success('Balance deducted');
      }
      setShowBalanceModal(false);
      setBalanceAmount('');
      fetchResellers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const openEdit = (reseller) => {
    setEditingReseller(reseller);
    setForm({
      name: reseller.user?.name || '', email: reseller.user?.email || '',
      password: '', phone: reseller.user?.phone || '',
      commission_percentage: reseller.commission_percentage?.toString() || '10',
      balance: reseller.balance?.toString() || '0', status: reseller.status
    });
    setShowModal(true);
  };

  const openBalance = (reseller, action) => {
    setSelectedReseller(reseller);
    setBalanceAction(action);
    setBalanceAmount('');
    setShowBalanceModal(true);
  };

  const resetForm = () => {
    setEditingReseller(null);
    setForm({ name: '', email: '', password: '', phone: '', commission_percentage: '10', balance: '0', status: 'active' });
  };

  const columns = [
    { key: 'name', label: 'Name', render: (row) => row.user?.name || '-' },
    { key: 'email', label: 'Email', render: (row) => row.user?.email || '-' },
    { key: 'commission', label: 'Commission', render: (row) => `${row.commission_percentage}%` },
    { key: 'balance', label: 'Balance', render: (row) => (
      <span className="font-medium">Rp {(row.balance || 0).toLocaleString('id-ID')}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
      <span className={row.status === 'active' ? 'badge-active' : 'badge-inactive'}>{row.status}</span>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openBalance(row, 'add')} className="p-1 text-green-600 hover:text-green-800" title="Add Balance"><DollarSign className="h-4 w-4" /></button>
        <button onClick={() => openBalance(row, 'deduct')} className="p-1 text-yellow-600 hover:text-yellow-800" title="Deduct Balance"><TrendingUp className="h-4 w-4" /></button>
        <button onClick={() => openEdit(row)} className="p-1 text-blue-600 hover:text-blue-800" title="Edit"><Edit className="h-4 w-4" /></button>
        <button onClick={() => handleDelete(row.id)} className="p-1 text-red-600 hover:text-red-800" title="Delete"><Trash2 className="h-4 w-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resellers</h1>
          <p className="text-gray-500 mt-1">Manage voucher resellers</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Reseller
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search resellers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      <DataTable columns={columns} data={resellers} pagination={pagination} onPageChange={fetchResellers} loading={loading} />

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingReseller ? 'Edit Reseller' : 'Add Reseller'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingReseller && '(leave blank to keep)'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="input-field" {...(!editingReseller && { required: true })} minLength={8} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
              <input type="number" min="0" max="100" value={form.commission_percentage} onChange={(e) => setForm({...form, commission_percentage: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
              <input type="number" min="0" value={form.balance} onChange={(e) => setForm({...form, balance: e.target.value})} className="input-field" />
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
            <button type="submit" className="btn-primary">{editingReseller ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Balance Modal */}
      <Modal isOpen={showBalanceModal} onClose={() => setShowBalanceModal(false)} title={`${balanceAction === 'add' ? 'Add' : 'Deduct'} Balance`}>
        <form onSubmit={handleBalance} className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Reseller: <span className="font-medium">{selectedReseller?.user?.name}</span></p>
            <p className="text-sm text-gray-600">Current Balance: <span className="font-medium">Rp {(selectedReseller?.balance || 0).toLocaleString('id-ID')}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rp)</label>
            <input type="number" min="1" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} className="input-field" required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowBalanceModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className={balanceAction === 'add' ? 'btn-success' : 'btn-warning'}>
              {balanceAction === 'add' ? 'Add Balance' : 'Deduct Balance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
