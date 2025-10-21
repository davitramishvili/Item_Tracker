import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Item, CreateItemData, UpdateItemData } from '../types/item';
import { itemService } from '../services/itemService';
import { historyService } from '../services/historyService';
import { itemNameService } from '../services/itemNameService';
import { saleService } from '../services/saleService';

const STATUS_OPTIONS = [
  { value: 'in_stock', labelKey: 'status.inStock' },
  { value: 'on_the_way', labelKey: 'status.onTheWay' },
  { value: 'need_to_order', labelKey: 'status.needToOrder' },
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [itemNames, setItemNames] = useState<string[]>([]);
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
    purchase_price: 0,
    purchase_currency: 'USD',
    category: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Sell modal state
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellingItem, setSellingItem] = useState<Item | null>(null);
  const [isMultiItemSale, setIsMultiItemSale] = useState(false);
  const [sellFormData, setSellFormData] = useState({
    quantity_sold: 1,
    sale_price: 0,
    buyer_name: '',
    buyer_phone: '',
    notes: '',
    sale_date: new Date().toISOString().split('T')[0]
  });
  const [additionalItems, setAdditionalItems] = useState<Array<{
    item_id: number | null;
    quantity_sold: number;
    sale_price: number;
    notes: string;
  }>>([]);

  // Filter state
  const [filters, setFilters] = useState({
    searchName: '',
    status: '',
    minPrice: '',
    maxPrice: '',
  });

  // Move quantity modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingItem, setMovingItem] = useState<Item | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [moveQuantity, setMoveQuantity] = useState(1);

  // Duplicate confirmation modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateItem, setDuplicateItem] = useState<Item | null>(null);
  const [pendingItemData, setPendingItemData] = useState<CreateItemData | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Load items and item names on mount
  useEffect(() => {
    loadItems();
    loadItemNames();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await itemService.getAll();
      // Sort alphabetically by name (supports both Georgian and English)
      const sortedData = data.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      setItems(sortedData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const loadItemNames = async () => {
    try {
      const data = await itemNameService.getAll();
      setItemNames(data.map(item => item.name).sort());
    } catch (err: any) {
      console.error('Failed to load item names:', err);
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
        purchase_price: 0,
        purchase_currency: 'USD',
        category: '',
      });
      await loadItems(); // Refresh items list
    } catch (err: any) {
      // Check if it's a duplicate item error (status 409)
      if (err.response?.status === 409 && err.response?.data?.duplicate) {
        setDuplicateItem(err.response.data.duplicate);
        setPendingItemData(formData);
        setShowDuplicateModal(true);
        setShowAddModal(false);
      } else {
        setError(err.response?.data?.error || 'Failed to add item');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMergeDuplicate = async () => {
    if (!duplicateItem || !pendingItemData) return;

    setSubmitting(true);
    try {
      // Update the existing item's quantity
      const newQuantity = duplicateItem.quantity + (pendingItemData.quantity || 1);
      await itemService.update(duplicateItem.id, { quantity: newQuantity });

      await loadItems(); // Refresh items list
      setShowDuplicateModal(false);
      setDuplicateItem(null);
      setPendingItemData(null);
      setFormData({
        name: '',
        description: '',
        quantity: 1,
        price_per_unit: 0,
        currency: 'USD',
        purchase_price: 0,
        purchase_currency: 'USD',
        category: '',
      });
      setSnapshotMessage(t('item.merged'));
      setTimeout(() => setSnapshotMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to merge items');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSeparate = async () => {
    if (!pendingItemData) return;

    setSubmitting(true);
    try {
      // Create item with skipDuplicateCheck flag
      const itemDataWithSkip = { ...pendingItemData, skipDuplicateCheck: true };
      await itemService.create(itemDataWithSkip);

      await loadItems(); // Refresh items list
      setShowDuplicateModal(false);
      setDuplicateItem(null);
      setPendingItemData(null);
      setFormData({
        name: '',
        description: '',
        quantity: 1,
        price_per_unit: 0,
        currency: 'USD',
        purchase_price: 0,
        purchase_currency: 'USD',
        category: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create item');
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

  const handleOpenSellModal = (item: Item) => {
    setSellingItem(item);
    setSellFormData({
      quantity_sold: 1,
      sale_price: item.price_per_unit || 0,
      buyer_name: '',
      buyer_phone: '',
      notes: '',
      sale_date: new Date().toISOString().split('T')[0]
    });
    setShowSellModal(true);
  };

  const handleSellItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingItem) return;

    // Validate that all additional items have an item selected
    if (isMultiItemSale && additionalItems.length > 0) {
      const hasInvalidItems = additionalItems.some(item => item.item_id === null);
      if (hasInvalidItems) {
        setError('Please select an item for all additional items in the multi-item sale');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Track item IDs and quantities sold before making the sale
      const soldItemsMap = new Map<number, number>();

      if (isMultiItemSale && additionalItems.length > 0) {
        // Create multi-item sale - filter out null item_ids (should not happen due to validation above)
        const validAdditionalItems = additionalItems.filter(item => item.item_id !== null) as Array<{
          item_id: number;
          quantity_sold: number;
          sale_price: number;
          notes: string;
        }>;

        const allItems = [
          {
            item_id: sellingItem.id,
            quantity_sold: sellFormData.quantity_sold,
            sale_price: sellFormData.sale_price,
            notes: sellFormData.notes || ''
          },
          ...validAdditionalItems
        ];

        // Track all items being sold
        soldItemsMap.set(sellingItem.id, sellFormData.quantity_sold);
        validAdditionalItems.forEach(addItem => {
          soldItemsMap.set(addItem.item_id, addItem.quantity_sold);
        });

        await saleService.createMultiItem({
          buyer_name: sellFormData.buyer_name,
          buyer_phone: sellFormData.buyer_phone,
          notes: '', // Group notes separate from item notes
          sale_date: sellFormData.sale_date,
          items: allItems
        });
      } else {
        // Single item sale
        soldItemsMap.set(sellingItem.id, sellFormData.quantity_sold);

        await saleService.create({
          item_id: sellingItem.id,
          ...sellFormData
        });
      }

      await loadItems(); // Refresh to show updated quantities

      // Auto-delete items that reached 0 stock (after sale is committed)
      // Wait a moment to ensure sale is fully saved in backend
      setTimeout(async () => {
        const itemsToDelete: number[] = [];
        soldItemsMap.forEach((quantitySold, itemId) => {
          const currentItem = items.find(i => i.id === itemId);
          if (currentItem && currentItem.quantity - quantitySold === 0) {
            itemsToDelete.push(itemId);
          }
        });

        if (itemsToDelete.length > 0) {
          for (const itemId of itemsToDelete) {
            try {
              await itemService.delete(itemId);
            } catch (err: any) {
              console.error(`Failed to delete item ${itemId}:`, err);
              // Ignore deletion errors - item will remain with 0 stock
            }
          }
          await loadItems(); // Refresh after deletions
        }
      }, 500); // Wait 500ms for sale to be fully committed

      setShowSellModal(false);
      setIsMultiItemSale(false);
      setAdditionalItems([]);
      setSnapshotMessage(t('sales.saleCreated'));
      setTimeout(() => setSnapshotMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToAddItem'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAdditionalItem = () => {
    // Add a blank item - user will choose which item to sell
    setAdditionalItems([...additionalItems, {
      item_id: null,
      quantity_sold: 1,
      sale_price: 0,
      notes: ''
    }]);
  };

  const handleRemoveAdditionalItem = (index: number) => {
    setAdditionalItems(additionalItems.filter((_, i) => i !== index));
  };

  const handleUpdateAdditionalItem = (index: number, field: string, value: any) => {
    const updated = [...additionalItems];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalItems(updated);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      price_per_unit: item.price_per_unit || 0,
      currency: item.currency || 'USD',
      purchase_price: item.purchase_price || 0,
      purchase_currency: item.purchase_currency || item.currency || 'USD',
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
        purchase_price: formData.purchase_price,
        purchase_currency: formData.purchase_currency,
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
        purchase_price: 0,
        purchase_currency: 'USD',
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

    // If quantity reaches 0, show confirmation dialog
    if (newQuantity === 0) {
      if (!confirm(t('item.deleteZeroStockConfirm'))) {
        return;
      }
      // Delete the item
      try {
        await itemService.delete(item.id);
        setItems(items.filter(i => i.id !== item.id));
        setSnapshotMessage(t('item.deletedZeroStock'));
        setTimeout(() => setSnapshotMessage(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.error || t('errors.failedToDeleteItem'));
      }
      return;
    }

    try {
      const updatedItem = await itemService.update(item.id, { quantity: newQuantity });
      setItems(items.map(i => i.id === item.id ? updatedItem : i));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update quantity');
    }
  };

  const handleOpenMoveModal = (item: Item, targetStatus: string) => {
    setMovingItem(item);
    setTargetStatus(targetStatus);
    setMoveQuantity(item.quantity); // Default to moving all
    setShowMoveModal(true);
  };

  const handleConfirmMove = async () => {
    if (!movingItem || !targetStatus) return;

    setSubmitting(true);
    try {
      // Check if an item with the same name exists in the target status
      const existingItem = items.find(
        i => i.name === movingItem.name && i.category === targetStatus && i.id !== movingItem.id
      );

      if (moveQuantity === movingItem.quantity) {
        // Moving all items - same as before
        if (existingItem) {
          // Merge: Add quantity to existing item and delete current item
          const newQuantity = existingItem.quantity + moveQuantity;
          await itemService.update(existingItem.id, { quantity: newQuantity });
          await itemService.delete(movingItem.id);

          setItems(items.filter(i => i.id !== movingItem.id).map(i =>
            i.id === existingItem.id ? { ...i, quantity: newQuantity } : i
          ));
          setSnapshotMessage(t('item.merged'));
        } else {
          // Move: Update category to target status
          const updatedItem = await itemService.update(movingItem.id, { category: targetStatus });
          setItems(items.map(i => i.id === movingItem.id ? updatedItem : i));
          setSnapshotMessage(t('item.moved'));
        }
      } else {
        // Moving partial quantity - need to split
        const remainingQuantity = movingItem.quantity - moveQuantity;

        if (existingItem) {
          // Merge partial quantity with existing item
          const newQuantity = existingItem.quantity + moveQuantity;
          await itemService.update(existingItem.id, { quantity: newQuantity });
          // Update the current item with remaining quantity
          const updatedItem = await itemService.update(movingItem.id, { quantity: remainingQuantity });

          setItems(items.map(i => {
            if (i.id === existingItem.id) return { ...i, quantity: newQuantity };
            if (i.id === movingItem.id) return updatedItem;
            return i;
          }));
          setSnapshotMessage(t('item.partialMoved'));
        } else {
          // Create a new item in the target status with the moved quantity
          const newItem = await itemService.create({
            name: movingItem.name,
            description: movingItem.description,
            quantity: moveQuantity,
            price_per_unit: movingItem.price_per_unit,
            currency: movingItem.currency,
            category: targetStatus,
          });

          // Update the current item with remaining quantity
          const updatedItem = await itemService.update(movingItem.id, { quantity: remainingQuantity });

          setItems([...items.map(i => i.id === movingItem.id ? updatedItem : i), newItem]);
          setSnapshotMessage(t('item.partialMoved'));
        }
      }

      setTimeout(() => setSnapshotMessage(''), 3000);
      setShowMoveModal(false);
      setMovingItem(null);
      setTargetStatus('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to move item');
    } finally {
      setSubmitting(false);
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

  // Filter items based on search, status, and price
  const filteredItems = items.filter((item) => {
    // Name filter
    if (filters.searchName && !item.name.toLowerCase().includes(filters.searchName.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filters.status && item.category !== filters.status) {
      return false;
    }

    // Price filter
    const itemPrice = item.price_per_unit || 0;
    if (filters.minPrice && itemPrice < parseFloat(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && itemPrice > parseFloat(filters.maxPrice)) {
      return false;
    }

    return true;
  });

  const clearFilters = () => {
    setFilters({
      searchName: '',
      status: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('nav.itemTracker')}</h1>
              <button
                onClick={() => navigate('/history')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {t('dashboard.history')}
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {t('nav.profile')}
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('dashboard.myItems')}</h2>
            <div className="flex gap-3">
              {/* View Toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                title={viewMode === 'card' ? t('dashboard.tableView') : t('dashboard.cardView')}
              >
                {viewMode === 'card' ? '☰' : '▦'} {viewMode === 'card' ? t('dashboard.tableView') : t('dashboard.cardView')}
              </button>
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

          {/* Category Totals Section */}
          {!loading && filteredItems.length > 0 && (() => {
            // Calculate selling and purchase totals by category and currency
            const categorySellingTotals = filteredItems.reduce((acc, item) => {
              const category = item.category || 'in_stock';
              const total = item.quantity * (item.price_per_unit || 0);
              const currency = item.currency || 'USD';

              if (!acc[category]) {
                acc[category] = {};
              }
              acc[category][currency] = (acc[category][currency] || 0) + total;
              return acc;
            }, {} as Record<string, Record<string, number>>);

            const categoryPurchaseTotals = filteredItems.reduce((acc, item) => {
              const category = item.category || 'in_stock';
              const total = item.quantity * (item.purchase_price || 0);
              const currency = item.purchase_currency || 'USD';

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {STATUS_OPTIONS.map((statusOption) => {
                  const sellingTotals = categorySellingTotals[statusOption.value];
                  const purchaseTotals = categoryPurchaseTotals[statusOption.value];
                  if (!sellingTotals && !purchaseTotals) return null;

                  return (
                    <div
                      key={statusOption.value}
                      className={`bg-gradient-to-r ${getCategoryColor(statusOption.value)} text-white rounded-lg shadow-lg p-6`}
                    >
                      <h3 className="text-lg font-semibold mb-3">{getCategoryLabel(statusOption.value)}</h3>

                      {/* Selling Totals */}
                      {sellingTotals && Object.keys(sellingTotals).some(c => sellingTotals[c] > 0) && (
                        <div className="mb-4">
                          <div className="text-xs opacity-75 mb-2">{t('item.sellingTotal')}</div>
                          <div className="space-y-2">
                            {Object.entries(sellingTotals).map(([currency, total]) => total > 0 && (
                              <div key={`selling-${currency}`} className="bg-white/20 dark:bg-white/10 rounded-lg px-4 py-2">
                                <div className="text-sm opacity-90">{currency}</div>
                                <div className="text-2xl font-bold">
                                  {getCategoryPrefix(statusOption.value)}{total.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Purchase Totals */}
                      {purchaseTotals && Object.keys(purchaseTotals).some(c => purchaseTotals[c] > 0) && (
                        <div>
                          <div className="text-xs opacity-75 mb-2">{t('item.purchaseTotal')}</div>
                          <div className="space-y-2">
                            {Object.entries(purchaseTotals).map(([currency, total]) => total > 0 && (
                              <div key={`purchase-${currency}`} className="bg-white/20 dark:bg-white/10 rounded-lg px-4 py-2">
                                <div className="text-sm opacity-90">{currency}</div>
                                <div className="text-xl font-semibold opacity-90">
                                  {getCategoryPrefix(statusOption.value)}{total.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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

          {/* Filter UI */}
          {!loading && items.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('filters.filterItems')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Name Search */}
                <input
                  type="text"
                  placeholder={t('filters.searchByName')}
                  value={filters.searchName}
                  onChange={(e) => setFilters({ ...filters, searchName: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('filters.allStatuses')}</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>

                {/* Min Price */}
                <input
                  type="number"
                  placeholder={t('filters.minPrice')}
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Max Price */}
                <input
                  type="number"
                  placeholder={t('filters.maxPrice')}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Clear Filters Button */}
              {(filters.searchName || filters.status || filters.minPrice || filters.maxPrice) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  {t('filters.clearFilters')}
                </button>
              )}
            </div>
          )}

          {/* Items Display - Card or Table View */}
          {!loading && items.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('dashboard.noItems')}</p>
            </div>
          )}

          {!loading && filteredItems.length > 0 && viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const itemTotal = item.quantity * (item.price_per_unit || 0);
                return (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{item.name}</h3>
                        {item.category && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                            {t(`status.${item.category === 'in_stock' ? 'inStock' : item.category === 'on_the_way' ? 'onTheWay' : 'needToOrder'}`)}
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

                      {/* Selling Price Per Unit */}
                      {item.price_per_unit !== undefined && item.price_per_unit !== null && item.price_per_unit > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{t('item.pricePerUnit')}:</span>
                          <span className="font-medium dark:text-gray-200">{Number(item.price_per_unit).toFixed(2)} {item.currency}</span>
                        </div>
                      )}

                      {/* Selling Total */}
                      {item.price_per_unit !== undefined && item.price_per_unit !== null && item.price_per_unit > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{t('item.sellingTotal')}:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {Number(itemTotal).toFixed(2)} {item.currency}
                          </span>
                        </div>
                      )}

                      {/* Purchase Price Per Unit */}
                      {item.purchase_price !== undefined && item.purchase_price !== null && item.purchase_price > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{t('item.purchasePrice')}:</span>
                          <span className="font-medium dark:text-gray-200">{Number(item.purchase_price).toFixed(2)} {item.purchase_currency}</span>
                        </div>
                      )}

                      {/* Purchase Total */}
                      {item.purchase_price !== undefined && item.purchase_price !== null && item.purchase_price > 0 && (
                        <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                          <span className="text-gray-500 dark:text-gray-400">{t('item.purchaseTotal')}:</span>
                          <span className="font-medium text-orange-600 dark:text-orange-400">
                            {Number(item.quantity * item.purchase_price).toFixed(2)} {item.purchase_currency}
                          </span>
                        </div>
                      )}

                      {/* Sell Button (In Stock items only) */}
                      {item.category === 'in_stock' && item.quantity > 0 && (
                        <button
                          onClick={() => handleOpenSellModal(item)}
                          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          💰 {t('sales.sellItem')}
                        </button>
                      )}

                      {/* Move/Transfer Button */}
                      {item.category === 'need_to_order' && (
                        <button
                          onClick={() => handleOpenMoveModal(item, 'on_the_way')}
                          className="w-full mt-3 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium"
                        >
                          → {t('item.moveToOnTheWay')}
                        </button>
                      )}
                      {item.category === 'on_the_way' && (
                        <button
                          onClick={() => handleOpenMoveModal(item, 'in_stock')}
                          className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          → {t('item.moveToInStock')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {!loading && filteredItems.length > 0 && viewMode === 'table' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('form.name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('form.status')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('item.quantity')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('item.pricePerUnit')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('item.purchasePrice')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('item.sellingTotal')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('profile.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredItems.map((item) => {
                    const itemTotal = item.quantity * (item.price_per_unit || 0);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.category && (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {t(`status.${item.category === 'in_stock' ? 'inStock' : item.category === 'on_the_way' ? 'onTheWay' : 'needToOrder'}`)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleQuickQuantityChange(item, -1)}
                              disabled={item.quantity === 0}
                              className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-xs"
                              title={t('item.decrease')}
                            >
                              −
                            </button>
                            <span className="font-bold text-sm min-w-[30px] text-center dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => handleQuickQuantityChange(item, 1)}
                              className="w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                              title={t('item.increase')}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                          {item.price_per_unit !== undefined && item.price_per_unit !== null && item.price_per_unit > 0
                            ? `${Number(item.price_per_unit).toFixed(2)} ${item.currency}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                          {item.purchase_price !== undefined && item.purchase_price !== null && item.purchase_price > 0
                            ? `${Number(item.purchase_price).toFixed(2)} ${item.purchase_currency}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400 text-right">
                          {item.price_per_unit !== undefined && item.price_per_unit !== null && item.price_per_unit > 0
                            ? `${Number(itemTotal).toFixed(2)} ${item.currency}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {item.category === 'in_stock' && item.quantity > 0 && (
                              <button
                                onClick={() => handleOpenSellModal(item)}
                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                title={t('sales.sellItem')}
                              >
                                💰
                              </button>
                            )}
                            {item.category === 'need_to_order' && (
                              <button
                                onClick={() => handleOpenMoveModal(item, 'on_the_way')}
                                className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs"
                                title={t('item.moveToOnTheWay')}
                              >
                                →
                              </button>
                            )}
                            {item.category === 'on_the_way' && (
                              <button
                                onClick={() => handleOpenMoveModal(item, 'in_stock')}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                title={t('item.moveToInStock')}
                              >
                                →
                              </button>
                            )}
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              title={t('item.edit')}
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              title={t('item.delete')}
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 dark:text-white">{t('form.addNewItem')}</h3>

            <form onSubmit={handleAddItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('form.name')} {t('form.required')}
                  </label>
                  <input
                    type="text"
                    required
                    list="item-names-list"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('sales.typeOrSelect')}
                  />
                  <datalist id="item-names-list">
                    {itemNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('form.description')}
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
                    {t('form.quantity')}
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
                    {t('form.pricePerUnit')}
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
                    {t('form.sellingCurrency')}
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
                    {t('form.purchasePrice')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchase_price || ''}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value ? parseFloat(e.target.value) : 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('form.purchaseCurrency')}
                  </label>
                  <select
                    value={formData.purchase_currency}
                    onChange={(e) => setFormData({ ...formData, purchase_currency: e.target.value as 'GEL' | 'USD' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="GEL">GEL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('form.status')} {t('form.required')}
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('status.choose')}</option>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? t('form.adding') : t('dashboard.addItem')}
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
            <h3 className="text-xl font-bold mb-4 dark:text-white">{t('form.editItem')}</h3>

            <form onSubmit={handleUpdateItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('form.name')} {t('form.required')}
                  </label>
                  <input
                    type="text"
                    required
                    list="item-names-list-edit"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('sales.typeOrSelect')}
                  />
                  <datalist id="item-names-list-edit">
                    {itemNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('form.description')}
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
                    {t('form.quantity')}
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
                    {t('form.pricePerUnit')}
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
                    {t('form.sellingCurrency')}
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
                    {t('form.purchasePrice')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchase_price || ''}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value ? parseFloat(e.target.value) : 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('form.purchaseCurrency')}
                  </label>
                  <select
                    value={formData.purchase_currency}
                    onChange={(e) => setFormData({ ...formData, purchase_currency: e.target.value as 'GEL' | 'USD' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="GEL">GEL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('form.status')} {t('form.required')}
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('status.choose')}</option>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
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
                  {t('form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? t('form.updating') : t('form.updateItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell Item Modal */}
      {showSellModal && sellingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-xl font-bold mb-4 dark:text-white">{t('sales.sellItem')}: {sellingItem.name}</h3>
              <div className="space-y-4">
                {/* Available Stock Info */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t('sales.availableStock', { quantity: sellingItem.quantity })}
                  </p>
                </div>

                {/* Quantity Sold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('sales.quantitySold')} {t('form.required')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={sellingItem.quantity}
                    required
                    value={sellFormData.quantity_sold}
                    onChange={(e) => setSellFormData({ ...sellFormData, quantity_sold: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Sale Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('sales.salePrice')} ({sellingItem.currency}) {t('form.required')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={sellFormData.sale_price}
                    onChange={(e) => setSellFormData({ ...sellFormData, sale_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Total Amount Display */}
                <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 dark:border-green-500 p-3">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t('sales.totalAmount')}: <span className="font-bold">{(sellFormData.quantity_sold * sellFormData.sale_price).toFixed(2)} {sellingItem.currency}</span>
                  </p>
                </div>

                {/* Buyer Name (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('sales.buyerName')} <span className="text-gray-400 text-xs">{t('sales.optionalField')}</span>
                  </label>
                  <input
                    type="text"
                    value={sellFormData.buyer_name}
                    onChange={(e) => setSellFormData({ ...sellFormData, buyer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Buyer Phone (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('sales.buyerPhone')} <span className="text-gray-400 text-xs">{t('sales.optionalField')}</span>
                  </label>
                  <input
                    type="text"
                    value={sellFormData.buyer_phone}
                    onChange={(e) => setSellFormData({ ...sellFormData, buyer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('sales.notes')} <span className="text-gray-400 text-xs">{t('sales.optionalField')}</span>
                  </label>
                  <textarea
                    value={sellFormData.notes}
                    onChange={(e) => setSellFormData({ ...sellFormData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Multi-Item Sale Toggle */}
                <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <input
                    type="checkbox"
                    id="multiItemSale"
                    checked={isMultiItemSale}
                    onChange={(e) => {
                      setIsMultiItemSale(e.target.checked);
                      if (!e.target.checked) {
                        setAdditionalItems([]);
                      }
                    }}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <label htmlFor="multiItemSale" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    💼 {t('sales.multiItemSale')}
                  </label>
                </div>

                {/* Additional Items Section */}
                {isMultiItemSale && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('sales.additionalItems')}</h4>
                      <button
                        type="button"
                        onClick={handleAddAdditionalItem}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        + {t('sales.addItem')}
                      </button>
                    </div>

                    {additionalItems.map((addItem, index) => {
                      const selectedItem = items.find(i => i.id === addItem.item_id);

                      // Get available items (not selected in OTHER dropdowns, but include current selection)
                      const availableItems = items.filter(
                        item => item.category === 'in_stock' &&
                        item.id !== sellingItem.id &&
                        (item.id === addItem.item_id || !additionalItems.some((ai, i) => i !== index && ai.item_id === item.id))
                      );

                      return (
                        <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{t('sales.itemNumber', { number: index + 2 })}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditionalItem(index)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 text-sm"
                            >
                              ✕
                            </button>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sales.item')}</label>
                            <select
                              value={addItem.item_id ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!value) return;

                                const itemId = parseInt(value);
                                const item = items.find(i => i.id === itemId);

                                // Update both fields at once to avoid inconsistencies
                                const updated = [...additionalItems];
                                updated[index] = {
                                  ...updated[index],
                                  item_id: itemId,
                                  sale_price: item?.price_per_unit || 0
                                };
                                setAdditionalItems(updated);
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                            >
                              <option value="">{t('status.chooseItem')}</option>
                              {availableItems.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.name} ({t('sales.stock')}: {item.quantity})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sales.quantity')}</label>
                              <input
                                type="number"
                                min="1"
                                max={selectedItem?.quantity || 1}
                                value={addItem.quantity_sold}
                                onChange={(e) => handleUpdateAdditionalItem(index, 'quantity_sold', parseInt(e.target.value) || 1)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sales.price')} ({selectedItem?.currency})</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={addItem.sale_price}
                                onChange={(e) => handleUpdateAdditionalItem(index, 'sale_price', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sales.note')}</label>
                            <input
                              type="text"
                              value={addItem.notes}
                              onChange={(e) => handleUpdateAdditionalItem(index, 'notes', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                              placeholder={t('sales.optionalNote')}
                            />
                          </div>

                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {t('sales.total')}: <span className="font-semibold">{(addItem.quantity_sold * addItem.sale_price).toFixed(2)} {selectedItem?.currency}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Grand Total for Multi-Item Sale */}
                    {additionalItems.length > 0 && (() => {
                      // Calculate totals by currency
                      const currencyTotals: Record<string, number> = {};

                      // Add the main item
                      const mainCurrency = sellingItem.currency || 'USD';
                      currencyTotals[mainCurrency] = sellFormData.quantity_sold * sellFormData.sale_price;

                      // Add additional items
                      additionalItems.forEach(addItem => {
                        const item = items.find(i => i.id === addItem.item_id);
                        const itemCurrency = item?.currency || 'USD';
                        const itemTotal = addItem.quantity_sold * addItem.sale_price;
                        currencyTotals[itemCurrency] = (currencyTotals[itemCurrency] || 0) + itemTotal;
                      });

                      return (
                        <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 dark:border-green-500 p-3">
                          <p className="text-sm text-green-700 dark:text-green-300 font-semibold mb-2">
                            {t('sales.grandTotal')}:
                          </p>
                          <div className="space-y-1">
                            {Object.entries(currencyTotals).map(([currency, total]) => (
                              <div key={currency} className="text-sm text-green-700 dark:text-green-300">
                                <span className="font-bold">{total.toFixed(2)} {currency}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Sale Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('sales.saleDate')} {t('form.required')}
                  </label>
                  <input
                    type="date"
                    required
                    value={sellFormData.sale_date}
                    onChange={(e) => setSellFormData({ ...sellFormData, sale_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <form onSubmit={handleSellItem}>
              <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSellModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t('form.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? t('sales.selling') : t('sales.createSale')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Quantity Modal */}
      {showMoveModal && movingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 dark:text-white">
              {targetStatus === 'on_the_way' ? t('item.moveToOnTheWay') : t('item.moveToInStock')}
            </h3>

            <div className="space-y-4">
              {/* Item Info */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 p-3">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">{movingItem.name}</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('item.available')}: {movingItem.quantity} {t('item.item', { count: movingItem.quantity })}
                </p>
              </div>

              {/* Quantity to Move */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('item.quantityToMove')} {t('form.required')}
                </label>
                <input
                  type="number"
                  min="1"
                  max={movingItem.quantity}
                  required
                  value={moveQuantity}
                  onChange={(e) => setMoveQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {moveQuantity === movingItem.quantity
                    ? t('item.movingAllItems')
                    : t('item.itemsWillRemain', { count: movingItem.quantity - moveQuantity })}
                </p>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMoveQuantity(Math.ceil(movingItem.quantity / 2))}
                  className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                >
                  {t('item.half')} ({Math.ceil(movingItem.quantity / 2)})
                </button>
                <button
                  type="button"
                  onClick={() => setMoveQuantity(movingItem.quantity)}
                  className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                >
                  {t('item.all')} ({movingItem.quantity})
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('form.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmMove}
                disabled={submitting || moveQuantity < 1 || moveQuantity > movingItem.quantity}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? t('item.moving') : t('item.confirmMove')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Confirmation Modal */}
      {showDuplicateModal && duplicateItem && pendingItemData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-400">
              ⚠️ {t('item.duplicateFound')}
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {t('item.duplicateMessage', {
                name: pendingItemData.name,
                status: t(`status.${duplicateItem.category === 'in_stock' ? 'inStock' : duplicateItem.category === 'on_the_way' ? 'onTheWay' : 'needToOrder'}`)
              })}
            </p>

            <div className="space-y-4 mb-6">
              {/* Merge Option */}
              <div className="p-4 border-2 border-blue-500 dark:border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  {t('item.mergeItems')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('item.mergeDescription', {
                    quantity: pendingItemData.quantity || 1,
                    total: duplicateItem.quantity + (pendingItemData.quantity || 1)
                  })}
                </div>
              </div>

              {/* Create Separate Option */}
              <div className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('item.createSeparate')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('item.createDescription')}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('form.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateSeparate}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('item.createSeparate')}
              </button>
              <button
                type="button"
                onClick={handleMergeDuplicate}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {t('item.mergeItems')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
