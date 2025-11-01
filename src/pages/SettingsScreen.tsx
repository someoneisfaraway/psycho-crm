// src/pages/SettingsScreen.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Импортируем контекст аутентификации

// --- Компонент профиля ---
interface UserProfileProps {
  user: {
    // Определяем минимально необходимые поля для профиля
    id: string;
    email: string;
    // Предположим, что имя и телефон хранятся в профиле пользователя в Supabase
    user_metadata?: {
      full_name?: string;
      phone?: string;
      registration_type?: string; // 'individual', 'ip', etc.
    };
  };
  // Функция для обновления профиля (реализуем позже)
  onUpdateProfile: (data: { full_name?: string; phone?: string; registration_type?: string }) => void;
  // Флаг загрузки (реализуем позже)
  loading: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateProfile, loading }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    full_name: user.user_metadata?.full_name || '',
    phone: user.user_metadata?.phone || '',
    registration_type: user.user_metadata?.registration_type || 'individual', // Значение по умолчанию
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    // Сбросим форму к текущим данным
    setFormData({
      full_name: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || '',
      registration_type: user.user_metadata?.registration_type || 'individual',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Сбросим форму к данным из пропсов
    setFormData({
      full_name: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || '',
      registration_type: user.user_metadata?.registration_type || 'individual',
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Профиль</h2>
      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" /> {/* Заглушка для аватара */}
            <div className="ml-4">
              <p className="text-gray-900 font-medium">{user.user_metadata?.full_name || 'Имя не указано'}</p>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-gray-600">{user.user_metadata?.registration_type === 'individual' ? 'Самозанятая' : 'ИП'}</p>
            </div>
          </div>
          <button
            onClick={handleEditClick}
            className="mt-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Редактировать профиль
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Имя
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Телефон
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="registration_type" className="block text-sm font-medium text-gray-700">
              Форма регистрации
            </label>
            <select
              id="registration_type"
              name="registration_type"
              value={formData.registration_type}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="individual">Самозанятая</option>
              <option value="ip">ИП</option>
              {/* Добавьте другие варианты при необходимости */}
            </select>
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Отменить
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// --- Основной компонент экрана настроек ---
const SettingsScreen: React.FC = () => {
  const { user: authUser } = useAuth(); // Получаем данные пользователя из контекста

  if (!authUser) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Ошибка: </strong>
          <span className="block sm:inline">Пользователь не аутентифицирован.</span>
        </div>
      </div>
    );
  }

  // Функция для обновления профиля (заглушка)
  const handleUpdateProfile = async (data: { full_name?: string; phone?: string; registration_type?: string }) => {
    console.log("Попытка обновить профиль:", data);
    // Здесь будет вызов API для обновления профиля в Supabase
    // await updateProfileInSupabase(data);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки</h1>

      {/* Компонент профиля */}
      <UserProfile
        user={authUser}
        onUpdateProfile={handleUpdateProfile}
        loading={false} // Заглушка
      />

      {/* Другие секции настроек (уведомления, рабочие настройки) будут добавлены позже */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Настройки уведомлений (заглушка)</h2>
        <p>Эта секция будет реализована в следующих шагах.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Рабочие настройки (заглушка)</h2>
        <p>Эта секция будет реализована в следующих шагах.</p>
      </div>
    </div>
  );
};

export default SettingsScreen;