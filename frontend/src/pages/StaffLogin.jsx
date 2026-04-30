import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Shield, Eye, EyeOff, User, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffLogin() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const appName = settings.app_name || 'RadiusBill';
  const logoUrl = settings.app_logo ? `/storage/${settings.app_logo}` : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ identity, password });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-16 w-16 object-contain mx-auto mb-4 rounded-2xl" />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{appName}</h1>
          <p className="text-gray-500 mt-1">Staff Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Masuk Staff</h2>
          <p className="text-sm text-gray-500 mb-6">Gunakan email atau username Anda</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  className="input-field pl-10"
                  placeholder="email@domain.com atau username"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
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

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Masuk...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          {/* Demo */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Admin:</span> admin / password</p>
              <p><span className="font-medium">NOC:</span> noc / password</p>
              <p><span className="font-medium">Reseller:</span> reseller / password</p>
            </div>
          </div>

          {/* Link to client login */}
          <div className="mt-4 text-center">
            <Link to="/client-login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Login sebagai Pelanggan →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
