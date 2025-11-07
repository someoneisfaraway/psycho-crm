// src/pages/SettingsScreen.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Импортируем контекст аутентификации
import { exportUserData } from '../utils/exportData'; // Импортируем функцию экспорта
import { supabase } from '../config/supabase'; // Импортируем клиент

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
    email?: string; // Email может быть undefined в Supabase User
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

  // --- НОВОЕ: Состояния и функции для изменения пароля ---
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmNewPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError("Новые пароли не совпадают.");
      setPasswordSuccess(null);
      return;
    }

    if (passwordData.newPassword.length < 6) { // Пример минимальной длины
       setPasswordError("Пароль должен быть не менее 6 символов.");
       setPasswordSuccess(null);
       return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        throw error;
      }

      setPasswordSuccess("Пароль успешно изменён!");
      setPasswordError(null);
      // Очистить поля
      setPasswordData({ newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError((error as Error).message || "Произошла ошибка при изменении пароля.");
      setPasswordSuccess(null);
    }
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

      {/* --- НОВОЕ: Раздел изменения пароля --- */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-md font-medium text-gray-900 mb-2">Изменить пароль</h3>
        <div className="space-y-2">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
              Новый пароль
            </label>
            <input
              type="password"
              id="new-password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700">
              Подтвердите новый пароль
            </label>
            <input
              type="password"
              id="confirm-new-password"
              name="confirmNewPassword"
              value={passwordData.confirmNewPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmNewPassword: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
          <button
            type="button"
            onClick={handlePasswordChange}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Изменить пароль
          </button>
        </div>
      </div>
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

// --- Компонент экспорта данных ---
interface DataExportProps {
  userId: string; // ID пользователя для экспорта
}

const DataExport: React.FC<DataExportProps> = ({ userId }) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (!userId) {
      console.error("Невозможно экспортировать данные: userId отсутствует.");
      alert("Ошибка: Не удалось получить ID пользователя.");
      return;
    }

    setIsExporting(true);
    try {
      await exportUserData(userId);
      console.log("Файл экспорта скачан.");
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
      // Сообщение об ошибке уже показывается в exportUserData
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Экспорт и резервные копии</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Экспорт всех данных</p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="mt-1 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isExporting ? 'Экспорт...' : 'Экспортировать данные (JSON)'}
          </button>
        </div>
        {/* Другие элементы управления экспортом/резервным копированием будут добавлены позже */}
      </div>
    </div>
  );
};

// --- НОВОЕ: Компонент для удаления аккаунта ---
interface AccountDeletionSectionProps {
  userId: string; // ID пользователя для подтверждения
}

const AccountDeletionSection: React.FC<AccountDeletionSectionProps> = () => {
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { signOut } = useAuth(); // Используем функцию выхода из контекста
  // const router = useRouter(); // Импортируем useRouter из 'next/router' или 'react-router-dom', если используем его

  const isConfirmed = confirmationText === "УДАЛИТЬ МОЙ АККАУНТ";

  const handleDeleteAccount = async () => {
    if (!isConfirmed) return;

    const confirmed = window.confirm("Вы уверены, что хотите УДАЛИТЬ СВОЙ аккаунт и все связанные с ним данные? Это действие необратимо.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // 1. Вызов Edge Function для удаления данных и аккаунта
      // Важно: передавать userId напрямую из клиента небезопасно. Функция должна проверять сессию.
      // Поэтому мы не передаём userId явно, а доверяем сессии внутри функции.
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, // Замените 'delete-user' на имя вашей функции
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.data?.session?.access_token}`, // Передаём токен сессии
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}), // Пустое тело, userId берётся из сессии внутри функции
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при удалении аккаунта");
      }

      // 2. Выход из системы
      await signOut();

      // 3. Перенаправление на экран аутентификации
      // router.push('/auth'); // Закомментировано, так как router может не быть
      window.location.href = '/auth'; // Альтернативный способ перенаправления

    } catch (error) {
      console.error("Error deleting account:", error);
      alert((error as Error).message || "Произошла ошибка при удалении аккаунта.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
      <h2 className="text-lg font-semibold text-red-900 mb-2">Удаление аккаунта</h2>
      <p className="text-sm text-red-700 mb-4">
        Это действие необратимо. Все ваши данные будут удалены.
      </p>
      <div className="mb-4">
        <label htmlFor="confirm-delete" className="block text-sm font-medium text-red-900 mb-1">
          Для подтверждения введите "УДАЛИТЬ МОЙ АККАУНТ" в поле ниже:
        </label>
        <input
          type="text"
          id="confirm-delete"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          className="w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
          placeholder="УДАЛИТЬ МОЙ АККАУНТ"
        />
      </div>
      <button
        type="button"
        onClick={handleDeleteAccount}
        disabled={!isConfirmed || isDeleting}
        className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
          isConfirmed && !isDeleting
            ? "bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            : "bg-red-400 cursor-not-allowed"
        }`}
      >
        {isDeleting ? 'Удаление...' : 'Удалить аккаунт'}
      </button>
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

  // --- Состояние для настроек уведомлений ---
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsData>({
    sessionReminders: true, // Значение по умолчанию
    receiptReminders: false, // Значение по умолчанию
  });

  // --- Состояние для рабочих настроек ---
  const [workSettings, setWorkSettings] = useState<WorkSettingsData>({
    defaultSessionPrice: 5000, // Значение по умолчанию
    defaultSessionDuration: 50, // Значение по умолчанию
    timezone: 'Europe/Moscow', // Значение по умолчанию
  });

  // --- Функция для обновления настроек уведомлений ---
  const handleUpdateNotificationSettings = (newSettings: NotificationSettingsData) => {
    console.log("Попытка обновить настройки уведомлений:", newSettings);
    setNotificationSettings(newSettings);
    // Здесь будет вызов API для сохранения настроек в Supabase
    // await updateNotificationSettingsInSupabase(newSettings);
  };

  // --- Функция для обновления рабочих настроек ---
  const handleUpdateWorkSettings = (newSettings: WorkSettingsData) => {
    console.log("Попытка обновить рабочие настройки:", newSettings);
    setWorkSettings(newSettings);
    // Здесь будет вызов API для сохранения настроек в Supabase
    // await updateWorkSettingsInSupabase(newSettings);
  };

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

      {/* Компонент настроек уведомлений */}
      <NotificationSettings
        settings={notificationSettings}
        onUpdateSettings={handleUpdateNotificationSettings}
      />

      {/* Компонент рабочих настроек */}
      <WorkSettings
        settings={workSettings}
        onUpdateSettings={handleUpdateWorkSettings}
      />

      {/* Компонент экспорта данных */}
      <DataExport userId={authUser.id} />

      {/* --- НОВОЕ: Компонент удаления аккаунта --- */}
      <AccountDeletionSection userId={authUser.id} />
    </div>
  );
};

export default SettingsScreen;