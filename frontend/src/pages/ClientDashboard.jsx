import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../lib/api';
import {
  Wifi, WifiOff, CreditCard, Calendar, Package, ArrowDownToLine,
  ArrowUpFromLine, Clock, CheckCircle, AlertCircle, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.get();
      setData(res.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const stats = data?.statistics || {};
  const billing = data?.billing || {};
  const client = data?.client || {};
  const transactions = data?.recent_transactions || [];

  const statusColor = {
    active: 'text-green-600 bg-green-50 border-green-200',
    suspended: 'text-red-600 bg-red-50 border-red-200',
    terminated: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  const statusLabel = {
    active: 'Aktif',
    suspended: 'Ditangguhkan',
    terminated: 'Dihentikan',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Pelanggan</h1>
          <p className="text-gray-500 mt-1">Selamat datang, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.is_online ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              <Wifi className="h-4 w-4" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              <WifiOff className="h-4 w-4" /> Offline
            </span>
          )}
        </div>
      </div>

      {/* Client ID Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm">ID Pelanggan</p>
            <p className="text-3xl font-bold font-mono tracking-wider mt-1">{stats.client_id || client.client_id}</p>
            <p className="text-blue-200 text-sm mt-3">{user?.name}</p>
            <p className="text-blue-100 text-xs mt-0.5">{client.username} • {client.phone}</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              client.status === 'active' ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'
            }`}>
              {client.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {statusLabel[client.status] || client.status}
            </div>
            <div className="mt-4">
              <p className="text-blue-200 text-xs">Paket</p>
              <p className="text-lg font-semibold">{billing.package_name}</p>
              <p className="text-blue-200 text-sm">{billing.package_speed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tagihan Bulanan</p>
              <p className="text-xl font-bold text-gray-900">Rp {Number(billing.package_price || 0).toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Jatuh Tempo Berikutnya</p>
              <p className="text-xl font-bold text-gray-900">
                {billing.next_billing ? new Date(billing.next_billing).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
              </p>
              <p className="text-xs text-yellow-600 font-medium">{billing.days_until_billing} hari lagi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paket Aktif</p>
              <p className="text-xl font-bold text-gray-900">{billing.package_name}</p>
              <p className="text-xs text-gray-500">{billing.package_speed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Action */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pembayaran</h3>
            <p className="text-sm text-gray-500 mt-1">Lakukan pembayaran tagihan internet Anda</p>
          </div>
          <button
            className="btn-primary flex items-center gap-2 px-6"
            onClick={() => toast('Fitur pembayaran akan segera tersedia!', { icon: '🚧' })}
          >
            <CreditCard className="h-4 w-4" />
            Bayar Sekarang
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Informasi Pembayaran</p>
              <p className="text-sm text-blue-700 mt-1">
                Tagihan bulan ini sebesar <span className="font-bold">Rp {Number(billing.package_price || 0).toLocaleString('id-ID')}</span> akan 
                jatuh tempo pada tanggal <span className="font-bold">{billing.billing_date}</span> setiap bulannya.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Payment gateway akan segera tersedia. Saat ini pembayaran dapat dilakukan melalui transfer bank.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <ArrowDownToLine className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Download</p>
              <p className="text-lg font-bold text-gray-900">{stats.download_formatted || '0 B'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-lg">
              <ArrowUpFromLine className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Upload</p>
              <p className="text-lg font-bold text-gray-900">{stats.upload_formatted || '0 B'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Waktu Online</p>
              <p className="text-lg font-bold text-gray-900">{stats.time_formatted || '00:00:00'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Riwayat Pembayaran</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada riwayat pembayaran</p>
            <p className="text-sm text-gray-400 mt-1">Riwayat pembayaran akan muncul di sini setelah Anda melakukan pembayaran</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    tx.status === 'completed' ? 'bg-green-100' : 
                    tx.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <CreditCard className={`h-4 w-4 ${
                      tx.status === 'completed' ? 'text-green-600' : 
                      tx.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pembayaran Bulanan</p>
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">Rp {Number(tx.amount || 0).toLocaleString('id-ID')}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{tx.status === 'completed' ? 'Lunas' : tx.status === 'pending' ? 'Menunggu' : 'Gagal'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
