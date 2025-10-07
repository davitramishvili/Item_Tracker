import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { itemNameService, type ItemName } from '../services/itemNameService';

const Profile = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [itemNames, setItemNames] = useState<ItemName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadItemNames();
  }, []);

  const loadItemNames = async () => {
    try {
      setLoading(true);
      const data = await itemNameService.getAll();
      setItemNames(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToLoadItems'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (item: ItemName) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingName.trim()) {
      setError(t('profile.nameRequired'));
      return;
    }

    try {
      const updatedItem = await itemNameService.update(id, editingName);
      setItemNames(itemNames.map(item => item.id === id ? updatedItem : item));
      setEditingId(null);
      setEditingName('');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || t('profile.failedToUpdateName'));
    }
  };

  const handleDeleteItemName = async (id: number) => {
    if (!confirm(t('profile.deleteNameConfirm'))) return;

    try {
      await itemNameService.delete(id);
      setItemNames(itemNames.filter(item => item.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || t('profile.failedToDeleteName'));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('profile.title')}</h2>

          {/* User Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('profile.userInfo')}</h3>
            <div className="space-y-3">
              <div className="flex border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="font-medium text-gray-700 dark:text-gray-300 w-32">{t('profile.fullName')}:</span>
                <span className="text-gray-900 dark:text-white">{user?.full_name || 'N/A'}</span>
              </div>
              <div className="flex border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="font-medium text-gray-700 dark:text-gray-300 w-32">{t('profile.username')}:</span>
                <span className="text-gray-900 dark:text-white">{user?.username || 'N/A'}</span>
              </div>
              <div className="flex border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="font-medium text-gray-700 dark:text-gray-300 w-32">{t('profile.email')}:</span>
                <span className="text-gray-900 dark:text-white">{user?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Item Names Management Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('profile.savedItemNames')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('profile.savedItemNamesDescription')}</p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="text-center py-8">
                <div className="text-gray-600 dark:text-gray-400">{t('profile.loadingNames')}</div>
              </div>
            )}

            {/* No Item Names */}
            {!loading && itemNames.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-500">
                {t('profile.noSavedNames')}
              </div>
            )}

            {/* Item Names List */}
            {!loading && itemNames.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('profile.itemName')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('profile.dateAdded')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('profile.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {itemNames.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === item.id ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="px-2 py-1 border border-blue-500 dark:border-blue-400 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingId === item.id ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-medium"
                              >
                                {t('profile.save')}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                {t('profile.cancel')}
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {t('profile.edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteItemName(item.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                {t('profile.delete')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
