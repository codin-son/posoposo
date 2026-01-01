import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/format';
import type { DailyAnalytics, WeeklyAnalytics, MonthlyAnalytics } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Analytics() {
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dailyData, setDailyData] = useState<DailyAnalytics | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyAnalytics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [view, selectedDate, selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (view === 'daily') {
        const res = await api.get('/analytics/daily', { params: { date: selectedDate } });
        setDailyData(res.data);
      } else if (view === 'weekly') {
        const res = await api.get('/analytics/weekly', { params: { endDate: selectedDate } });
        setWeeklyData(res.data);
      } else {
        const res = await api.get('/analytics/monthly', {
          params: { month: selectedMonth, year: selectedYear },
        });
        setMonthlyData(res.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      let startDate: string, endDate: string;
      if (view === 'daily') {
        startDate = endDate = selectedDate;
      } else if (view === 'weekly') {
        const end = new Date(selectedDate);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        startDate = start.toISOString().split('T')[0];
        endDate = selectedDate;
      } else {
        startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;
      }

      const res = await api.get('/analytics/export', {
        params: { startDate, endDate, format: 'csv' },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_${startDate}_${endDate}.csv`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  const navigateDate = (direction: number) => {
    if (view === 'daily') {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + direction);
      setSelectedDate(date.toISOString().split('T')[0]);
    } else if (view === 'weekly') {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + direction * 7);
      setSelectedDate(date.toISOString().split('T')[0]);
    } else {
      let newMonth = selectedMonth + direction;
      let newYear = selectedYear;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
    }
  };

  const getSummary = () => {
    if (view === 'daily' && dailyData) return dailyData.summary;
    if (view === 'weekly' && weeklyData) return weeklyData.summary;
    if (view === 'monthly' && monthlyData) return monthlyData.summary;
    return null;
  };

  const summary = getSummary();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Sales Analytics</h1>
        <button className="btn btn-outline" onClick={exportData}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="join">
          <button
            className={`join-item btn ${view === 'daily' ? 'btn-primary' : ''}`}
            onClick={() => setView('daily')}
          >
            Daily
          </button>
          <button
            className={`join-item btn ${view === 'weekly' ? 'btn-primary' : ''}`}
            onClick={() => setView('weekly')}
          >
            Weekly
          </button>
          <button
            className={`join-item btn ${view === 'monthly' ? 'btn-primary' : ''}`}
            onClick={() => setView('monthly')}
          >
            Monthly
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => navigateDate(-1)}>
            <ChevronLeft size={20} />
          </button>

          {view === 'monthly' ? (
            <div className="flex gap-2">
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
          ) : (
            <input
              type="date"
              className="input input-bordered input-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}

          <button className="btn btn-ghost btn-sm" onClick={() => navigateDate(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat bg-base-100 rounded-box shadow">
              <div className="stat-figure text-primary">
                <DollarSign size={32} />
              </div>
              <div className="stat-title">Total Sales</div>
              <div className="stat-value text-primary">
                {formatCurrency(parseFloat(summary?.total_sales?.toString() || '0'))}
              </div>
            </div>

            <div className="stat bg-base-100 rounded-box shadow">
              <div className="stat-figure text-secondary">
                <ShoppingBag size={32} />
              </div>
              <div className="stat-title">Total Orders</div>
              <div className="stat-value text-secondary">{summary?.total_orders || 0}</div>
            </div>

            <div className="stat bg-base-100 rounded-box shadow">
              <div className="stat-figure text-accent">
                <TrendingUp size={32} />
              </div>
              <div className="stat-title">Average Order</div>
              <div className="stat-value text-accent">
                {formatCurrency(parseFloat(summary?.average_order?.toString() || '0'))}
              </div>
            </div>

            {view === 'monthly' && monthlyData && (
              <div className="stat bg-base-100 rounded-box shadow">
                <div className="stat-figure text-info">
                  <Calendar size={32} />
                </div>
                <div className="stat-title">vs Last Month</div>
                <div
                  className={`stat-value ${
                    parseFloat(monthlyData.comparison.current_month.toString()) >=
                    parseFloat(monthlyData.comparison.previous_month.toString())
                      ? 'text-success'
                      : 'text-error'
                  }`}
                >
                  {(
                    ((parseFloat(monthlyData.comparison.current_month.toString()) -
                      parseFloat(monthlyData.comparison.previous_month.toString())) /
                      (parseFloat(monthlyData.comparison.previous_month.toString()) || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">
                  {view === 'daily' ? 'Hourly Sales' : 'Daily Sales'}
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {view === 'daily' && dailyData ? (
                      <BarChart data={dailyData.hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                          labelFormatter={(h) => `${h}:00 - ${h}:59`}
                        />
                        <Bar dataKey="sales" fill="#8884d8" />
                      </BarChart>
                    ) : (
                      <LineChart
                        data={
                          view === 'weekly'
                            ? weeklyData?.dailyData
                            : monthlyData?.dailyData
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) => formatDate(d).slice(0, 5)}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Line type="monotone" dataKey="sales" stroke="#8884d8" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">Top Selling Items</h2>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(view === 'daily'
                        ? dailyData?.topItems
                        : view === 'weekly'
                        ? weeklyData?.topItems
                        : monthlyData?.topItems
                      )?.map((item, index) => (
                        <tr key={item.item_name}>
                          <td>{index + 1}</td>
                          <td>{item.item_name}</td>
                          <td className="text-right">{item.total_quantity}</td>
                          <td className="text-right">
                            {formatCurrency(parseFloat(item.total_sales.toString()))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {view === 'daily' && dailyData && (
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h2 className="card-title">Payment Methods</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dailyData.paymentMethods}
                          dataKey="total"
                          nameKey="payment_method"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                        >
                          {dailyData.paymentMethods.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {view === 'monthly' && monthlyData && (
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h2 className="card-title">Category Performance</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={monthlyData.categoryData}
                          dataKey="total_sales"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name }) => name}
                        >
                          {monthlyData.categoryData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
