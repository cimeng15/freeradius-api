import { useState, useEffect } from 'react';
import { packageAPI } from '../lib/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Packages() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [form, setForm] = useState({ name:'', type:'pppoe', price:'', speed_download:'', speed_upload:'', description:'', is_active:true, uptime_limit:'', uptime_unit:'jam', expire_after:'', quota:'', reseller_commission:'' });

  useEffect(() => { fetchPackages(); }, [typeFilter]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      const res = await packageAPI.list(params);
      setPackages(res.data.data || []);
    } catch (e) { toast.error('Gagal memuat paket'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const p = { name:form.name, type:form.type, price:Number(form.price), speed_download:Number(form.speed_download), speed_upload:Number(form.speed_upload), is_active:form.is_active, description:form.description||null };
      if (form.type === 'hotspot') {
        if (form.uptime_limit) {
          const v = Number(form.uptime_limit);
          const multiplier = form.uptime_unit === 'jam' ? 60 : form.uptime_unit === 'hari' ? 1440 : 1;
          p.uptime_limit = v * multiplier;
        }
        if (form.expire_after) p.expire_after = Number(form.expire_after);
        if (form.quota) p.quota = Number(form.quota);
        if (form.reseller_commission) p.reseller_commission = Number(form.reseller_commission);
      }
      if (editingPkg) { await packageAPI.update(editingPkg.id, p); toast.success('Paket diupdate'); }
      else { await packageAPI.create(p); toast.success('Paket ditambahkan'); }
      setShowModal(false); resetForm(); fetchPackages();
    } catch (error) { toast.error(error.response?.data?.message || 'Gagal'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus paket ini?')) return;
    try { await packageAPI.delete(id); toast.success('Paket dihapus'); fetchPackages(); }
    catch (error) { toast.error(error.response?.data?.message || 'Gagal menghapus'); }
  };

  const openEdit = (pkg) => {
    setEditingPkg(pkg);
    // Convert minutes to best display unit
    let uptimeVal = '', uptimeUnit = 'jam';
    if (pkg.uptime_limit) {
      if (pkg.uptime_limit % 1440 === 0) { uptimeVal = String(pkg.uptime_limit / 1440); uptimeUnit = 'hari'; }
      else if (pkg.uptime_limit % 60 === 0) { uptimeVal = String(pkg.uptime_limit / 60); uptimeUnit = 'jam'; }
      else { uptimeVal = String(pkg.uptime_limit); uptimeUnit = 'menit'; }
    }
    setForm({ name:pkg.name, type:pkg.type, price:pkg.price?.toString()||'', speed_download:pkg.speed_download?.toString()||'', speed_upload:pkg.speed_upload?.toString()||'', description:pkg.description||'', is_active:pkg.is_active??true, uptime_limit:uptimeVal, uptime_unit:uptimeUnit, expire_after:pkg.expire_after?.toString()||'', quota:pkg.quota?.toString()||'', reseller_commission:pkg.reseller_commission?.toString()||'' });
    setShowModal(true);
  };

  const resetForm = () => { setEditingPkg(null); setForm({ name:'', type:'pppoe', price:'', speed_download:'', speed_upload:'', description:'', is_active:true, uptime_limit:'', uptime_unit:'jam', expire_after:'', quota:'', reseller_commission:'' }); };

  const fmtUptime = (mins) => { if (!mins) return '-'; const h=Math.floor(mins/60), m=mins%60; return h>0&&m>0?`${h}j ${m}m`:h>0?`${h} Jam`:`${m} Menit`; };
  const canEdit = user?.role === 'superadmin';

  const columns = [
    { key:'name', label:'Nama Paket' },
    { key:'type', label:'Tipe', render:(r)=><span className={`px-2 py-1 rounded-full text-xs font-medium ${r.type==='pppoe'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>{r.type.toUpperCase()}</span> },
    { key:'speed', label:'Bandwidth', render:(r)=>`${r.speed_download}M/${r.speed_upload}M` },
    { key:'price', label:'Harga', render:(r)=>`Rp ${Number(r.price||0).toLocaleString('id-ID')}` },
    ...(typeFilter!=='pppoe'?[{ key:'uptime', label:'Uptime', render:(r)=>r.type==='hotspot'?fmtUptime(r.uptime_limit):'-' }]:[]),
    ...(typeFilter!=='pppoe'?[{ key:'expire', label:'Expire', render:(r)=>r.type==='hotspot'&&r.expire_after?`${r.expire_after} Hari`:'-' }]:[]),
    ...(typeFilter!=='pppoe'?[{ key:'commission', label:'Komisi Reseller', render:(r)=>r.type==='hotspot'&&r.reseller_commission>0?`Rp ${Number(r.reseller_commission).toLocaleString('id-ID')}`:'-' }]:[]),
    { key:'is_active', label:'Status', render:(r)=><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${r.is_active?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{r.is_active?'Aktif':'Nonaktif'}</span> },
    ...(canEdit?[{ key:'actions', label:'Aksi', render:(r)=><div className="flex items-center gap-2"><button onClick={()=>openEdit(r)} className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4"/></button><button onClick={()=>handleDelete(r.id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4"/></button></div> }]:[]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Paket</h1><p className="text-gray-500 mt-1">Kelola paket internet & voucher</p></div>
        {canEdit && <button onClick={()=>{resetForm();setShowModal(true);}} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4"/>Tambah Paket</button>}
      </div>
      <div className="flex gap-3">
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="input-field w-auto">
          <option value="">Semua Tipe</option><option value="pppoe">PPPoE</option><option value="hotspot">Hotspot</option>
        </select>
      </div>
      <DataTable columns={columns} data={packages} loading={loading}/>

      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={editingPkg?'Edit Paket':'Tambah Paket'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Paket</label>
            <div className="flex gap-3">
              {['pppoe','hotspot'].map(t=>(
                <button key={t} type="button" onClick={()=>setForm({...form,type:t})}
                  className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all ${form.type===t?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {t==='pppoe'?'🌐 PPPoE':'📶 Hotspot Voucher'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket</label>
            <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field" required placeholder={form.type==='pppoe'?'Paket 10 Mbps':'Voucher 5Mbps 15Jam/3Hari'}/>
          </div>

          {/* Bandwidth - both types */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Download (Mbps)</label><input type="number" min="1" value={form.speed_download} onChange={e=>setForm({...form,speed_download:e.target.value})} className="input-field" required/></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Upload (Mbps)</label><input type="number" min="1" value={form.speed_upload} onChange={e=>setForm({...form,speed_upload:e.target.value})} className="input-field" required/></div>
          </div>

          {/* Hotspot-only fields */}
          {form.type === 'hotspot' && (
            <>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
                <p className="text-sm font-semibold text-green-800">⏱️ Limitasi Hotspot</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Batas Waktu Online</label>
                    <div className="flex gap-2">
                      <input type="number" min="1" value={form.uptime_limit} onChange={e=>setForm({...form,uptime_limit:e.target.value})} className="input-field flex-1" placeholder="15"/>
                      <select value={form.uptime_unit} onChange={e=>setForm({...form,uptime_unit:e.target.value})} className="input-field w-24">
                        <option value="menit">Menit</option>
                        <option value="jam">Jam</option>
                        <option value="hari">Hari</option>
                      </select>
                    </div>
                    {form.uptime_limit && (
                      <p className="text-xs text-green-600 mt-1">
                        = {fmtUptime(Number(form.uptime_limit) * (form.uptime_unit==='jam'?60:form.uptime_unit==='hari'?1440:1))} total waktu online
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Masa Aktif Setelah Login</label>
                    <div className="flex gap-2 items-center">
                      <input type="number" min="1" value={form.expire_after} onChange={e=>setForm({...form,expire_after:e.target.value})} className="input-field flex-1" placeholder="3"/>
                      <span className="text-sm text-green-700 font-medium whitespace-nowrap">Hari</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Voucher hangus {form.expire_after||'X'} hari setelah pertama kali dipakai</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kuota (GB, opsional)</label>
                  <input type="number" min="1" value={form.quota} onChange={e=>setForm({...form,quota:e.target.value})} className="input-field" placeholder="Kosongkan = unlimited"/>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-purple-800 mb-3">💰 Komisi Reseller</p>
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-1">Komisi per Voucher (Rp)</label>
                  <input type="number" min="0" value={form.reseller_commission} onChange={e=>setForm({...form,reseller_commission:e.target.value})} className="input-field" placeholder="0"/>
                  {form.price && form.reseller_commission && (
                    <p className="text-xs text-purple-600 mt-1">
                      Harga jual: Rp {Number(form.price).toLocaleString('id-ID')} → Harga reseller: Rp {Math.max(0,Number(form.price)-Number(form.reseller_commission)).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
            <input type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="input-field" required/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="input-field" rows="2"/>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})} className="rounded"/>
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Aktif</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">{editingPkg?'Update':'Tambah'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
