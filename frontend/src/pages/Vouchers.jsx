import { useState, useEffect } from 'react';
import { voucherAPI, packageAPI } from '../lib/api';
import Modal from '../components/Modal';
import { Plus, Trash2, Search, Copy, CheckCircle, Layers, Clock, Calendar, Wifi, Ban, PlayCircle, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const fmtUptime = (mins) => {
  if (!mins) return 'Unlimited';
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h > 0 && m > 0) return `${h}j ${m}m`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2,'0');
  const mm = String(dt.getMonth()+1).padStart(2,'0');
  const yy = String(dt.getFullYear()).slice(-2);
  const hh = String(dt.getHours()).padStart(2,'0');
  const mi = String(dt.getMinutes()).padStart(2,'0');
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
};

const fmtTime = (timeStr) => {
  // timeStr format: "2026-04-30 08:51"
  const [date, time] = timeStr.split(' ');
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y.slice(-2)} ${time}`;
};

export default function Vouchers() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [timeGroup, setTimeGroup] = useState('');
  const [timeGroups, setTimeGroups] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selected, setSelected] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);

  const [createForm, setCreateForm] = useState({ package_id:'', code:'', password:'', same_pass:true });
  const [bulkForm, setBulkForm] = useState({ package_id:'', quantity:'10', prefix:'', code_length:'8', same_user_pass:true });
  const [checkCode, setCheckCode] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);

  const isReseller = user?.role === 'reseller';
  const allSelected = vouchers.length > 0 && selected.length === vouchers.length;

  useEffect(() => { fetchTimeGroups(); }, [dateFilter]);
  useEffect(() => { fetchVouchers(); loadPackages(); }, [search, statusFilter, dateFilter, timeGroup]);

  const loadPackages = async () => {
    try {
      const res = await packageAPI.list();
      setPackages((res.data.data || []).filter(p => p.type === 'hotspot' && p.is_active));
    } catch (e) {}
  };

  const fetchTimeGroups = async () => {
    try {
      const params = {};
      if (dateFilter) params.date_filter = dateFilter;
      const res = await voucherAPI.groupedByTime(params);
      setTimeGroups(res.data.data || []);
    } catch (e) { console.error('Gagal memuat time groups', e); }
  };

  const fetchVouchers = async (page = 1) => {
    setLoading(true);
    setSelected([]);
    try {
      const params = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date_filter = dateFilter;
      if (timeGroup) params.time_group = timeGroup;
      const res = await voucherAPI.list(params);
      setVouchers(res.data.data || []);
      setPagination(res.data);
    } catch (e) { toast.error('Gagal memuat voucher'); }
    finally { setLoading(false); }
  };

  // === Handlers ===
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.code) { toast.error('Username wajib diisi'); return; }
    try {
      const payload = { package_id: createForm.package_id, code: createForm.code };
      if (!createForm.same_pass && createForm.password) payload.password = createForm.password;
      await voucherAPI.create(payload);
      toast.success('Voucher dibuat');
      setShowCreateModal(false);
      fetchVouchers();
    } catch (error) { toast.error(error.response?.data?.message || 'Gagal'); }
  };

  const handleBulk = async (e) => {
    e.preventDefault();
    try {
      const payload = { package_id: bulkForm.package_id, quantity: Number(bulkForm.quantity), code_length: Number(bulkForm.code_length), same_user_pass: bulkForm.same_user_pass };
      if (bulkForm.prefix) payload.prefix = bulkForm.prefix;
      const res = await voucherAPI.bulk(payload);
      toast.success(res.data.message);
      setShowBulkModal(false);
      fetchVouchers();
    } catch (error) { toast.error(error.response?.data?.message || 'Gagal'); }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    try {
      const res = await voucherAPI.check({ code: checkCode });
      setCheckResult(res.data);
    } catch (error) {
      setCheckResult({ valid: false, message: error.response?.data?.message || 'Tidak ditemukan' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus voucher ini?')) return;
    try { await voucherAPI.delete(id); toast.success('Dihapus'); fetchVouchers(); }
    catch (e) { toast.error(e.response?.data?.message || 'Gagal'); }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!confirm(`Hapus ${selected.length} voucher terpilih?`)) return;
    let ok = 0, fail = 0;
    for (const id of selected) {
      try { await voucherAPI.delete(id); ok++; } catch { fail++; }
    }
    toast.success(`${ok} dihapus${fail ? `, ${fail} gagal` : ''}`);
    fetchVouchers();
  };

  const handleBulkStatus = async (status) => {
    const label = status === 'unused' ? 'enable' : 'disable';
    if (!confirm(`${label} ${selected.length} voucher?`)) return;
    let ok = 0;
    for (const id of selected) {
      try { await voucherAPI.update(id, { status }); ok++; } catch {}
    }
    toast.success(`${ok} voucher di-${label}`);
    fetchVouchers();
  };

  const copyCode = (code) => { navigator.clipboard.writeText(code); toast.success('Disalin!'); };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelected(allSelected ? [] : vouchers.map(v => v.id));
  };

  const onBulkSelectPkg = (pkgId) => {
    setBulkForm({ ...bulkForm, package_id: pkgId });
    setSelectedPkg(packages.find(p => String(p.id) === String(pkgId)) || null);
  };

  // === Package Card ===
  const PkgCard = ({ pkg, sel, onSel }) => (
    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${sel ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
      <input type="radio" name="pkg" checked={sel} onChange={() => onSel(String(pkg.id))} className="text-blue-600" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Wifi className="h-3 w-3" />{pkg.speed_download}M/{pkg.speed_upload}M</span>
          {pkg.uptime_limit > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtUptime(pkg.uptime_limit)}</span>}
          {pkg.expire_after > 0 && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{pkg.expire_after} Hari</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-gray-900">Rp {Number(pkg.price).toLocaleString('id-ID')}</p>
        {isReseller && pkg.reseller_commission > 0 && (
          <p className="text-xs text-green-600">Anda: Rp {Math.max(0, Number(pkg.price) - Number(pkg.reseller_commission)).toLocaleString('id-ID')}</p>
        )}
      </div>
    </label>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voucher</h1>
          <p className="text-gray-500 mt-1">{isReseller ? 'Kelola voucher Anda' : 'Generate dan kelola voucher hotspot'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setCheckCode(''); setCheckResult(null); setShowCheckModal(true); }} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4" /> Cek
          </button>
          <button onClick={() => { setCreateForm({ package_id:'', code:'', password:'', same_pass:true }); setShowCreateModal(true); }} className="btn-secondary flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> Manual
          </button>
          <button onClick={() => { setBulkForm({ package_id:'', quantity:'10', prefix:'', code_length:'8', same_user_pass:true }); setSelectedPkg(null); setShowBulkModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4" /> Generate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Cari kode voucher..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto text-sm">
          <option value="">Semua Status</option>
          <option value="unused">Tersedia</option>
          <option value="used">Terpakai</option>
          <option value="expired">Expired</option>
        </select>
        <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setTimeGroup(''); }} className="input-field w-auto text-sm">
          <option value="">Semua Waktu</option>
          <option value="today">Hari Ini</option>
          <option value="yesterday">Kemarin</option>
          <option value="3days">3 Hari Terakhir</option>
          <option value="7days">7 Hari Terakhir</option>
          <option value="14days">14 Hari Terakhir</option>
          <option value="30days">30 Hari Terakhir</option>
          <option value="thismonth">Bulan Ini</option>
          <option value="lastmonth">Bulan Lalu</option>
          <option value="90days">90 Hari Terakhir</option>
        </select>
        <select value={timeGroup} onChange={e => setTimeGroup(e.target.value)} className="input-field w-auto text-sm min-w-[200px]">
          <option value="">Semua Jam</option>
          {timeGroups.map((tg) => (
            <option key={tg.time_group} value={tg.time_group}>
              {fmtTime(tg.time_group)} ({tg.count} voucher)
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">{selected.length} dipilih</span>
          <div className="flex-1" />
          <button onClick={() => handleBulkStatus('expired')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200">
            <Ban className="h-3.5 w-3.5" /> Disable
          </button>
          <button onClick={() => handleBulkStatus('unused')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-800 rounded-lg hover:bg-green-200">
            <PlayCircle className="h-3.5 w-3.5" /> Enable
          </button>
          <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-800 rounded-lg hover:bg-red-200">
            <Trash2 className="h-3.5 w-3.5" /> Hapus
          </button>
          <button onClick={() => setSelected([])} className="text-xs text-gray-500 hover:text-gray-700 ml-2">Batal</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 w-10"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded text-blue-600" /></th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paket</th>
                {!isReseller && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reseller</th>}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dipakai</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibuat</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center"><div className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" /><span className="text-gray-500">Memuat...</span></div></td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Tidak ada voucher</td></tr>
              ) : vouchers.map(v => (
                <tr key={v.id} className={`hover:bg-gray-50 ${selected.includes(v.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggleSelect(v.id)} className="rounded text-blue-600" /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded font-mono">{v.code}</code>
                      <button onClick={() => copyCode(v.code)} className="text-gray-400 hover:text-gray-600"><Copy className="h-3 w-3" /></button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-sm">{v.package?.name || '-'}</p>
                    <p className="text-xs text-gray-400">{v.package?.speed_download}M/{v.package?.speed_upload}M</p>
                  </td>
                  {!isReseller && <td className="px-3 py-2 text-sm text-gray-600">{v.reseller?.user?.name || <span className="text-gray-300">Admin</span>}</td>}
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      v.status === 'unused' ? 'bg-green-100 text-green-700' :
                      v.status === 'used' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{v.status === 'unused' ? 'Tersedia' : v.status === 'used' ? 'Terpakai' : 'Expired'}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{v.used_by ? <><span className="font-medium">{v.used_by}</span><br/>{fmtDate(v.used_at)}</> : '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{fmtDate(v.created_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {v.status === 'unused' && (
                        <button onClick={async () => { 
                          if (!confirm('Disable voucher ini?')) return;
                          try { await voucherAPI.update(v.id, { status: 'expired' }); toast.success('Disabled'); fetchVouchers(); } catch { toast.error('Gagal'); }
                        }} title="Disable" className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"><Ban className="h-3.5 w-3.5" /></button>
                      )}
                      {v.status === 'expired' && (
                        <button onClick={async () => { 
                          try { await voucherAPI.update(v.id, { status: 'unused' }); toast.success('Enabled'); fetchVouchers(); } catch { toast.error('Gagal'); }
                        }} title="Enable" className="p-1 text-green-600 hover:bg-green-50 rounded"><PlayCircle className="h-3.5 w-3.5" /></button>
                      )}
                      {v.status !== 'used' && (
                        <button onClick={() => handleDelete(v.id)} title="Hapus" className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">Hal {pagination.current_page}/{pagination.last_page} • {pagination.total} voucher</span>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchVouchers(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => fetchVouchers(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* === BUAT MANUAL === */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Buat Voucher Manual" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Paket</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {packages.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Belum ada paket hotspot</p>}
              {packages.map(p => <PkgCard key={p.id} pkg={p} sel={String(createForm.package_id)===String(p.id)} onSel={v => setCreateForm({...createForm, package_id:v})} />)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" value={createForm.code} onChange={e => setCreateForm({...createForm, code:e.target.value.toLowerCase().replace(/[^a-z0-9]/g,'')})} className="input-field font-mono" placeholder="contoh: tamu001" required maxLength={30} />
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input type="checkbox" id="m_same" checked={createForm.same_pass} onChange={e => setCreateForm({...createForm, same_pass:e.target.checked, password:''})} className="rounded text-blue-600" />
            <label htmlFor="m_same" className="text-sm text-gray-700 font-medium">Username & Password sama</label>
          </div>
          {!createForm.same_pass && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="text" value={createForm.password} onChange={e => setCreateForm({...createForm, password:e.target.value.toLowerCase().replace(/[^a-z0-9]/g,'')})} className="input-field font-mono" placeholder="password berbeda" required maxLength={30} />
            </div>
          )}
          {createForm.same_pass && createForm.code && <p className="text-xs text-gray-500">Password: <code className="font-mono bg-gray-100 px-1 rounded">{createForm.code}</code></p>}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Batal</button>
            <button type="submit" disabled={!createForm.package_id || !createForm.code} className="btn-primary">Buat</button>
          </div>
        </form>
      </Modal>

      {/* === GENERATE === */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Generate Voucher" size="md">
        <form onSubmit={handleBulk} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Paket</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {packages.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Belum ada paket hotspot</p>}
              {packages.map(p => <PkgCard key={p.id} pkg={p} sel={String(bulkForm.package_id)===String(p.id)} onSel={onBulkSelectPkg} />)}
            </div>
          </div>
          {selectedPkg && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-700">
              <p className="font-medium text-blue-800 mb-1">{selectedPkg.name}</p>
              <div className="grid grid-cols-2 gap-1">
                <p>Bandwidth: {selectedPkg.speed_download}M/{selectedPkg.speed_upload}M</p>
                <p>Uptime: {fmtUptime(selectedPkg.uptime_limit)}</p>
                <p>Expire: {selectedPkg.expire_after ? `${selectedPkg.expire_after} hari setelah login` : '-'}</p>
                <p>Kuota: {selectedPkg.quota ? `${selectedPkg.quota} GB` : 'Unlimited'}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
              <input type="number" min="1" max="500" value={bulkForm.quantity} onChange={e => setBulkForm({...bulkForm, quantity:e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Panjang Kode</label>
              <select value={bulkForm.code_length} onChange={e => setBulkForm({...bulkForm, code_length:e.target.value})} className="input-field">
                <option value="6">6 karakter</option>
                <option value="8">8 karakter</option>
                <option value="10">10 karakter</option>
                <option value="12">12 karakter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
              <input type="text" value={bulkForm.prefix} onChange={e => setBulkForm({...bulkForm, prefix:e.target.value.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,10)})} className="input-field font-mono" placeholder="opsional" maxLength={10} />
            </div>
          </div>
          {bulkForm.prefix && <p className="text-xs text-gray-400">Contoh: {bulkForm.prefix}-{'x'.repeat(Number(bulkForm.code_length))}</p>}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input type="checkbox" id="b_same" checked={bulkForm.same_user_pass} onChange={e => setBulkForm({...bulkForm, same_user_pass:e.target.checked})} className="rounded text-blue-600" />
            <label htmlFor="b_same" className="text-sm text-gray-700"><span className="font-medium">Username & Password sama</span><span className="text-gray-400 block text-xs">Login dengan kode voucher sebagai username dan password</span></label>
          </div>
          {selectedPkg && bulkForm.quantity && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              Total: <strong>{bulkForm.quantity}</strong> × Rp {Number(selectedPkg.price).toLocaleString('id-ID')}
              {isReseller && selectedPkg.reseller_commission > 0
                ? <> = <strong className="text-green-700">Rp {(Number(bulkForm.quantity) * Math.max(0, Number(selectedPkg.price) - Number(selectedPkg.reseller_commission))).toLocaleString('id-ID')}</strong></>
                : <> = <strong>Rp {(Number(bulkForm.quantity) * Number(selectedPkg.price)).toLocaleString('id-ID')}</strong></>
              }
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowBulkModal(false)} className="btn-secondary">Batal</button>
            <button type="submit" disabled={!bulkForm.package_id} className="btn-primary">Generate {bulkForm.quantity} Voucher</button>
          </div>
        </form>
      </Modal>

      {/* === CEK === */}
      <Modal isOpen={showCheckModal} onClose={() => setShowCheckModal(false)} title="Cek Voucher">
        <form onSubmit={handleCheck} className="space-y-4">
          <input type="text" value={checkCode} onChange={e => setCheckCode(e.target.value.toLowerCase())} className="input-field font-mono text-lg" placeholder="Masukkan kode voucher" required />
          <button type="submit" className="btn-primary w-full">Cek</button>
        </form>
        {checkResult && (
          <div className={`mt-4 p-4 rounded-lg ${checkResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className={`h-5 w-5 ${checkResult.valid ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`font-medium ${checkResult.valid ? 'text-green-700' : 'text-red-700'}`}>{checkResult.valid ? 'Valid ✓' : 'Tidak Valid ✗'}</span>
            </div>
            <p className="text-sm text-gray-600">{checkResult.message}</p>
            {checkResult.voucher && <p className="text-sm mt-1">Paket: <strong>{checkResult.voucher.package?.name}</strong> | Status: <strong>{checkResult.voucher.status}</strong></p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
