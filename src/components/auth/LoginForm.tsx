import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { unlockWithPassword } from '../../utils/encryption';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onLoginSuccess: () => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onLoginSuccess, 
 onSwitchToSignup, 
  onForgotPassword 
}) => {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setLoading(true);
      const result = await signIn(data.email, data.password);
      try {
        const userId = result?.user?.id;
        if (userId) {
          await unlockWithPassword(userId, data.password);
        }
      } catch {}
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-neutral-600">
            Войдите в ваш аккаунт психолога
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-lg bg-error-50 border border-error-200 p-4">
              <div className="text-sm text-error-700">{error}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-neutral-700 mb-2">
                Email адрес
              </label>
              <input
                id="email-address"
                type="email"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.email ? 'border-error-300' : 'border-neutral-300'
                }`}
                placeholder="Введите ваш email"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Пароль
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.password ? 'border-error-300' : 'border-neutral-300'
                }`}
                placeholder="Введите ваш пароль"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="show-password"
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-neutral-300 rounded"
                />
                <label htmlFor="show-password" className="text-sm text-neutral-700">
                  Показать пароль
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={onForgotPassword}
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Забыли пароль?
              </button>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="w-full btn-primary py-2 px-4 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Войти
            </Button>
          </div>
        </form>
        <div className="text-center mt-6">
          <p className="text-sm text-neutral-600">
            Нет аккаунта?{' '}
            <button
              onClick={onSwitchToSignup}
              className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Зарегистрироваться
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
