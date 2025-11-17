import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';

const signupSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  confirmPassword: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
});

const signupSchemaWithPasswordValidation = signupSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  }
);

type SignupFormData = z.infer<typeof signupSchemaWithPasswordValidation>;

interface SignupFormProps {
  onSignupSuccess: () => void;
  onSwitchToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSignupSuccess, onSwitchToLogin }) => {
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchemaWithPasswordValidation),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setError(null);
      setLoading(true);
      await signUp(data.email, data.password);
      onSignupSuccess();
    } catch (err: any) {
      setError(err.message || 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Создайте аккаунт
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="first-name" className="sr-only">
                Имя
              </label>
              <input
                id="first-name"
                type="text"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Имя"
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="last-name" className="sr-only">
                Фамилия
              </label>
              <input
                id="last-name"
                type="text"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Фамилия"
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email адрес
              </label>
              <input
                id="email-address"
                type="email"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-50 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Email адрес"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Пароль"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Подтвердите пароль
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-50 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Подтвердите пароль"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="signup-show-password"
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="signup-show-password" className="text-sm text-gray-700">
                Показать пароль
              </label>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="w-full btn-primary py-2 px-4 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Зарегистрироваться
            </Button>
          </div>
        </form>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
