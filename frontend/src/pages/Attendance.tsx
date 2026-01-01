import { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import api from '../utils/api';
import { formatTime, formatDate } from '../utils/format';
import type { Attendance as AttendanceType, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Camera,
  Clock,
  LogIn,
  LogOut,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  X,
} from 'lucide-react';

export default function Attendance() {
  const { user } = useAuth();
  const webcamRef = useRef<Webcam>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceType | null>(null);
  const [myHistory, setMyHistory] = useState<AttendanceType[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'in' | 'out'>('in');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'clockin' | 'history' | 'all'>('clockin');
  const [currentTime, setCurrentTime] = useState(new Date());

  const isBossOrAbove = user?.role === 'superadmin' || user?.role === 'boss';

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadMyHistory();
    } else if (activeTab === 'all' && isBossOrAbove) {
      loadAllAttendance();
    }
  }, [activeTab, selectedMonth, selectedYear, selectedUserId]);

  const loadData = async () => {
    try {
      const [todayRes] = await Promise.all([api.get('/attendance/today')]);
      setTodayAttendance(todayRes.data);

      if (isBossOrAbove) {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyHistory = async () => {
    try {
      const res = await api.get('/attendance/my-history', {
        params: { month: selectedMonth, year: selectedYear },
      });
      setMyHistory(res.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadAllAttendance = async () => {
    try {
      const res = await api.get('/attendance/all', {
        params: {
          month: selectedMonth,
          year: selectedYear,
          userId: selectedUserId || undefined,
        },
      });
      setAllAttendance(res.data);
    } catch (error) {
      console.error('Failed to load all attendance:', error);
    }
  };

  const openCamera = (mode: 'in' | 'out') => {
    setCameraMode(mode);
    setShowCamera(true);
  };

  const captureAndSubmit = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      alert('Failed to capture photo');
      return;
    }

    setProcessing(true);
    try {
      const endpoint = cameraMode === 'in' ? '/attendance/clock-in' : '/attendance/clock-out';
      const res = await api.post(endpoint, { selfieData: imageSrc });
      setTodayAttendance(res.data);
      setShowCamera(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to record attendance');
    } finally {
      setProcessing(false);
    }
  }, [cameraMode]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'badge-success',
      late: 'badge-warning',
      absent: 'badge-error',
      leave: 'badge-info',
    };
    return `badge ${styles[status] || 'badge-ghost'}`;
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
      <h1 className="text-2xl font-bold">Attendance</h1>

      <div className="tabs tabs-boxed w-fit">
        <button
          className={`tab ${activeTab === 'clockin' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('clockin')}
        >
          <Clock size={16} className="mr-2" /> Clock In/Out
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Calendar size={16} className="mr-2" /> My History
        </button>
        {isBossOrAbove && (
          <button
            className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <UserIcon size={16} className="mr-2" /> All Staff
          </button>
        )}
      </div>

      {activeTab === 'clockin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {currentTime.toLocaleTimeString('en-MY', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
              <p className="text-lg text-base-content/60">
                {currentTime.toLocaleDateString('en-MY', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>

              <div className="divider"></div>

              <div className="flex gap-4">
                {!todayAttendance?.clock_in ? (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => openCamera('in')}
                  >
                    <LogIn size={24} /> Clock In
                  </button>
                ) : !todayAttendance?.clock_out ? (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-base-content/60">Clocked In At</p>
                      <p className="text-xl font-bold text-success">
                        {formatTime(todayAttendance.clock_in)}
                      </p>
                    </div>
                    <button
                      className="btn btn-warning btn-lg"
                      onClick={() => openCamera('out')}
                    >
                      <LogOut size={24} /> Clock Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-8">
                    <div className="text-center">
                      <p className="text-sm text-base-content/60">Clocked In</p>
                      <p className="text-xl font-bold text-success">
                        {formatTime(todayAttendance.clock_in)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-base-content/60">Clocked Out</p>
                      <p className="text-xl font-bold text-warning">
                        {formatTime(todayAttendance.clock_out)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {todayAttendance && (
                <div className={getStatusBadge(todayAttendance.status)}>
                  {todayAttendance.status.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {todayAttendance && (todayAttendance.clock_in_selfie || todayAttendance.clock_out_selfie) && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Today's Selfies</h2>
                <div className="flex gap-4 flex-wrap">
                  {todayAttendance.clock_in_selfie && (
                    <div>
                      <p className="text-sm text-base-content/60 mb-2">Clock In</p>
                      <img
                        src={todayAttendance.clock_in_selfie}
                        alt="Clock in selfie"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  {todayAttendance.clock_out_selfie && (
                    <div>
                      <p className="text-sm text-base-content/60 mb-2">Clock Out</p>
                      <img
                        src={todayAttendance.clock_out_selfie}
                        alt="Clock out selfie"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">My Attendance History</h2>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (selectedMonth === 1) {
                      setSelectedMonth(12);
                      setSelectedYear(selectedYear - 1);
                    } else {
                      setSelectedMonth(selectedMonth - 1);
                    }
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-medium">
                  {new Date(selectedYear, selectedMonth - 1).toLocaleString('en', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (selectedMonth === 12) {
                      setSelectedMonth(1);
                      setSelectedYear(selectedYear + 1);
                    } else {
                      setSelectedMonth(selectedMonth + 1);
                    }
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myHistory.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.clock_in ? formatTime(record.clock_in) : '-'}</td>
                      <td>{record.clock_out ? formatTime(record.clock_out) : '-'}</td>
                      <td>
                        <span className={getStatusBadge(record.status)}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'all' && isBossOrAbove && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
              <h2 className="card-title">All Staff Attendance</h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="select select-bordered select-sm"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">All Staff</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
                <select
                  className="select select-bordered select-sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  className="select select-bordered select-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - 2 + i}>
                      {new Date().getFullYear() - 2 + i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Status</th>
                    <th>Selfies</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttendance.map((record) => (
                    <tr key={record.id}>
                      <td>{record.full_name}</td>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.clock_in ? formatTime(record.clock_in) : '-'}</td>
                      <td>{record.clock_out ? formatTime(record.clock_out) : '-'}</td>
                      <td>
                        <span className={getStatusBadge(record.status)}>
                          {record.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {record.clock_in_selfie && (
                            <img
                              src={record.clock_in_selfie}
                              alt="In"
                              className="w-10 h-10 rounded object-cover cursor-pointer"
                              onClick={() => window.open(record.clock_in_selfie, '_blank')}
                            />
                          )}
                          {record.clock_out_selfie && (
                            <img
                              src={record.clock_out_selfie}
                              alt="Out"
                              className="w-10 h-10 rounded object-cover cursor-pointer"
                              onClick={() => window.open(record.clock_out_selfie, '_blank')}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">
              {cameraMode === 'in' ? 'Clock In' : 'Clock Out'} - Take Selfie
            </h3>
            <div className="relative">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user' }}
                className="w-full rounded-lg"
              />
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowCamera(false)}
                disabled={processing}
              >
                <X size={18} /> Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={captureAndSubmit}
                disabled={processing}
              >
                {processing ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <Camera size={18} /> Capture & Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
