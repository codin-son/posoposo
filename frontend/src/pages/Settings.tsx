import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatDateTime } from '../utils/format';
import {
  Save,
  Database,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  Building,
  Percent,
} from 'lucide-react';

interface Backup {
  filename: string;
  size: number;
  created: string;
}

export default function Settings() {
  const [settings, setSettings] = useState({
    restaurant_name: '',
    sst_rate: '0',
    work_start_time: '09:00',
    late_threshold_minutes: '15',
  });
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, backupsRes] = await Promise.all([
        api.get('/settings'),
        api.get('/backup/list'),
      ]);
      setSettings({ ...settings, ...settingsRes.data });
      setBackups(backupsRes.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Save settings failed:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      await api.post('/backup/create');
      loadData();
      alert('Backup created successfully');
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const downloadBackup = async (filename: string) => {
    try {
      const res = await api.get(`/backup/download/${filename}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download backup');
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return;
    try {
      await api.delete(`/backup/${filename}`);
      loadData();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete backup');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">
              <Building size={20} /> Restaurant Settings
            </h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Restaurant Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={settings.restaurant_name}
                  onChange={(e) =>
                    setSettings({ ...settings, restaurant_name: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    <Percent size={16} className="inline mr-1" />
                    SST Rate (%)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input input-bordered"
                  value={settings.sst_rate}
                  onChange={(e) => setSettings({ ...settings, sst_rate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">
              <Clock size={20} /> Attendance Settings
            </h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Work Start Time</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered"
                  value={settings.work_start_time}
                  onChange={(e) =>
                    setSettings({ ...settings, work_start_time: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Late Threshold (minutes)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={settings.late_threshold_minutes}
                  onChange={(e) =>
                    setSettings({ ...settings, late_threshold_minutes: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={saveSettings}
        disabled={saving}
      >
        {saving ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <Save size={18} />
        )}
        Save Settings
      </button>

      <div className="divider"></div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">
              <Database size={20} /> Database Backups
            </h2>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm" onClick={loadData}>
                <RefreshCw size={16} /> Refresh
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={createBackup}
                disabled={creatingBackup}
              >
                {creatingBackup ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Database size={16} />
                )}
                Create Backup
              </button>
            </div>
          </div>

          <p className="text-sm text-base-content/60 mb-4">
            Automatic backups run daily at 2:00 AM. Backups older than 30 days are automatically
            deleted.
          </p>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-base-content/60">
                      No backups available
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => (
                    <tr key={backup.filename}>
                      <td className="font-mono text-sm">{backup.filename}</td>
                      <td>{formatBytes(backup.size)}</td>
                      <td>{formatDateTime(backup.created)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => downloadBackup(backup.filename)}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => deleteBackup(backup.filename)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
