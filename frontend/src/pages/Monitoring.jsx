import { useState, useEffect } from 'react';
import { monitoringAPI } from '../lib/api';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import { Wifi, ArrowDownToLine, ArrowUpFromLine, Clock, Users, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Monitoring() {
  const [tab, setTab] = useState('online');
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlinePagination, setOnlinePagination] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sessionPagination, setSessionPagination] = useState(null);
  const [bandwidthStats, setBandwidthStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  useEffect(() => { fetchRealtimeStats(); }, []);
  useEffect(() => {
    if (tab === 'online') fetchOnlineUsers();
    else if (tab === 'history') fetchSessionHistory();
    else if (tab === 'bandwidth') fetchBandwidthStats();
  }, [tab, period]);

  const fetchRealtimeStats = async () => {
    try {
      const res = await monitoringAPI.realtimeStats();
      setRealtimeStats(res.data);
    } catch (e) { /* ignore */ }
  };

  const fetchOnlineUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await monitoringAPI.onlineUsers({ page });
      const data = res.data;
      setOnlineUsers(data.sessions?.data || []);
      setOnlinePagination(data.sessions);
    } catch (error) {
      toast.error('Failed to load online users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await monitoringAPI.sessionHistory({ page });
      const data = res.data.data || res.data;
      setSessionHistory(data.data || data);
      setSessionPagination(data);
    } catch (error) {
      toast.error('Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  const fetchBandwidthStats = async () => {
    setLoading(true);
    try {
      const res = await monitoringAPI.bandwidthStats({ period });
      setBandwidthStats(res.data);
    } catch (error) {
      toast.error('Failed to load bandwidth stats');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchRealtimeStats();
    if (tab === 'online') fetchOnlineUsers();
    else if (tab === 'history') fetchSessionHistory();
    else if (tab === 'bandwidth') fetchBandwidthStats();
    toast.success('Refreshed');
  };

  const onlineColumns = [
    { key: 'username', label: 'Username' },
    { key: 'nas_ip', label: 'Router', render: (row) => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{row.nas_ip}</code> },
    { key: 'framed_ip', label: 'Client IP', render: (row) => row.framed_ip || '-' },
    { key: 'duration', label: 'Duration', render: (row) => (
      <span className="flex items-center gap-1 text-sm"><Clock className="h-3.5 w-3.5 text-gray-400" />{row.duration_formatted}</span>
    )},
    { key: 'download', label: 'Download', render: (row) => row.download_formatted || '0 B' },
    { key: 'upload', label: 'Upload', render: (row) => row.upload_formatted || '0 B' },
    { key: 'total', label: 'Total', render: (row) => <span className="font-medium">{row.total_formatted || '0 B'}</span> },
  ];

  const historyColumns = [
    { key: 'username', label: 'Username' },
    { key: 'nas_ip', label: 'Router', render: (row) => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{row.nas_ip}</code> },
    { key: 'start_time', label: 'Start', render: (row) => row.start_time ? new Date(row.start_time).toLocaleString('id-ID') : '-' },
    { key: 'duration', label: 'Duration', render: (row) => row.duration_formatted || '-' },
    { key: 'download', label: 'Download', render: (row) => row.download_formatted || '0 B' },
    { key: 'upload', label: 'Upload', render: (row) => row.upload_formatted || '0 B' },
    { key: 'terminate', label: 'Reason', render: (row) => (
      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{row.terminate_cause || '-'}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
          <p className="text-gray-500 mt-1">Real-time network monitoring</p>
        </div>
        <button onClick={refresh} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Real-time Stats */}
      {realtimeStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Online Users" value={realtimeStats.online_users || 0} icon={Wifi} color="green" />
          <StatsCard title="Active Clients" value={realtimeStats.active_clients || 0} icon={Users} color="blue" />
          <StatsCard title="Download Today" value={realtimeStats.today_bandwidth?.download_formatted || '0 B'} icon={ArrowDownToLine} color="purple" />
          <StatsCard title="Upload Today" value={realtimeStats.today_bandwidth?.upload_formatted || '0 B'} icon={ArrowUpFromLine} color="yellow" />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'online', label: 'Online Users' },
            { id: 'history', label: 'Session History' },
            { id: 'bandwidth', label: 'Bandwidth Stats' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {tab === 'online' && (
        <DataTable columns={onlineColumns} data={onlineUsers} pagination={onlinePagination} onPageChange={fetchOnlineUsers} loading={loading} />
      )}

      {tab === 'history' && (
        <DataTable columns={historyColumns} data={sessionHistory} pagination={sessionPagination} onPageChange={fetchSessionHistory} loading={loading} />
      )}

      {tab === 'bandwidth' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['today', 'week', 'month'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {bandwidthStats && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard title="Unique Users" value={bandwidthStats.statistics?.unique_users || 0} icon={Users} color="blue" />
                <StatsCard title="Total Sessions" value={bandwidthStats.statistics?.total_sessions || 0} icon={Clock} color="green" />
                <StatsCard title="Total Bandwidth" value={bandwidthStats.statistics?.total_formatted || '0 B'} icon={Wifi} color="purple" />
              </div>

              {bandwidthStats.top_users && bandwidthStats.top_users.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Top Users by Bandwidth</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bandwidthStats.top_users.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="username" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [(value / 1024 / 1024).toFixed(2) + ' MB']} />
                      <Bar dataKey="total_bandwidth" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
