// src/pages/SettingsScreen.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Импортируем контекст аутентификации

// --- Тип для настроек уведомлений ---
interface NotificationSettingsData {
  sessionReminders: boolean;
  receiptReminders: boolean;
  // Добавьте другие типы уведомлений при необходимости
}

// --- Тип для рабочих настроек ---
interface WorkSettingsData {
  defaultSessionPrice: number;
  defaultSessionDuration: number; // в минутах
  timezone: string;
  // Добавьте другие рабочие настройки при необходимости
}

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

// --- Компонент настроек уведомлений ---
interface NotificationSettingsProps {
  settings: NotificationSettingsData;
  onUpdateSettings: (newSettings: NotificationSettingsData) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings, onUpdateSettings }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    // Обновляем только одно поле в настройках
    onUpdateSettings({ ...settings, [name]: checked });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Настройки уведомлений</h2>
      <ul className="space-y-4">
        <li className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="sessionReminders"
              name="sessionReminders"
              type="checkbox"
              checked={settings.sessionReminders}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="sessionReminders" className="ml-2 block text-sm text-gray-900">
              Напоминания о сессиях
            </label>
          </div>
        </li>
        <li className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="receiptReminders"
              name="receiptReminders"
              type="checkbox"
              checked={settings.receiptReminders}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="receiptReminders" className="ml-2 block text-sm text-gray-900">
              Напоминания о чеках
            </label>
          </div>
        </li>
        {/* Добавьте другие типы уведомлений при необходимости */}
      </ul>
    </div>
  );
};

// --- Компонент рабочих настроек ---
interface WorkSettingsProps {
  settings: WorkSettingsData;
  onUpdateSettings: (newSettings: WorkSettingsData) => void;
}

const WorkSettings: React.FC<WorkSettingsProps> = ({ settings, onUpdateSettings }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<WorkSettingsData>(settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'defaultSessionPrice' || name === 'defaultSessionDuration' ? parseInt(value, 10) || 0 : value }));
  };

  const handleSave = () => {
    onUpdateSettings(formData);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Сбросим форму к текущим данным
    setFormData(settings);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Сбросим форму к данным из пропсов
    setFormData(settings);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Рабочие настройки</h2>
      {!isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Стандартная стоимость сессии</p>
              <p className="text-gray-900 font-medium">{settings.defaultSessionPrice} ₽</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Стандартная длительность сессии</p>
              <p className="text-gray-900 font-medium">{settings.defaultSessionDuration} мин</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Часовой пояс</p>
              <p className="text-gray-900 font-medium">{settings.timezone}</p>
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="mt-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Редактировать
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="defaultSessionPrice" className="block text-sm font-medium text-gray-700">
                Стандартная стоимость сессии (₽)
              </label>
              <input
                type="number"
                id="defaultSessionPrice"
                name="defaultSessionPrice"
                value={formData.defaultSessionPrice}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="defaultSessionDuration" className="block text-sm font-medium text-gray-700">
                Стандартная длительность сессии (мин)
              </label>
              <input
                type="number"
                id="defaultSessionDuration"
                name="defaultSessionDuration"
                value={formData.defaultSessionDuration}
                onChange={handleChange}
                min="1"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Часовой пояс
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {/* Примеры часовых поясов, можно расширить */}
                <option value="Europe/Moscow">Москва (MSK)</option>
                <option value="Europe/Kiev">Киев (EET)</option>
                <option value="Asia/Yekaterinburg">Екатеринбург (YEKT)</option>
                {/* Добавьте другие по необходимости */}
              </select>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Сохранить
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

  // --- НОВОЕ: Состояние для настроек уведомлений ---
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsData>({
    sessionReminders: true, // Значение по умолчанию
    receiptReminders: false, // Значение по умолчанию
  });

  // --- НОВОЕ: Состояние для рабочих настроек ---
  const [workSettings, setWorkSettings] = useState<WorkSettingsData>({
    defaultSessionPrice: 5000, // Значение по умолчанию
    defaultSessionDuration: 50, // Значение по умолчанию
    timezone: 'Europe/Moscow', // Значение по умолчанию
  });

  // --- НОВОЕ: Функция для обновления настроек уведомлений ---
  const handleUpdateNotificationSettings = (newSettings: NotificationSettingsData) => {
    console.log("Попытка обновить настройки уведомлений:", newSettings);
    setNotificationSettings(newSettings);
    // Здесь будет вызов API для сохранения настроек в Supabase
    // await updateNotificationSettingsInSupabase(newSettings);
  };

  // --- НОВОЕ: Функция для обновления рабочих настроек ---
  const handleUpdateWorkSettings = (newSettings: WorkSettingsData) => {
    console.log("Попытка обновить рабочие настройки:", newSettings);
    setWorkSettings(newSettings);
    // Здесь будет вызов API для сохранения настроек в Supabase
    // await updateWorkSettingsInSupabase(newSettings);
  };

  // Функция для обновления профиля (заглушка)
  const handleUpdateProfile = async ( { full_name?: string; phone?: string; registration_type?: string }) => {
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

      {/* Компонент настроек уведомлений */}
      <NotificationSettings
        settings={notificationSettings}
        onUpdateSettings={handleUpdateNotificationSettings}
      />

      {/* --- НОВОЕ: Компонент рабочих настроек --- */}
      <WorkSettings
        settings={workSettings}
        onUpdateSettings={handleUpdateWorkSettings}
      />
    </div>
  );
};

export default SettingsScreen;