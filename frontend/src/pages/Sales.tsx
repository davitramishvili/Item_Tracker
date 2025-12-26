import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { saleService, type Sale, type SaleGroup, type SaleStatistics } from '../services/saleService';

type DatePreset = 'all' | 'thisMonth' | 'lastMonth' | 'custom';

// Helper function to format date in local timezone (YYYY-MM-DD)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Sales = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sales, setSales] = useState<SaleGroup[]>([]);
  const [statistics, setStatistics] = useState<SaleStatistics | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit sale modal state
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editSaleFormData, setEditSaleFormData] = useState({
    quantity_sold: 1,
    sale_price: 0,
    buyer_name: '',
    buyer_phone: '',
    notes: '',
    sale_date: new Date().toISOString().split('T')[0]
  });

  // Return sale modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningSale, setReturningSale] = useState<Sale | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Calculate dates based on preset
  const calculateDates = (preset: DatePreset): { start: string; end: string } => {
    const today = new Date();
    const end = formatLocalDate(today);
    let start = '';

    switch (preset) {
      case 'all':
        // Use a very wide date range to get all sales
        start = '2000-01-01';
        return { start, end: '2099-12-31' };
      case 'thisMonth':
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        start = formatLocalDate(firstDayThisMonth);
        break;
      case 'lastMonth':
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        start = formatLocalDate(firstDayLastMonth);
        return { start, end: formatLocalDate(lastDayLastMonth) };
      case 'custom':
        // Keep current start/end dates
        return { start: startDate, end: endDate };
    }

    return { start, end };
  };

  // Load sales based on preset
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const dates = calculateDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
      loadSalesByDateRange(dates.start, dates.end);
    }
  };

  // Load data on mount
  useEffect(() => {
    handlePresetChange('all');
  }, []);

  // Filter sales by product name search
  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return sales;
    const query = searchQuery.toLowerCase();
    return sales.filter(group =>
      group.items.some(item => item.item_name.toLowerCase().includes(query))
    ).map(group => ({
      ...group,
      items: group.items.filter(item => item.item_name.toLowerCase().includes(query))
    }));
  }, [sales, searchQuery]);

  const loadSalesByDateRange = async (start: string, end: string) => {
    try {
      setLoading(true);
      setError('');

      if (!start || !end) {
        setError(t('sales.invalidDateRange'));
        return;
      }

      if (new Date(start) > new Date(end)) {
        setError(t('sales.invalidDateRange'));
        return;
      }

      const data = await saleService.getByDateRange(start, end);
      setSales(data.sales);
      setStatistics(data.statistics);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load sales');
      setSales([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      loadSalesByDateRange(startDate, endDate);
    }
  };

  // Sale operations
  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    let formattedDate: string;
    if (sale.sale_date) {
      if (sale.sale_date.includes('T') || sale.sale_date.includes('Z')) {
        const dateObj = new Date(sale.sale_date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else {
        formattedDate = sale.sale_date;
      }
    } else {
      formattedDate = new Date().toISOString().split('T')[0];
    }

    setEditSaleFormData({
      quantity_sold: sale.quantity_sold,
      sale_price: Number(sale.sale_price),
      buyer_name: sale.buyer_name || '',
      buyer_phone: sale.buyer_phone || '',
      notes: sale.notes || '',
      sale_date: formattedDate
    });
    setShowEditSaleModal(true);
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    setSubmitting(true);
    try {
      await saleService.update(editingSale.id, {
        ...editSaleFormData,
        sale_price: Number(editSaleFormData.sale_price),
        quantity_sold: Number(editSaleFormData.quantity_sold)
      });

      // Recalculate dates based on current preset to ensure we reload properly
      const dates = calculateDates(datePreset);
      await loadSalesByDateRange(dates.start, dates.end);
      setShowEditSaleModal(false);
      setEditingSale(null);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToUpdateItem'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReturnModal = (sale: Sale) => {
    setReturningSale(sale);
    setShowReturnModal(true);
  };

  const handleReturnSale = async (addToStock: boolean) => {
    if (!returningSale) return;

    setSubmitting(true);
    try {
      await saleService.returnSale(returningSale.id, addToStock);
      const dates = calculateDates(datePreset);
      await loadSalesByDateRange(dates.start, dates.end);
      setShowReturnModal(false);
      setReturningSale(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to return sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (!confirm(t('sales.deleteConfirm'))) return;

    try {
      await saleService.delete(id);
      const dates = calculateDates(datePreset);
      await loadSalesByDateRange(dates.start, dates.end);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete sale');
    }
  };

  const toggleGroupExpanded = (groupId: number) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const getGroupGrandTotalByCurrency = (group: SaleGroup): Record<string, number> => {
    if (!group.items || group.items.length === 0) return {};

    const currencyTotals: Record<string, number> = {};
    group.items.forEach(item => {
      const currency = item.currency || 'USD';
      const amount = parseFloat(item.total_amount.toString());
      currencyTotals[currency] = (currencyTotals[currency] || 0) + amount;
    });

    return currencyTotals;
  };

  const getActiveItemsCount = (group: SaleGroup) => {
    if (!group.items || group.items.length === 0) return 0;
    return group.items.filter(item => item.status === 'active').length;
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
                {t('nav.dashboard')}
              </button>
              <button
                onClick={() => navigate('/history')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {t('nav.history')}
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {t('nav.profile')}
              </button>
            </div>
            <div className="flex items-center space-x-4">
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
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">💰 {t('sales.title')}</h2>

            {/* Date Range Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handlePresetChange('all')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  datePreset === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('sales.presets.all')}
              </button>
              <button
                onClick={() => handlePresetChange('thisMonth')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  datePreset === 'thisMonth'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('sales.presets.thisMonth')}
              </button>
              <button
                onClick={() => handlePresetChange('lastMonth')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  datePreset === 'lastMonth'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('sales.presets.lastMonth')}
              </button>
              <button
                onClick={() => handlePresetChange('custom')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  datePreset === 'custom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('sales.presets.custom')}
              </button>
            </div>

            {/* Product Name Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder={t('sales.searchByProduct')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Custom Date Range Selector */}
            {datePreset === 'custom' && (
              <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 dark:text-gray-300 font-medium">{t('sales.startDate')}:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 dark:text-gray-300 font-medium">{t('sales.endDate')}:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleCustomDateChange}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  🔍 {t('sales.apply')}
                </button>
              </div>
            )}

            {/* Date Range Display */}
            {datePreset !== 'all' && (
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {t('sales.dateRange')}: <span className="font-semibold">{startDate}</span> → <span className="font-semibold">{endDate}</span>
              </div>
            )}
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
              <div className="text-gray-600 dark:text-gray-400">{t('sales.loadingSales')}</div>
            </div>
          )}

          {/* Statistics Dashboard */}
          {!loading && statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Total Items Sold */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-lg shadow-lg p-6">
                <h3 className="text-sm font-semibold mb-2 opacity-90">{t('sales.statistics.totalItemsSold')}</h3>
                <div className="text-3xl font-bold">{statistics.totalItemsSold}</div>
              </div>

              {/* Total Revenue */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 text-white rounded-lg shadow-lg p-6">
                <h3 className="text-sm font-semibold mb-2 opacity-90">{t('sales.statistics.totalRevenue')}</h3>
                {statistics.byCurrency.map(stat => (
                  <div key={stat.currency} className="text-2xl font-bold">
                    {stat.revenue.toFixed(2)} {stat.currency}
                  </div>
                ))}
              </div>

              {/* Total Cost (Always USD) */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-700 dark:to-orange-800 text-white rounded-lg shadow-lg p-6">
                <h3 className="text-sm font-semibold mb-2 opacity-90">{t('sales.statistics.totalCost')}</h3>
                <div className="text-2xl font-bold">
                  {statistics.byCurrency.reduce((sum, stat) => sum + stat.cost, 0).toFixed(2)} USD
                </div>
              </div>

              {/* Exchange Rate Input */}
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 text-white rounded-lg shadow-lg p-6">
                <h3 className="text-sm font-semibold mb-2 opacity-90">Exchange Rate</h3>
                <div className="text-xs mb-1 opacity-75">1 USD =</div>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="Enter rate"
                  className="w-full px-3 py-2 bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <div className="text-xs mt-1 opacity-75">
                  {statistics.byCurrency[0]?.currency || 'GEL'}
                </div>
              </div>

              {/* Total Profit */}
              <div className={`bg-gradient-to-r ${(() => {
                if (!exchangeRate) return 'from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700';
                const rate = parseFloat(exchangeRate);
                const totalCostUSD = statistics.byCurrency.reduce((sum, stat) => sum + stat.cost, 0);
                const totalRevenue = statistics.byCurrency[0]?.revenue || 0;
                const revCurrency = statistics.byCurrency[0]?.currency || 'USD';
                const profit = revCurrency === 'USD' ? totalRevenue - totalCostUSD : totalRevenue - (rate * totalCostUSD);
                return profit >= 0 ? 'from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800' : 'from-red-600 to-red-700 dark:from-red-700 dark:to-red-800';
              })()} text-white rounded-lg shadow-lg p-6`}>
                <h3 className="text-sm font-semibold mb-2 opacity-90">{t('sales.statistics.totalProfit')}</h3>
                {!exchangeRate ? (
                  <div className="text-sm opacity-75 italic">Enter exchange rate</div>
                ) : (() => {
                  const rate = parseFloat(exchangeRate);
                  const totalCostUSD = statistics.byCurrency.reduce((sum, stat) => sum + stat.cost, 0);
                  const totalRevenue = statistics.byCurrency[0]?.revenue || 0;
                  const revCurrency = statistics.byCurrency[0]?.currency || 'USD';
                  const profit = revCurrency === 'USD' ? totalRevenue - totalCostUSD : totalRevenue - (rate * totalCostUSD);
                  return (
                    <div className="text-2xl font-bold">
                      {profit >= 0 ? '+' : ''}{profit.toFixed(2)} {revCurrency}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* No Sales */}
          {!loading && sales.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('sales.noSalesInRange')}</p>
            </div>
          )}

          {/* No Sales Matching Search */}
          {!loading && sales.length > 0 && filteredSales.length === 0 && searchQuery && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('sales.noSalesMatchingSearch')}</p>
            </div>
          )}

          {/* Sales List */}
          {!loading && filteredSales.length > 0 && (
            <div className="space-y-4">
              {filteredSales.filter(group => group.items && group.items.length > 0).map((group) => {
                const isExpanded = expandedGroups.has(group.group_id);
                const currencyTotals = getGroupGrandTotalByCurrency(group);
                const activeCount = getActiveItemsCount(group);
                const isMultiItem = group.items.length > 1;

                return (
                  <div key={group.group_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    {/* Group Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {isMultiItem && (
                            <button
                              onClick={() => toggleGroupExpanded(group.group_id)}
                              className="text-2xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          )}
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {isMultiItem ? `💼 ${t('sales.saleWithItems', { count: group.items.length })}` : group.items[0].item_name}
                          </h3>
                        </div>
                        {activeCount < group.items.length && (
                          <span className="inline-block px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full">
                            {t('sales.activeReturned', { active: activeCount, returned: group.items.length - activeCount })}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="space-y-1">
                          {Object.entries(currencyTotals).map(([currency, total]) => (
                            <div key={currency} className="text-3xl font-bold text-green-600 dark:text-green-400">
                              {total.toFixed(2)} {currency}
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 font-semibold">
                          📅 {new Date(group.sale_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(group.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Group buyer info */}
                    {(group.buyer_name || group.buyer_phone || group.notes) && (
                      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        {group.buyer_name && (
                          <div>
                            <span className="text-base text-gray-600 dark:text-gray-400">{t('sales.buyerName')}:</span>
                            <div className="text-lg font-semibold dark:text-white">{group.buyer_name}</div>
                          </div>
                        )}
                        {group.buyer_phone && (
                          <div>
                            <span className="text-base text-gray-600 dark:text-gray-400">{t('sales.buyerPhone')}:</span>
                            <div className="text-lg font-semibold dark:text-white">{group.buyer_phone}</div>
                          </div>
                        )}
                        {group.notes && (
                          <div className="col-span-2">
                            <span className="text-base text-gray-600 dark:text-gray-400">{t('sales.notes')}:</span>
                            <div className="text-base dark:text-white mt-1">{group.notes}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-3">
                      {group.items.map((sale, idx) => {
                        if (!isMultiItem || isExpanded || idx === 0) {
                          return (
                            <div key={sale.id} className={`border-l-4 pl-4 ${sale.status === 'active' ? 'border-green-500' : 'border-gray-400'} ${isMultiItem && idx > 0 ? 'pt-4 mt-4 border-t border-gray-200 dark:border-gray-700' : ''}`}>
                              {isMultiItem && (
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">{sale.item_name}</h4>
                                  <span className={`px-2 py-1 text-xs rounded-full ${sale.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                                    {sale.status === 'active' ? t('sales.active') : t('sales.returned')}
                                  </span>
                                </div>
                              )}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('item.quantity')}:</span>
                                  <div className="font-semibold dark:text-white">{sale.quantity_sold}</div>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('sales.unitPrice')}:</span>
                                  <div className="font-semibold dark:text-white">{Number(sale.sale_price).toFixed(2)} {sale.currency}</div>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('item.total')}:</span>
                                  <div className="font-bold text-green-600 dark:text-green-400">{Number(sale.total_amount).toFixed(2)} {sale.currency}</div>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('sales.date')}:</span>
                                  <div className="font-semibold dark:text-white">
                                    {new Date(sale.sale_date || group.sale_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              {/* Sale Actions */}
                              {sale.status === 'active' && (
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleEditSale(sale)}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                  >
                                    ✏️ {t('profile.edit')}
                                  </button>
                                  <button
                                    onClick={() => handleOpenReturnModal(sale)}
                                    className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700"
                                  >
                                    ↩️ {t('sales.return')}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSale(sale.id)}
                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                                  >
                                    🗑️ {t('profile.delete')}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        } else if (isMultiItem && idx === 0 && !isExpanded) {
                          return (
                            <div key={sale.id} className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                              {t('sales.clickToExpand')}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Sale Modal */}
      {showEditSaleModal && editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('sales.editSale')}</h3>
              <form onSubmit={handleUpdateSale}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('item.quantity')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editSaleFormData.quantity_sold}
                      onChange={(e) => setEditSaleFormData({ ...editSaleFormData, quantity_sold: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('sales.salePrice')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editSaleFormData.sale_price}
                      onChange={(e) => setEditSaleFormData({ ...editSaleFormData, sale_price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('sales.buyerName')}
                    </label>
                    <input
                      type="text"
                      value={editSaleFormData.buyer_name}
                      onChange={(e) => setEditSaleFormData({ ...editSaleFormData, buyer_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('sales.buyerPhone')}
                    </label>
                    <input
                      type="text"
                      value={editSaleFormData.buyer_phone}
                      onChange={(e) => setEditSaleFormData({ ...editSaleFormData, buyer_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('sales.notes')}
                    </label>
                    <textarea
                      value={editSaleFormData.notes}
                      onChange={(e) => setEditSaleFormData({ ...editSaleFormData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('sales.date')}
                    </label>
                    <input
                      type="date"
                      value={editSaleFormData.sale_date}
                      onChange={(e) => setEditSaleFormData({ ...editSaleFormData, sale_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {submitting ? t('form.saving') : t('profile.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSaleModal(false);
                      setEditingSale(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    {t('profile.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Return Sale Modal */}
      {showReturnModal && returningSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('sales.returnSale')}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('sales.returnQuestion', { item: returningSale.item_name })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleReturnSale(true)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {t('sales.addToStock')}
              </button>
              <button
                onClick={() => handleReturnSale(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
              >
                {t('sales.discard')}
              </button>
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturningSale(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                {t('profile.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
