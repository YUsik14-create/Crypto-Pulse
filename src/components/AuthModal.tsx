import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
}) => {
  if (!isOpen) return null;

  const { login, register, loginDemo, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка входа через Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Укажите ваше имя или никнейм');
        }
        await register(name, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при аутентификации');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginDemo();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl bg-[#2B313A] hover:bg-[#363D47] text-[#848E9C] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F0B90B]/15 border border-[#F0B90B]/30 flex items-center justify-center text-[#F0B90B] mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">
            {tab === 'login' ? 'Вход в CryptoPulse' : 'Создать торговый аккаунт'}
          </h2>
          <p className="text-xs text-[#848E9C] mt-1">
            {tab === 'login'
              ? 'Управляйте портфелем с безопасной авторизацией Firebase'
              : 'Получите бесплатные $50,000 USD и 4,500,000 ₽ на баланс'}
          </p>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mb-3 py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          {/* Google SVG Logo */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Продолжить с Google (Firebase Auth)</span>
        </button>

        {/* Quick Demo Login button */}
        <button
          type="button"
          onClick={handleDemoClick}
          disabled={loading}
          className="w-full mb-4 py-2.5 px-4 rounded-xl bg-[#F0B90B]/15 hover:bg-[#F0B90B]/25 border border-[#F0B90B]/40 text-[#F0B90B] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-[#F0B90B] group-hover:rotate-12 transition-transform" />
          <span>Быстрый демо-режим (без регистрации)</span>
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-[#2B313A]"></div>
          <span className="flex-shrink mx-3 text-[11px] text-[#5E6673] uppercase tracking-wider">
            или через Email / Пароль
          </span>
          <div className="flex-grow border-t border-[#2B313A]"></div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#0E1114] p-1 rounded-xl border border-[#2B313A] mb-4">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-[#F0B90B] text-black shadow-md'
                : 'text-[#848E9C] hover:text-white'
            }`}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-[#F0B90B] text-black shadow-md'
                : 'text-[#848E9C] hover:text-white'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-[#F6465D]/15 border border-[#F6465D]/40 rounded-xl text-xs text-[#F6465D] font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Имя или никнейм
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#848E9C]" />
                <input
                  type="text"
                  required
                  placeholder="Иван Петров"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0E1114] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Электронная почта
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#848E9C]" />
              <input
                type="email"
                required
                placeholder="trader@cryptopulse.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0E1114] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
              Пароль {tab === 'register' && '(минимум 6 символов)'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#848E9C]" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0E1114] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-[#F0B90B] hover:bg-[#FCD535] text-black font-extrabold text-xs transition-all cursor-pointer shadow-lg shadow-[#F0B90B]/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Обработка...</span>
            ) : (
              <>
                <span>{tab === 'login' ? 'Войти в терминал' : 'Создать аккаунт и получить баланс'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security badge footer */}
        <div className="mt-4 pt-3 border-t border-[#2B313A] flex items-center justify-center gap-1.5 text-[11px] text-[#5E6673]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0ECB81]" />
          <span>Данные портфеля защищены Cloud Firestore и Firebase Auth.</span>
        </div>
      </div>
    </div>
  );
};
