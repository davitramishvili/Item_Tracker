import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { historyService } from '../services/historyService';
import type { ItemSnapshot } from '../types/history';

const STATUS_OPTIONS = [
  { value: 'in_stock', labelKey: 'status.inStock' },
  { value: 'on_the_way', labelKey: 'status.onTheWay' },
  { value: 'need_to_order', labelKey: 'status.needToOrder' },
];

const History = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [snapshots, setSnapshots] = useState<ItemSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Load today's snapshots on mount
  useEffect(() => {
    loadTodaySnapshots();
  }, []);

  const loadTodaySnapshots = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      const data = await historyService.getSnapshotsByDate(today);
      setSnapshots(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToLoadSnapshots'));
    } finally {
      setLoading(false);
    }
  };

  const loadSnapshotsByDate = async (date: string) => {
    try {
      setLoading(true);
      const data = await historyService.getSnapshotsByDate(date);
      setSnapshots(data);
      setSelectedDate(date);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToLoadSnapshots'));
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Group snapshots by category and currency for total calculation
  const categoryTotals = snapshots.reduce((acc, snapshot) => {
    const category = snapshot.category || 'in_stock';
    const total = snapshot.quantity * (snapshot.price_per_unit || 0);
    const currency = snapshot.currency || 'USD';

    if (!acc[category]) {
      acc[category] = {};
    }
    acc[category][currency] = (acc[category][currency] || 0) + total;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const getCategoryColor = (category: string) => {
    if (category === 'in_stock') return 'from-green-600 to-green-700 dark:from-green-700 dark:to-green-800';
    if (category === 'on_the_way') return 'from-yellow-600 to-yellow-700 dark:from-yellow-700 dark:to-yellow-800';
    return 'from-red-600 to-red-700 dark:from-red-700 dark:to-red-800';
  };

  const getCategoryLabel = (category: string) => {
    if (category === 'in_stock') return t('status.inStock');
    if (category === 'on_the_way') return t('status.onTheWay');
    return t('status.needToOrder');
  };

  const getCategoryPrefix = (category: string) => {
    return category === 'need_to_order' ? '-' : '';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('nav.itemTracker')}</h1>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                ← {t('nav.dashboard')}
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="ka">ქართული</option>
              </select>

              <button
                onClick={toggleDarkMode}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                title={isDarkMode ? t('nav.lightMode') : t('nav.darkMode')}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    isDarkMode ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-gray-700 dark:text-gray-300">{t('nav.welcome', { name: user?.full_name })}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('history.snapshotHistory')}</h2>

            {/* Date Selector */}
            <div className="flex items-center gap-4">
              <label className="text-gray-700 dark:text-gray-300 font-medium">{t('history.selectDate')}:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => loadSnapshotsByDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-gray-600 dark:text-gray-400">{t('history.loadingSnapshots')}</div>
            </div>
          )}

          {/* Category Totals Section */}
          {!loading && snapshots.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {STATUS_OPTIONS.map((statusOption) => {
                const totals = categoryTotals[statusOption.value];
                if (!totals) return null;

                return (
                  <div
                    key={statusOption.value}
                    className={`bg-gradient-to-r ${getCategoryColor(statusOption.value)} text-white rounded-lg shadow-lg p-6`}
                  >
                    <h3 className="text-lg font-semibold mb-3">{getCategoryLabel(statusOption.value)}</h3>
                    <div className="space-y-2">
                      {Object.entries(totals).map(([currency, total]) => (
                        <div key={currency} className="bg-white/20 dark:bg-white/10 rounded-lg px-4 py-2">
                          <div className="text-sm opacity-90">{currency}</div>
                          <div className="text-2xl font-bold">
                            {getCategoryPrefix(statusOption.value)}{total.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Snapshots */}
          {!loading && snapshots.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('history.noSnapshots', { date: selectedDate })}</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">{t('history.tryDifferentDate')}</p>
            </div>
          )}

          {/* Snapshots Grid */}
          {!loading && snapshots.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {snapshots.map((snapshot) => {
                const itemTotal = snapshot.quantity * (snapshot.price_per_unit || 0);
                return (
                  <div key={snapshot.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{snapshot.name}</h3>
                        {snapshot.category && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                            {snapshot.category}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        snapshot.snapshot_type === 'manual'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        {t(`history.${snapshot.snapshot_type}`)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Quantity */}
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{t('item.quantity')}:</span>
                        <span className="font-bold text-lg dark:text-white">{snapshot.quantity}</span>
                      </div>

                      {/* Price Per Unit */}
                      {snapshot.price_per_unit !== undefined && snapshot.price_per_unit !== null && snapshot.price_per_unit > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{t('item.pricePerUnit')}:</span>
                          <span className="font-medium dark:text-gray-200">{Number(snapshot.price_per_unit).toFixed(2)} {snapshot.currency}</span>
                        </div>
                      )}

                      {/* Total Price */}
                      {snapshot.price_per_unit !== undefined && snapshot.price_per_unit !== null && snapshot.price_per_unit > 0 && (
                        <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('item.total')}:</span>
                          <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                            {Number(itemTotal).toFixed(2)} {snapshot.currency}
                          </span>
                        </div>
                      )}

                      {/* Snapshot Time */}
                      <div className="text-xs text-gray-500 dark:text-gray-500 text-center pt-2">
                        {t('history.capturedAt', { time: new Date(snapshot.created_at).toLocaleString() })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
