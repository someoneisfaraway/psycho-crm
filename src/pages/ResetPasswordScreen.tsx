import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Button } from '../components/ui/Button';

const ResetPasswordScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean>(false);

  useEffect(() => {
    // Detect that we have a session created by the recovery link
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(!!data.session);
    }).catch(() => setHasRecoverySession(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!hasRecoverySession) {
      setError('Ссылка для восстановления недействительна. Перейдите в приложение по ссылке из письма.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Пароль должен быть не менее 8 символов.');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают.');
      return;
    }

    try {
      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Не удалось обновить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Сброс пароля</h1>
          <p className="mt-2 text-sm text-gray-600">
            Введите новый пароль. Ссылка из письма должна вести на эту страницу.
          </p>
        </div>

        {!hasRecoverySession && (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
            Похоже, вы попали сюда напрямую. Откройте эту страницу по ссылке из письма для восстановления.
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              Пароль успешно обновлён. Теперь вы можете войти в аккаунт.
            </div>
            <a href="/auth" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              Вернуться ко входу
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Новый пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Минимум 8 символов"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Подтверждение пароля</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <Button type="submit" fullWidth loading={loading} className="bg-indigo-600 hover:bg-indigo-700">
              Обновить пароль
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordScreen;

