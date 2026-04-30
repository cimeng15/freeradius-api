import { useState, useEffect, useRef } from 'react';
import { settingsAPI, authAPI } from '../lib/api';
import { useSettings } from '../contexts/SettingsContext';
import {
  Building, Image, Terminal, Save, Upload, Globe, Cpu, Clock,
  HardDrive, Play, Loader2, CheckCircle, XCircle, MapPin,
  Moon, Sun, Monitor, Lock, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { darkMode, toggleDarkMode, refreshSettings } = useSettings();
  const [tab, setTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rawSettings, setRawSettings] = useState({});
  const [systemInfo, setSystemInfo] = useState(null);
  const [pingResult, setPingResult] = useState(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingHost, setPingHost] = useState('');
  const [traceResult, setTraceResult] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceHost, setTraceHost] = useState('');
  const logoInput = useRef(null);

  const [general, setGeneral] = useState({
    app_name: '', app_description: '', company_name: '',
    company_address: '', company_phone: '', company_email: ''
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => { if (tab === 'system') fetchSystemInfo(); }, [tab]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getAll();
      const data = res.data.data || {};
      setRawSettings(data);
      const gen = {};
      (data.general || []).forEach(s => { gen[s.key] = s.value || ''; });
      setGeneral(prev => ({ ...prev, ...gen }));
    } catch (e) {
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await settingsAPI.systemInfo();
      setSystemInfo(res.data.data);
    } catch (e) { /* ignore */ }
  };

  const saveGeneral = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.updateGeneral(general);
      toast.success('Pengaturan berhasil disimpan');
      await fetchSettings();
      refreshSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      await settingsAPI.uploadLogo(formData);
      toast.success('Logo berhasil diupload');
      await fetchSettings();
      refreshSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal upload logo');
    }
  };

  const handlePing = async (e) => {
    e.preventDefault();
    if (!pingHost) return;
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await settingsAPI.ping({ host: pingHost, count: 4 });
      setPingResult(res.data.data);
    } catch (error) {
      toast.error('Ping gagal');
    } finally {
      setPingLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.new_password_confirmation) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }
    if (pwForm.new_password.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }
    setPwSaving(true);
    try {
      await authAPI.changePassword(pwForm);
      toast.success('Password berhasil diubah');
      setPwForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (error) {
      const msg = error.response?.data?.errors?.current_password?.[0] || error.response?.data?.message || 'Gagal mengubah password';
      toast.error(msg);
    } finally {
      setPwSaving(false);
    }
  };

  const handleTraceroute = async (e) => {
    e.preventDefault();
    if (!traceHost) return;
    setTraceLoading(true);
    setTraceResult(null);
    try {
      const res = await settingsAPI.traceroute({ host: traceHost });
      setTraceResult(res.data.data);
    } catch (error) {
      toast.error('Traceroute gagal');
    } finally {
      setTraceLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Umum', icon: Building },
    { id: 'appearance', label: 'Tampilan', icon: Image },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'tools', label: 'Tools', icon: Terminal },
    { id: 'system', label: 'Sistem', icon: Cpu },
  ];

  const logoUrl = (rawSettings.appearance || []).find(s => s.key === 'app_logo')?.value;
  const dm = darkMode;
  const card = dm ? 'bg-gray-900 border-gray-800 text-gray-100' : 'bg-white border-gray-200';
  const inputCls = dm ? 'input-field bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'input-field';
  const label = dm ? 'text-gray-300' : 'text-gray-700';
  const sub = dm ? 'text-gray-400' : 'text-gray-500';

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Pengaturan</h1>
        <p className={`mt-1 ${sub}`}>Konfigurasi sistem aplikasi</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? (dm ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-700')
                    : (dm ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100')
                }`}
              >
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* === GENERAL === */}
          {tab === 'general' && (
            <div className={`rounded-xl border p-6 ${card}`}>
              <h2 className="text-lg font-semibold mb-1">Pengaturan Umum</h2>
              <p className={`text-sm mb-6 ${sub}`}>Informasi dasar aplikasi dan perusahaan</p>
              <form onSubmit={saveGeneral} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${label}`}>Nama Aplikasi</label>
                    <input type="text" value={general.app_name} onChange={e => setGeneral({...general, app_name: e.target.value})} className={inputCls} required />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${label}`}>Deskripsi</label>
                    <input type="text" value={general.app_description} onChange={e => setGeneral({...general, app_description: e.target.value})} className={inputCls} />
                  </div>
                </div>
                <div className={`border-t pt-4 mt-4 ${dm ? 'border-gray-700' : ''}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${label}`}>Informasi Perusahaan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${label}`}>Nama Perusahaan</label>
                      <input type="text" value={general.company_name} onChange={e => setGeneral({...general, company_name: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${label}`}>Email</label>
                      <input type="email" value={general.company_email} onChange={e => setGeneral({...general, company_email: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${label}`}>Telepon</label>
                      <input type="text" value={general.company_phone} onChange={e => setGeneral({...general, company_phone: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${label}`}>Alamat</label>
                      <input type="text" value={general.company_address} onChange={e => setGeneral({...general, company_address: e.target.value})} className={inputCls} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* === APPEARANCE === */}
          {tab === 'appearance' && (
            <div className="space-y-6">
              {/* Logo */}
              <div className={`rounded-xl border p-6 ${card}`}>
                <h2 className="text-lg font-semibold mb-1">Logo Aplikasi</h2>
                <p className={`text-sm mb-6 ${sub}`}>Logo akan tampil di sidebar dan halaman login</p>
                <div className="flex items-start gap-6">
                  <div className={`w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
                    {logoUrl ? (
                      <img src={`/storage/${logoUrl}`} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-center">
                        <Image className={`h-8 w-8 mx-auto ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={`text-xs mt-1 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>No logo</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <input type="file" ref={logoInput} onChange={handleLogoUpload} accept="image/png,image/jpeg,image/svg+xml" className="hidden" />
                    <button onClick={() => logoInput.current?.click()} className="btn-secondary flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Upload Logo
                    </button>
                    <p className={`text-xs mt-2 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>PNG, JPG, atau SVG. Maks 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Dark Mode */}
              <div className={`rounded-xl border p-6 ${card}`}>
                <h2 className="text-lg font-semibold mb-1">Mode Tampilan</h2>
                <p className={`text-sm mb-6 ${sub}`}>Pilih tema terang atau gelap</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => { if (darkMode) toggleDarkMode(); }}
                    className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                      !darkMode ? 'border-blue-500 bg-blue-50' : (dm ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
                    }`}
                  >
                    <div className={`p-3 rounded-full ${!darkMode ? 'bg-blue-100 text-blue-600' : (dm ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                      <Sun className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">Light Mode</p>
                      <p className={`text-xs ${sub}`}>Tema terang</p>
                    </div>
                    {!darkMode && <CheckCircle className="h-5 w-5 text-blue-500" />}
                  </button>

                  <button
                    onClick={() => { if (!darkMode) toggleDarkMode(); }}
                    className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                      darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-3 rounded-full ${darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-100 text-gray-500'}`}>
                      <Moon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">Dark Mode</p>
                      <p className={`text-xs ${sub}`}>Tema gelap</p>
                    </div>
                    {darkMode && <CheckCircle className="h-5 w-5 text-blue-400" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === TOOLS === */}
          {tab === 'tools' && (
            <div className="space-y-6">
              <div className={`rounded-xl border p-6 ${card}`}>
                <h2 className="text-lg font-semibold mb-1">Ping</h2>
                <p className={`text-sm mb-4 ${sub}`}>Test konektivitas ke IP atau hostname</p>
                <form onSubmit={handlePing} className="flex gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={pingHost} onChange={e => setPingHost(e.target.value)} className={`${inputCls} pl-10`} placeholder="8.8.8.8 atau google.com" required />
                  </div>
                  <button type="submit" disabled={pingLoading} className="btn-primary flex items-center gap-2">
                    {pingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Ping
                  </button>
                </form>
                {pingResult && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {pingResult.reachable
                        ? <><CheckCircle className="h-5 w-5 text-green-500" /><span className="font-medium text-green-600">{pingResult.host} — Reachable</span></>
                        : <><XCircle className="h-5 w-5 text-red-500" /><span className="font-medium text-red-600">{pingResult.host} — Unreachable</span></>
                      }
                    </div>
                    {pingResult.stats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Sent', value: pingResult.stats.packets_sent },
                          { label: 'Received', value: pingResult.stats.packets_received },
                          { label: 'Loss', value: pingResult.stats.packet_loss },
                          { label: 'Avg', value: pingResult.stats.avg_ms ? `${pingResult.stats.avg_ms} ms` : '-' },
                        ].map((s, i) => (
                          <div key={i} className={`rounded-lg p-3 text-center ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <p className="text-lg font-bold">{s.value}</p>
                            <p className={`text-xs ${sub}`}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <details>
                      <summary className={`text-sm cursor-pointer hover:underline ${sub}`}>Raw Output</summary>
                      <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap">{pingResult.output}</pre>
                    </details>
                  </div>
                )}
              </div>

              <div className={`rounded-xl border p-6 ${card}`}>
                <h2 className="text-lg font-semibold mb-1">Traceroute</h2>
                <p className={`text-sm mb-4 ${sub}`}>Lacak rute jaringan ke tujuan</p>
                <form onSubmit={handleTraceroute} className="flex gap-3">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={traceHost} onChange={e => setTraceHost(e.target.value)} className={`${inputCls} pl-10`} placeholder="8.8.8.8 atau google.com" required />
                  </div>
                  <button type="submit" disabled={traceLoading} className="btn-primary flex items-center gap-2">
                    {traceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Trace
                  </button>
                </form>
                {traceResult && (
                  <pre className="mt-4 p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap">{traceResult.output}</pre>
                )}
              </div>
            </div>
          )}

          {/* === PASSWORD === */}
          {tab === 'password' && (
            <div className={`rounded-xl border p-6 ${card}`}>
              <h2 className="text-lg font-semibold mb-1">Ganti Password</h2>
              <p className={`text-sm mb-6 ${sub}`}>Ubah password akun Anda</p>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${label}`}>Password Saat Ini</label>
                  <div className="relative">
                    <input type={showPw.current ? 'text' : 'password'} value={pwForm.current_password} onChange={e => setPwForm({...pwForm, current_password: e.target.value})} className={inputCls} required />
                    <button type="button" onClick={() => setShowPw({...showPw, current: !showPw.current})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${label}`}>Password Baru</label>
                  <div className="relative">
                    <input type={showPw.new ? 'text' : 'password'} value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})} className={inputCls} required minLength={8} />
                    <button type="button" onClick={() => setShowPw({...showPw, new: !showPw.new})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className={`text-xs mt-1 ${sub}`}>Minimal 8 karakter</p>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${label}`}>Konfirmasi Password Baru</label>
                  <div className="relative">
                    <input type={showPw.confirm ? 'text' : 'password'} value={pwForm.new_password_confirmation} onChange={e => setPwForm({...pwForm, new_password_confirmation: e.target.value})} className={inputCls} required minLength={8} />
                    <button type="button" onClick={() => setShowPw({...showPw, confirm: !showPw.confirm})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pwForm.new_password && pwForm.new_password_confirmation && pwForm.new_password !== pwForm.new_password_confirmation && (
                    <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                  )}
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={pwSaving} className="btn-primary flex items-center gap-2">
                    {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Ubah Password
                  </button>
                </div>
              </form>

              <div className={`mt-8 p-4 rounded-lg border ${dm ? 'bg-gray-800 border-gray-700' : 'bg-yellow-50 border-yellow-200'}`}>
                <p className={`text-sm font-medium mb-2 ${dm ? 'text-yellow-400' : 'text-yellow-800'}`}>🔑 Lupa Password?</p>
                <p className={`text-sm ${dm ? 'text-gray-400' : 'text-yellow-700'}`}>
                  Jika lupa password, gunakan perintah berikut di terminal server:
                </p>
                <code className={`block mt-2 p-2 rounded text-xs font-mono ${dm ? 'bg-gray-900 text-green-400' : 'bg-gray-900 text-green-400'}`}>
                  php artisan app:reset-password --user=admin --password=newpassword
                </code>
                <p className={`text-xs mt-2 ${sub}`}>
                  Atau via API dengan master key (APP_KEY dari .env):
                </p>
                <code className={`block mt-1 p-2 rounded text-xs font-mono ${dm ? 'bg-gray-900 text-green-400' : 'bg-gray-900 text-green-400'}`}>
                  {`curl -X POST /api/reset-password -d '{"identity":"admin","new_password":"newpass","master_key":"APP_KEY"}'`}
                </code>
              </div>
            </div>
          )}

          {/* === SYSTEM === */}
          {tab === 'system' && (
            <div className={`rounded-xl border p-6 ${card}`}>
              <h2 className="text-lg font-semibold mb-1">Informasi Sistem</h2>
              <p className={`text-sm mb-6 ${sub}`}>Detail teknis server</p>
              {systemInfo ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Cpu, label: 'PHP Version', value: systemInfo.php_version },
                    { icon: Monitor, label: 'Laravel Version', value: systemInfo.laravel_version },
                    { icon: Globe, label: 'OS', value: systemInfo.os },
                    { icon: Clock, label: 'Server Time', value: systemInfo.server_time },
                    { icon: Globe, label: 'Timezone', value: systemInfo.timezone },
                    { icon: HardDrive, label: 'Disk Free', value: systemInfo.disk_free },
                    { icon: HardDrive, label: 'Disk Total', value: systemInfo.disk_total },
                    { icon: Cpu, label: 'Memory Usage', value: systemInfo.memory_usage },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <item.icon className={`h-5 w-5 shrink-0 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                      <div>
                        <p className={`text-xs ${sub}`}>{item.label}</p>
                        <p className="text-sm font-medium">{item.value}</p>
                      </div>
                    </div>
                  ))}
                  {systemInfo.uptime && (
                    <div className={`sm:col-span-2 flex items-center gap-3 p-3 rounded-lg ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <Clock className={`h-5 w-5 shrink-0 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                      <div>
                        <p className={`text-xs ${sub}`}>Uptime</p>
                        <p className="text-sm font-medium">{systemInfo.uptime}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
