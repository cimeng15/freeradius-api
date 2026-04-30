import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Wifi, CreditCard, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientLogin() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const { clientLogin } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const appName = settings.app_name || 'RadiusBill';
  const logoUrl = settings.app_logo ? `/storage/${settings.app_logo}` : null;

  // Detect if input looks like client_id or phone
  const isClientId = identifier.length === 10 && identifier.startsWith('1985');
  const inputHint = identifier.length === 0
    ? ''
    : isClientId
      ? '✓ ID Pelanggan terdeteksi'
      : identifier.length >= 10
        ? '✓ Nomor HP terdeteksi'
        : 'Masukkan minimal 10 digit';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (identifier.length < 8) {
      toast.error('Masukkan ID Pelanggan atau nomor HP yang valid');
      return;
    }
    setLoading(true);
    try {
      await clientLogin({ identifier });
      toast.success('Login berhasil!');
      navigate('/');
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error(error.response?.data?.message || 'Login gagal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-16 w-16 object-contain mx-auto mb-4 rounded-2xl" />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
              <Wifi className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{appName}</h1>
          <p className="text-gray-500 mt-1">Portal Pelanggan</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Masuk Pelanggan</h2>
          <p className="text-sm text-gray-500 mb-6">Masukkan ID Pelanggan atau Nomor HP Anda</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Pelanggan / Nomor HP</label>
              <div className="relative">
                {isClientId ? (
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                ) : (
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                )}
                <input
                  type="tel"
                  value={identifier}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                    setIdentifier(val);
                  }}
                  className="input-field pl-11 font-mono text-xl tracking-wider py-3"
                  placeholder="1985XXXXXX atau 08XXXXXXXXX"
                  maxLength={15}
                  required
                  autoFocus
                />
              </div>
              {identifier.length > 0 && (
                <p className={`text-xs mt-1.5 ${identifier.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                  {inputHint}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading || identifier.length < 8} className="btn-primary w-full py-3 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Masuk...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm font-medium text-blue-800 mb-2">Cara Login:</p>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Gunakan <strong>ID Pelanggan</strong> (10 digit, awalan 1985)</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Atau gunakan <strong>Nomor HP</strong> yang terdaftar</span>
              </div>
            </div>
          </div>

          {/* Demo */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-1">Demo:</p>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p>ID Pelanggan: <span className="font-mono font-bold">1985000001</span></p>
              <p>Nomor HP: <span className="font-mono font-bold">081234567890</span></p>
            </div>
          </div>

          {/* Link to staff login */}
          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
              ← Login Staff
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
