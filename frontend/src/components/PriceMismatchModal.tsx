import { useTranslation } from 'react-i18next';

interface PriceMismatchModalProps {
  show: boolean;
  onClose: () => void;
  existingItem: {
    name: string;
    quantity: number;
    purchase_price: number | null;
    purchase_currency?: string;
  };
  movingItem: {
    name: string;
    quantity: number;
    purchase_price: number | null;
    purchase_currency?: string;
  };
  onCombine: () => void;
  onCreateNew: () => void;
}

const PriceMismatchModal = ({
  show,
  onClose,
  existingItem,
  movingItem,
  onCombine,
  onCreateNew,
}: PriceMismatchModalProps) => {
  const { t } = useTranslation();

  if (!show) return null;

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
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('form.name')}:
                  </span>
                  <div className="font-medium text-gray-800 dark:text-white">
                    {existingItem.name}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('item.priceMismatch.quantity')}:
                  </span>
                  <div className="font-medium text-gray-800 dark:text-white">
                    {existingItem.quantity}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('item.priceMismatch.purchasePrice')}:
                  </span>
                  <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                    {existingItem.purchase_price !== null && existingItem.purchase_price !== undefined
                      ? `${Number(existingItem.purchase_price).toFixed(2)} ${existingItem.purchase_currency || 'USD'}`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Moving Item Column */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
                {t('item.priceMismatch.movingItem')}
              </h4>
              <div className="space-y-2">
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('item.priceMismatch.purchasePrice')}:
                  </span>
                  <div className="font-bold text-lg text-orange-600 dark:text-orange-400">
                    {movingItem.purchase_price !== null && movingItem.purchase_price !== undefined
                      ? `${Number(movingItem.purchase_price).toFixed(2)} ${movingItem.purchase_currency || 'USD'}`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Combine Button */}
            <button
              onClick={onCombine}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-left"
            >
              <div className="font-semibold">{t('item.priceMismatch.combine')}</div>
              <div className="text-sm opacity-90 mt-1">
                {t('item.priceMismatch.combineDescription')}
              </div>
            </button>

            {/* Create New Button */}
            <button
              onClick={onCreateNew}
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
