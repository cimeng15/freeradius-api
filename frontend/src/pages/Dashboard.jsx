import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../lib/api';
import StatsCard from '../components/StatsCard';
import { Users, Package, Router, Ticket, UserCheck, Wifi, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.get();
      setData(res.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      // Still show the page even if dashboard API fails
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
  const bandwidth = data?.bandwidth || {};
  const revenue = data?.revenue || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}! <span className="capitalize text-blue-600">({user?.role})</span></p>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700 text-sm">{error}</p>
          <button onClick={fetchDashboard} className="text-yellow-800 underline text-sm mt-1">Retry</button>
        </div>
      )}

      {/* Admin/NOC Dashboard */}
      {(user?.role === 'superadmin' || user?.role === 'noc') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Online Users" value={stats.online_users ?? 0} icon={Wifi} color="green" />
            <StatsCard title="Active Clients" value={stats.active_clients ?? 0} icon={Users} color="blue" />
            <StatsCard title="Active Routers" value={stats.active_routers ?? 0} icon={Router} color="purple" />
            <StatsCard title="Available Vouchers" value={stats.available_vouchers ?? 0} icon={Ticket} color="yellow" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Clients" value={stats.total_clients ?? 0} icon={Users} color="indigo" />
            <StatsCard title="Total Packages" value={stats.total_packages ?? 0} icon={Package} color="green" />
            <StatsCard title="Active Resellers" value={stats.active_resellers ?? 0} icon={UserCheck} color="purple" />
            <StatsCard title="Revenue (Month)" value={`Rp ${(revenue.this_month ?? 0).toLocaleString('id-ID')}`} icon={TrendingUp} color="green" />
          </div>

          {bandwidth && (bandwidth.download || bandwidth.upload) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatsCard title="Download Today" value={bandwidth.download_formatted || '0 B'} icon={ArrowDownToLine} color="blue" />
              <StatsCard title="Upload Today" value={bandwidth.upload_formatted || '0 B'} icon={ArrowUpFromLine} color="green" />
              <StatsCard title="Total Bandwidth" value={bandwidth.total_formatted || '0 B'} icon={TrendingUp} color="purple" />
            </div>
          )}

          {/* Recent Clients */}
          {data?.recent_clients?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Clients</h3>
              <div className="space-y-3">
                {data.recent_clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{client.username}</p>
                      <p className="text-xs text-gray-500">{client.package?.name || 'No package'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      client.status === 'active' ? 'bg-green-100 text-green-700' :
                      client.status === 'suspended' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{client.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reseller Dashboard */}
      {user?.role === 'reseller' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Available Vouchers" value={stats.available_vouchers ?? 0} icon={Ticket} color="green" />
          <StatsCard title="Used Vouchers" value={stats.used_vouchers ?? 0} icon={Ticket} color="blue" />
          <StatsCard title="Balance" value={`Rp ${(stats.balance ?? 0).toLocaleString('id-ID')}`} icon={TrendingUp} color="purple" />
          <StatsCard title="Commission" value={`${stats.commission_rate ?? 0}%`} icon={TrendingUp} color="yellow" />
        </div>
      )}

      {/* Client Dashboard */}
      {user?.role === 'client' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Status" value={stats.status ?? 'N/A'} icon={Wifi} color={stats.is_online ? 'green' : 'red'} />
          <StatsCard title="Total Download" value={stats.download_formatted || '0 B'} icon={ArrowDownToLine} color="blue" />
          <StatsCard title="Total Upload" value={stats.upload_formatted || '0 B'} icon={ArrowUpFromLine} color="green" />
          <StatsCard title="Total Usage" value={stats.total_formatted || '0 B'} icon={TrendingUp} color="purple" />
        </div>
      )}
    </div>
  );
}
