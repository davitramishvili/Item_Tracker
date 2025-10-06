import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Item, CreateItemData, UpdateItemData } from '../types/item';
import { itemService } from '../services/itemService';
import { historyService } from '../services/historyService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<CreateItemData>({
    name: '',
    description: '',
    quantity: 1,
    price_per_unit: 0,
    currency: 'USD',
    category: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await itemService.getAll();
      setItems(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newItem = await itemService.create(formData);
      setItems([newItem, ...items]);
      setShowAddModal(false);
      setFormData({
        name: '',
        description: '',
        quantity: 1,
        price_per_unit: 0,
        currency: 'USD',
        category: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm(t('item.deleteConfirm'))) return;

    try {
      await itemService.delete(id);
      setItems(items.filter(item => item.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToDeleteItem'));
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      price_per_unit: item.price_per_unit || 0,
      currency: item.currency || 'USD',
      category: item.category || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSubmitting(true);
    try {
      const updateData: UpdateItemData = {
        name: formData.name,
        description: formData.description,
        quantity: formData.quantity,
        price_per_unit: formData.price_per_unit,
        currency: formData.currency,
        category: formData.category,
      };
      const updatedItem = await itemService.update(editingItem.id, updateData);
      setItems(items.map(item => item.id === editingItem.id ? updatedItem : item));
      setShowEditModal(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        quantity: 1,
        price_per_unit: 0,
        currency: 'USD',
        category: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickQuantityChange = async (item: Item, change: number) => {
    const newQuantity = Math.max(0, item.quantity + change);
    try {
      const updatedItem = await itemService.update(item.id, { quantity: newQuantity });
      setItems(items.map(i => i.id === item.id ? updatedItem : i));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update quantity');
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      setSnapshotMessage(t('dashboard.snapshotCreating'));
      const result = await historyService.createManualSnapshot();

      if (result.updated) {
        setSnapshotMessage(t('dashboard.snapshotUpdated', { count: result.count }));
      } else {
        setSnapshotMessage(t('dashboard.snapshotCreated', { count: result.count }));
      }

      setTimeout(() => setSnapshotMessage(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToCreateSnapshot'));
      setSnapshotMessage('');
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('nav.itemTracker')}</h1>
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('dashboard.myItems')}</h2>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/history')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                title={t('dashboard.history')}
              >
                📊 {t('dashboard.history')}
              </button>
              <button
                onClick={handleCreateSnapshot}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                title={t('dashboard.snapshot')}
              >
                📸 {t('dashboard.snapshot')}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + {t('dashboard.addItem')}
              </button>
            </div>
          </div>

          {/* Snapshot Success Message */}
          {snapshotMessage && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300">
              {snapshotMessage}
            </div>
          )}

          {/* Grand Total Section */}
          {!loading && items.length > 0 && (() => {
            const totalsByCurrency = items.reduce((acc, item) => {
              const total = item.quantity * (item.price_per_unit || 0);
              const currency = item.currency || 'USD';
              acc[currency] = (acc[currency] || 0) + total;
              return acc;
            }, {} as Record<string, number>);

            return (
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-3">{t('dashboard.grandTotal')}</h3>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(totalsByCurrency).map(([currency, total]) => (
                    <div key={currency} className="bg-white/20 dark:bg-white/10 rounded-lg px-6 py-3">
                      <div className="text-sm opacity-90">{currency}</div>
                      <div className="text-2xl font-bold">{total.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-gray-600 dark:text-gray-400">{t('dashboard.loadingItems')}</div>
            </div>
          )}

          {/* Items Grid */}
          {!loading && items.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('dashboard.noItems')}</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const itemTotal = item.quantity * (item.price_per_unit || 0);
                return (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{item.name}</h3>
                        {item.category && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xl"
                          title={t('item.edit')}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xl"
                          title={t('item.delete')}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{item.description}</p>
                    )}

                    <div className="space-y-3">
                      {/* Quantity with Quick Adjust */}
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{t('item.quantity')}:</span>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleQuickQuantityChange(item, -1)}
                            disabled={item.quantity === 0}
                            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            title={t('item.decrease')}
                          >
                            −
                          </button>
                          <span className="font-bold text-lg min-w-[40px] text-center dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => handleQuickQuantityChange(item, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                            title={t('item.increase')}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Price Per Unit */}
                      {item.price_per_unit !== undefined && item.price_per_unit !== null && item.price_per_unit > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{t('item.pricePerUnit')}:</span>
                          <span className="font-medium dark:text-gray-200">{Number(item.price_per_unit).toFixed(2)} {item.currency}</span>
                        </div>
                      )}

                      {/* Total Price */}
                      {item.price_per_unit !== undefined && item.price_per_unit !== null && item.price_per_unit > 0 && (
                        <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('item.total')}:</span>
                          <span className="font-bold text-lg text-green-600 dark:text-green-400">
                            {Number(itemTotal).toFixed(2)} {item.currency}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Add New Item</h3>

            <form onSubmit={handleAddItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value ? parseInt(e.target.value) : 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price Per Unit
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_per_unit || ''}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value ? parseFloat(e.target.value) : 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'GEL' | 'USD' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="GEL">GEL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Edit Item</h3>

            <form onSubmit={handleUpdateItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value ? parseInt(e.target.value) : 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price Per Unit
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_per_unit || ''}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value ? parseFloat(e.target.value) : 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'GEL' | 'USD' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="GEL">GEL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
