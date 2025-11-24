// src/pages/SettingsScreen.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Импортируем контекст аутентификации
import { exportUserData } from '../utils/exportData'; // Импортируем функцию экспорта
import { supabase } from '../config/supabase'; // Импортируем клиент
// import of encryption settings removed
import { Button } from '../components/ui/Button';

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
  clientSource2?: string;
  clientSource3?: string;
  clientSource4?: string;
  // Добавьте другие рабочие настройки при необходимости
}

// --- Компонент профиля ---
interface UserProfileProps {
  user: {
    // Определяем минимально необходимые поля для профиля
    id: string;
    email?: string; // Email может быть undefined в Supabase User
    user_metadata?: {
      full_name?: string;
    };
  };
  initialName?: string;
  // Функция для обновления профиля (сохранение только имени)
  onUpdateProfile: (data: { full_name?: string }) => Promise<void> | void;
  // Флаг загрузки
  loading: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, initialName, onUpdateProfile, loading }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [displayName, setDisplayName] = React.useState<string>((initialName ?? user.user_metadata?.full_name) || '');
  const [formData, setFormData] = React.useState({
    full_name: (initialName ?? user.user_metadata?.full_name) || '',
  });
  const [profileSuccess, setProfileSuccess] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile({ full_name: formData.full_name });
    setDisplayName(formData.full_name);
    setProfileSuccess('Имя сохранено');
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    // Сбросим форму к текущим данным
    setFormData({
      full_name: (initialName ?? user.user_metadata?.full_name) || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Сбросим форму к данным из пропсов
    setFormData({
      full_name: (initialName ?? user.user_metadata?.full_name) || '',
    });
  };
  React.useEffect(() => {
    // Обновлять отображаемое имя, если пришло новое начальное значение (например, из БД)
    if (!isEditing) {
      setDisplayName((initialName ?? user.user_metadata?.full_name) || '');
    }
  }, [initialName, user.user_metadata, isEditing]);

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
    <div className="card mb-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">Профиль</h2>
      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="bg-background-secondary border-2 border-dashed rounded-xl w-16 h-16" /> {/* Заглушка для аватара */}
            <div className="ml-4">
              <p className="text-text-primary font-medium">{displayName || 'Имя не указано'}</p>
              <p className="text-text-secondary">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleEditClick}
            className="btn-secondary"
          >
            Редактировать профиль
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-text-secondary">
              Имя
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          {profileSuccess && (
            <p className="text-sm text-green-600">{profileSuccess}</p>
          )}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
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
            className="btn-secondary"
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
    <div className="card mb-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">Настройки уведомлений</h2>
      <ul className="space-y-4">
        <li className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="sessionReminders"
              name="sessionReminders"
              type="checkbox"
              checked={settings.sessionReminders}
              onChange={handleChange}
              className="form-checkbox"
            />
            <label htmlFor="sessionReminders" className="ml-2 block text-sm text-text-primary">
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
              className="form-checkbox"
            />
            <label htmlFor="receiptReminders" className="ml-2 block text-sm text-text-primary">
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
  onUpdateSettings: (newSettings: WorkSettingsData) => Promise<void> | void;
}

const WorkSettings: React.FC<WorkSettingsProps> = ({ settings, onUpdateSettings }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<WorkSettingsData>(settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'defaultSessionPrice' || name === 'defaultSessionDuration' ? parseInt(value, 10) || 0 : value }));
  };

  const handleSave = async () => {
    await Promise.resolve(onUpdateSettings(formData));
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(settings);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Сбросим форму к данным из пропсов
    setFormData(settings);
  };

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">Рабочие настройки</h2>
      {!isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Стандартная стоимость сессии</p>
              <p className="text-text-primary font-medium">{settings.defaultSessionPrice} ₽</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Стандартная длительность сессии</p>
              <p className="text-text-primary font-medium">{settings.defaultSessionDuration} мин</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-text-secondary">Часовой пояс</p>
              <p className="text-text-primary font-medium">{settings.timezone}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-text-secondary">Источники клиентов</p>
              <div className="text-text-primary font-medium space-y-1">
                <div>{settings.clientSource2 || 'источник 2'}</div>
                <div>{settings.clientSource3 || 'источник 3'}</div>
                <div>{settings.clientSource4 || 'источник 4'}</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="btn-secondary"
          >
            Редактировать
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="defaultSessionPrice" className="block text-sm font-medium text-text-secondary">
                Стандартная стоимость сессии (₽)
              </label>
              <input
                type="number"
                id="defaultSessionPrice"
                name="defaultSessionPrice"
                value={formData.defaultSessionPrice}
                onChange={handleChange}
                min="0"
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="defaultSessionDuration" className="block text-sm font-medium text-text-secondary">
                Стандартная длительность сессии (мин)
              </label>
              <input
                type="number"
                id="defaultSessionDuration"
                name="defaultSessionDuration"
                value={formData.defaultSessionDuration}
                onChange={handleChange}
                min="1"
                className="form-input"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="timezone" className="block text-sm font-medium text-text-secondary">
                Часовой пояс
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="form-input"
              >
                {/* Примеры часовых поясов, можно расширить */}
                <option value="Europe/Moscow">Москва (MSK)</option>
                <option value="Europe/Helsinki">Хельсинки (EET)</option>
                <option value="Asia/Yekaterinburg">Екатеринбург (YEKT)</option>
                {/* Добавьте другие по необходимости */}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary">Источники клиентов</label>
              <div className="space-y-2">
                <input
                  type="text"
                  name="clientSource2"
                  value={formData.clientSource2 || ''}
                  onChange={handleChange}
                  placeholder="источник 2"
                  className="form-input"
                />
                <input
                  type="text"
                  name="clientSource3"
                  value={formData.clientSource3 || ''}
                  onChange={handleChange}
                  placeholder="источник 3"
                  className="form-input"
                />
                <input
                  type="text"
                  name="clientSource4"
                  value={formData.clientSource4 || ''}
                  onChange={handleChange}
                  placeholder="источник 4"
                  className="form-input"
                />
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="btn-primary"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
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
    <div className="card">
      <h2 className="text-lg font-semibold text-text-primary mb-4">Экспорт и резервные копии</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-text-secondary">Экспорт всех данных</p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn-secondary"
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
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data?.session?.access_token || '';
      const invokeRes = await supabase.functions.invoke('delete-user', {
        body: {},
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (invokeRes.error) {
        const url = (import.meta.env.VITE_SUPABASE_URL || '').toString();
        const resp = await fetch(`${url}/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
        });
        if (!resp.ok) {
          let msg = 'Ошибка при удалении аккаунта';
          try { const j = await resp.json(); msg = j?.error || msg; } catch {}
          throw new Error(msg);
        }
      }

      await signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert((error as Error).message || 'Произошла ошибка при удалении аккаунта.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="card border-status-error-border bg-status-error-bg mt-6">
      <h2 className="text-lg font-semibold text-status-error mb-2">Удаление аккаунта</h2>
      <p className="text-sm text-status-error-text mb-4">
        Это действие необратимо. Все ваши данные будут удалены.
      </p>
      <div className="mb-4">
        <label htmlFor="confirm-delete" className="block text-sm font-medium text-status-error mb-1">
          Для подтверждения введите "УДАЛИТЬ МОЙ АККАУНТ" в поле ниже:
        </label>
        <input
          type="text"
          id="confirm-delete"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          className="form-input border-status-error-border focus:ring-status-error focus:border-status-error"
          placeholder="УДАЛИТЬ МОЙ АККАУНТ"
        />
      </div>
      <Button
        type="button"
        variant="destructive"
        onClick={handleDeleteAccount}
        disabled={!isConfirmed || isDeleting}
      >
        {isDeleting ? 'Удаление...' : 'Удалить аккаунт'}
      </Button>
    </div>
  );
};

// --- Основной компонент экрана настроек ---
const SettingsScreen: React.FC = () => {
  const { user: authUser, signOut } = useAuth(); // Получаем данные пользователя и функцию выхода из контекста

  if (!authUser) {
    return (
      <div className="screen-container">
        <div className="card bg-status-error-bg border-status-error-border text-status-error px-4 py-3 relative" role="alert">
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
  const [dbUserName, setDbUserName] = useState<string>('');

  // --- Функция для обновления настроек уведомлений ---
  const handleUpdateNotificationSettings = (newSettings: NotificationSettingsData) => {
    console.log("Попытка обновить настройки уведомлений:", newSettings);
    setNotificationSettings(newSettings);
    // Здесь будет вызов API для сохранения настроек в Supabase
    // await updateNotificationSettingsInSupabase(newSettings);
  };

  // --- Функция для обновления рабочих настроек ---
  const handleUpdateWorkSettings = async (newSettings: WorkSettingsData) => {
    console.log("Попытка обновить рабочие настройки:", newSettings);
    const prevSettings = workSettings;
    // Сразу обновим UI, но откатим при ошибке
    setWorkSettings(newSettings);

    try {
      // Убедимся, что запись пользователя существует (как в сохранении имени)
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .limit(1);

        const exists = Array.isArray(existingUser) ? existingUser.length > 0 : !!existingUser;
        if (!exists) {
          const { error: rpcError } = await supabase.rpc('ensure_user_exists', {
            uid: authUser.id,
            uemail: authUser.email || null,
          } as any);
          if (rpcError) {
            // Игнорируем ошибку RPC, если функции нет; попробуем upsert ниже
            console.warn('RPC ensure_user_exists не выполнен:', rpcError.message || rpcError);
          }
        }
      } catch (ensureErr) {
        console.warn('Не удалось убедиться в наличии записи пользователя перед сохранением рабочих настроек:', ensureErr);
      }

      const payload = {
        default_session_price: newSettings.defaultSessionPrice,
        default_session_duration: newSettings.defaultSessionDuration,
        timezone: newSettings.timezone,
        client_source2: newSettings.clientSource2 || null,
        client_source3: newSettings.clientSource3 || null,
        client_source4: newSettings.clientSource4 || null,
      };

      const { error: updateDbError } = await supabase
        .from('users')
        .update(payload)
        .eq('id', authUser.id);

      if (updateDbError) {
        // Если записи нет или ошибка обновления — пробуем upsert по id
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({ id: authUser.id, email: authUser.email || null, ...payload }, { onConflict: 'id' } as any);
        if (upsertError) {
          throw upsertError;
        }
      }

      console.log('Рабочие настройки успешно сохранены.');
    } catch (e) {
      console.error('Ошибка сохранения рабочих настроек:', e);
      alert((e as Error).message || 'Не удалось сохранить рабочие настройки.');
      // Откатываем UI к предыдущему состоянию
      setWorkSettings(prevSettings);
      throw e;
    }
  };

  // Состояние загрузки для сохранения профиля
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Функция для обновления профиля: сохраняем только имя в user_metadata
  const handleUpdateProfile = async (data: { full_name?: string }) => {
    try {
      setSavingProfile(true);
      const payload: any = { data: {} };
      if (typeof data.full_name !== 'undefined') {
        payload.data.full_name = (data.full_name ?? '').toString();
      }

      const { error } = await supabase.auth.updateUser(payload);
      if (error) {
        throw error;
      }

      // Дополнительно сохраняем имя в таблице public.users (поле name)
      const newName = (data.full_name ?? '').toString();

      // Убедимся, что запись пользователя существует
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .limit(1);

        const exists = Array.isArray(existingUser) ? existingUser.length > 0 : !!existingUser;
        if (!exists) {
          // Попробуем создать через RPC, если доступно
          const { error: rpcError } = await supabase.rpc('ensure_user_exists', {
            uid: authUser.id,
            uemail: authUser.email || null,
          } as any);
          if (rpcError) {
            console.warn('RPC ensure_user_exists не выполнен:', rpcError.message || rpcError);
          }
        }
      } catch (ensureErr) {
        console.warn('Не удалось убедиться в наличии записи пользователя:', ensureErr);
      }

      // Обновляем имя
      const { error: updateDbError } = await supabase
        .from('users')
        .update({ name: newName })
        .eq('id', authUser.id);

      if (updateDbError) {
        // Если записи нет, попробуем upsert
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({ id: authUser.id, email: authUser.email || null, name: newName }, { onConflict: 'id' } as any);
        if (upsertError) {
          throw upsertError;
        }
      }
      // Успех: уведомляем остальные компоненты и обновляем local state
      window.dispatchEvent(new CustomEvent('user-display-name-updated', { detail: { name: newName } }));
      setDbUserName(newName);
    } catch (e) {
      console.error('Ошибка сохранения профиля:', e);
      alert((e as Error).message || 'Не удалось сохранить профиль.');
      throw e; // чтобы форма не закрывалась, если нужно отреагировать в вызывающем коде
    } finally {
      setSavingProfile(false);
    }
  };

  // Загрузка имени из public.users при открытии экрана
  React.useEffect(() => {
    const loadName = async () => {
      if (!authUser) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('id', authUser.id)
          .single();
        if (error) {
          const fallback = (authUser.user_metadata as any)?.full_name || authUser.email?.split('@')[0] || '';
          setDbUserName(fallback);
          return;
        }
        setDbUserName(((data as any)?.name) || (authUser.user_metadata as any)?.full_name || authUser.email?.split('@')[0] || '');
      } catch {
        const fallback = (authUser.user_metadata as any)?.full_name || authUser.email?.split('@')[0] || '';
        setDbUserName(fallback);
      }
    };
    loadName();
  }, [authUser]);

  // Загрузка рабочих настроек из public.users при открытии экрана
  React.useEffect(() => {
    const loadWorkSettings = async () => {
      if (!authUser) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('default_session_price, default_session_duration, timezone, client_source2, client_source3, client_source4')
          .eq('id', authUser.id)
          .single();

        if (error || !data) {
          // Оставляем значения по умолчанию
          console.warn('Не удалось загрузить рабочие настройки, используются значения по умолчанию:', error);
          return;
        }

        const loaded: WorkSettingsData = {
          defaultSessionPrice: (data as any)?.default_session_price ?? 5000,
          defaultSessionDuration: (data as any)?.default_session_duration ?? 50,
          timezone: (data as any)?.timezone ?? 'Europe/Moscow',
          clientSource2: (data as any)?.client_source2 ?? undefined,
          clientSource3: (data as any)?.client_source3 ?? undefined,
          clientSource4: (data as any)?.client_source4 ?? undefined,
        };
        setWorkSettings(loaded);
      } catch (e) {
        console.warn('Ошибка загрузки рабочих настроек, используются значения по умолчанию:', e);
      }
    };
    loadWorkSettings();
  }, [authUser]);

  return (
    <div className="screen-container">
      {/* Заголовок перенесён в общий хедер макета */}

      {/* Компонент профиля */}
      <UserProfile
        user={authUser}
        initialName={dbUserName}
        onUpdateProfile={handleUpdateProfile}
        loading={savingProfile}
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

      {/* Блок шифрования заметок удалён как избыточный */}

      {/* --- НОВОЕ: Компонент удаления аккаунта --- */}
      <AccountDeletionSection userId={authUser.id} />

      {/* Кнопка выхода из аккаунта внизу экрана настроек */}
      <div className="mt-8">
        <Button
          type="button"
          variant="primary"
          className="w-full relative z-20"
          onClick={async () => {
            try {
              await signOut();
              window.location.href = '/auth';
            } catch (e) {
              console.error('Ошибка выхода из аккаунта:', e);
            }
          }}
          onTouchStart={async () => {
            try {
              await signOut();
              window.location.href = '/auth';
            } catch (e) {
              console.error('Ошибка выхода из аккаунта (touch):', e);
            }
          }}
          onPointerUp={async () => {
            try {
              await signOut();
              window.location.href = '/auth';
            } catch (e) {
              console.error('Ошибка выхода из аккаунта (pointer):', e);
            }
          }}
          aria-label="Выйти из аккаунта"
        >
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
};

export default SettingsScreen;
