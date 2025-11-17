import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';

const forgotPasswordSchema = z.object({
  email: z.string().email('Некорректный email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
 onEmailSent: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ 
  onBackToLogin, 
  onEmailSent 
}) => {
  const { forgotPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Restore cooldown from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem('forgotCooldownUntil');
    if (raw) {
      const until = parseInt(raw, 10);
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
      } else {
        localStorage.removeItem('forgotCooldownUntil');
      }
    }
  }, []);

  // Tick down the cooldown every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem('forgotCooldownUntil');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError(null);
      if (cooldown > 0) {
        setError(`Пожалуйста, подождите ${cooldown} секунд перед повторной отправкой письма.`);
        return;
      }
      setLoading(true);
      await forgotPassword(data.email);
      setEmailSent(true);
      onEmailSent();
    } catch (err: any) {
      console.error('ForgotPasswordForm submit error:', err);
      const message = err?.message || 'Не удалось отправить письмо для сброса пароля';
      // Handle Supabase throttling: "email rate limit exceeded"
      if (typeof message === 'string' && /rate limit/i.test(message)) {
        const seconds = 60; // typical Supabase throttle window
        const until = Date.now() + seconds * 1000;
        localStorage.setItem('forgotCooldownUntil', String(until));
        setCooldown(seconds);
        setError(`Слишком много запросов. Попробуйте через ${seconds} секунд.`);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Забыли пароль?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Введите email, и мы отправим ссылку для сброса пароля.
          </p>
        </div>
        
        {emailSent ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">
              Инструкции по сбросу пароля отправлены на ваш email.
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email адрес
                </label>
                <input
                  id="email-address"
                  type="email"
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-50 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Email адрес"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading || cooldown > 0}
                className="w-full btn-primary py-2 px-4 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {cooldown > 0 ? `Повторить через ${cooldown}с` : 'Отправить ссылку для сброса'}
              </Button>
            </div>
          </form>
        )}
        
        <div className="text-center mt-4">
          <button
            onClick={onBackToLogin}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Назад к входу
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
