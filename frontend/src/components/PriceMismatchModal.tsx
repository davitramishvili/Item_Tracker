import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface ExistingItemOption {
  id: number;
  name: string;
  quantity: number;
  purchase_price: number | null;
  purchase_currency?: string;
}

interface PriceMismatchModalProps {
  show: boolean;
  onClose: () => void;
  existingItems: ExistingItemOption[]; // Changed from single item to array
  movingItem: {
    name: string;
    quantity: number;
    purchase_price: number | null;
    purchase_currency?: string;
  };
  onCombine: (selectedItemId: number, editedPrice?: number, editedCurrency?: string) => void;
  onCreateNew: (editedPrice?: number, editedCurrency?: string) => void;
}

const PriceMismatchModal = ({
  show,
  onClose,
  existingItems,
  movingItem,
  onCombine,
  onCreateNew,
}: PriceMismatchModalProps) => {
  const { t } = useTranslation();

  // Selected existing item from dropdown
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // Editable moving item price state
  const [editedPrice, setEditedPrice] = useState<number>(movingItem.purchase_price || 0);
  const [editedCurrency, setEditedCurrency] = useState<string>(movingItem.purchase_currency || 'USD');

  // Reset state when modal opens with new data
  useEffect(() => {
    if (show) {
      setEditedPrice(movingItem.purchase_price || 0);
      setEditedCurrency(movingItem.purchase_currency || 'USD');
      setSelectedItemId(null); // Reset selection
    }
  }, [show, movingItem.purchase_price, movingItem.purchase_currency]);

  if (!show) return null;

  const selectedItem = existingItems.find(item => item.id === selectedItemId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            {t('item.priceMismatch.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('item.priceMismatch.description')}
          </p>

          {/* Comparison Table */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Existing Item Column */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
                {t('item.priceMismatch.existingItem')}
              </h4>
              <div className="space-y-3">
                {/* Dropdown to select existing item */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    Select Item to Compare:
                  </label>
                  <select
                    value={selectedItemId || ''}
                    onChange={(e) => setSelectedItemId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select item...</option>
                    {existingItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - Purchase: {item.purchase_price !== null ? `${Number(item.purchase_price).toFixed(2)} ${item.purchase_currency || 'USD'}` : 'N/A'} (Qty: {item.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show selected item details */}
                {selectedItem && (
                  <>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t('form.name')}:
                      </span>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {selectedItem.name}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t('item.priceMismatch.quantity')}:
                      </span>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {selectedItem.quantity}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t('item.priceMismatch.purchasePrice')}:
                      </span>
                      <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                        {selectedItem.purchase_price !== null && selectedItem.purchase_price !== undefined
                          ? `${Number(selectedItem.purchase_price).toFixed(2)} ${selectedItem.purchase_currency || 'USD'}`
                          : 'N/A'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Moving Item Column */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
                {t('item.priceMismatch.movingItem')} (Editable)
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('form.name')}:
                  </span>
                  <div className="font-medium text-gray-800 dark:text-white">
                    {movingItem.name}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('item.priceMismatch.quantity')}:
                  </span>
                  <div className="font-medium text-gray-800 dark:text-white">
                    {movingItem.quantity}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {t('item.priceMismatch.purchasePrice')}:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <select
                      value={editedCurrency}
                      onChange={(e) => setEditedCurrency(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="USD">USD</option>
                      <option value="GEL">GEL</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                    Adjust for shipping costs or other factors
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Combine Button */}
            <button
              onClick={() => selectedItemId && onCombine(selectedItemId, editedPrice, editedCurrency)}
              disabled={!selectedItemId}
              className={`w-full px-4 py-3 ${selectedItemId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-md transition-colors text-left`}
            >
              <div className="font-semibold">{t('item.priceMismatch.combine')}</div>
              <div className="text-sm opacity-90 mt-1">
                {selectedItemId ? t('item.priceMismatch.combineDescription') : 'Select an item first'}
              </div>
            </button>

            {/* Create New Button */}
            <button
              onClick={() => onCreateNew(editedPrice, editedCurrency)}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-left"
            >
              <div className="font-semibold">{t('item.priceMismatch.createNew')}</div>
              <div className="text-sm opacity-90 mt-1">
                {t('item.priceMismatch.createNewDescription')}
              </div>
            </button>

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              {t('profile.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceMismatchModal;
