import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  Shield,
  Key,
  Wallet,
  RotateCcw,
  PlusCircle,
  LogOut,
  Sparkles,
  CheckCircle2,
  Calendar,
  Camera,
  Upload,
  Link,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Currency } from '../types/crypto';

interface ProfileViewProps {
  currency: Currency;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currency }) => {
  const { user, firebaseUser, updateProfile, resetBalance, depositBalance, logout, addToast } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [customUrl, setCustomUrl] = useState('');
  const [password, setPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=250&q=80',
  ];

  // Helper to process, compress and resize uploaded image to lightweight data URL
  const processAndSetImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast('error', 'Ошибка формата', 'Пожалуйста, выберите изображение (PNG, JPG, WEBP, GIF)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize onto a square canvas for crisp, fast-loading avatars
        const canvas = document.createElement('canvas');
        const maxSize = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatar(compressedDataUrl);
          addToast('success', 'Фото загружено', 'Аватар обновлен! Нажмите «Сохранить изменения»');
        }
      };
      img.onerror = () => {
        addToast('error', 'Ошибка чтения', 'Не удалось обработать выбранный файл');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndSetImage(file);
    }
    // reset input so the same file can be picked again if needed
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndSetImage(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    try {
      new URL(customUrl.trim());
      setAvatar(customUrl.trim());
      setCustomUrl('');
      addToast('success', 'Ссылка применена', 'Аватар обновлен. Нажмите «Сохранить изменения»');
    } catch {
      addToast('error', 'Неверный URL', 'Пожалуйста, введите корректную ссылку на изображение');
    }
  };

  const handleResetToDefault = () => {
    const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user?.email || 'trader')}`;
    setAvatar(defaultAvatar);
    addToast('info', 'Сброс аватара', 'Установлен стандартный сгенерированный аватар');
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateProfile(name, avatar, password || undefined);
      setPassword('');
    } catch {
      // Error handled in context
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden file picker input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
        className="hidden"
      />

      {/* Profile Header Card */}
      <div className="p-6 bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Interactive Avatar Area with Camera Overlay & Drag-Drop */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${
            isDragging ? 'ring-4 ring-[#F0B90B] scale-105' : 'hover:scale-[1.02]'
          }`}
          title="Нажмите или перетащите фото сюда для смены аватарки"
        >
          <img
            src={avatar || user?.avatar || avatarPresets[0]}
            alt={user?.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[#F0B90B] shadow-lg shadow-[#F0B90B]/10 group-hover:brightness-75 transition-all"
            onError={(e) => {
              (e.target as HTMLImageElement).src = avatarPresets[0];
            }}
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1">
            <Camera className="w-6 h-6 text-[#F0B90B]" />
            <span className="text-[10px] font-bold tracking-tight uppercase">Сменить фото</span>
          </div>

          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#0ECB81] text-black font-extrabold text-[10px] uppercase shadow-md">
            LIVE
          </span>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">{user?.name}</h2>
            <span className="px-2 py-0.5 rounded bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30 text-xs font-bold">
              PRO TRADER
            </span>
          </div>
          <p className="text-xs text-[#848E9C] mb-3">{user?.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#848E9C]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#F0B90B]" />
              В клубе с: <strong className="text-white">{formattedDate}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#0ECB81]" />
              Хранилище: <strong className="text-[#0ECB81]">{firebaseUser ? 'Cloud Firestore (Firebase)' : 'Локальный демо-счет'}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-[#2B313A] hover:bg-[#F6465D]/20 text-[#848E9C] hover:text-[#F6465D] border border-[#2B313A] hover:border-[#F6465D]/40 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer self-center sm:self-start"
        >
          <LogOut className="w-4 h-4" />
          <span>Выйти</span>
        </button>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details & Avatar Management Form */}
        <div className="p-6 bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#F0B90B]" />
            Личные данные и аватарка
          </h3>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Имя в терминале
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0E1114] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Email адрес (привязан к базе данных)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-[#0E1114]/50 text-[#848E9C] text-xs px-3.5 py-2.5 rounded-xl border border-[#2B313A] cursor-not-allowed"
              />
            </div>

            {/* Custom Avatar Upload Section */}
            <div className="p-4 bg-[#14151A] rounded-xl border border-[#2B313A] space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#F0B90B]" />
                  Фото профиля (Аватарка)
                </label>
                {avatar && (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-[11px] text-[#848E9C] hover:text-[#F6465D] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Сбросить на сгенерированный аватар"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Сбросить</span>
                  </button>
                )}
              </div>

              {/* Upload Button & Drag & Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-3.5 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                  isDragging
                    ? 'border-[#F0B90B] bg-[#F0B90B]/10'
                    : 'border-[#2B313A] hover:border-[#F0B90B]/60 bg-[#0B0E11]'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#1E2329] flex items-center justify-center text-[#F0B90B] mb-1.5">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">
                  Нажмите, чтобы загрузить свое фото
                </span>
                <span className="text-[11px] text-[#848E9C] mt-0.5">
                  или перетащите файл сюда (PNG, JPG, WebP)
                </span>
              </div>

              {/* Or paste image URL */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-[#848E9C] block">
                  Или вставьте прямую ссылку на фото:
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#848E9C]" />
                    <input
                      type="url"
                      placeholder="https://example.com/my-photo.jpg"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="w-full bg-[#0B0E11] text-white text-xs pl-8 pr-3 py-2 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-3 py-2 rounded-xl bg-[#2B313A] hover:bg-[#363D47] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Применить
                  </button>
                </div>
              </div>

              {/* Preset avatars selection */}
              <div>
                <span className="text-[11px] text-[#848E9C] block mb-1.5">
                  Или выберите готовую аватарку:
                </span>
                <div className="flex items-center gap-2.5">
                  {avatarPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatar(preset);
                        addToast('info', 'Выбран пресет', 'Аватар выбран! Нажмите «Сохранить изменения»');
                      }}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-transform cursor-pointer ${
                        avatar === preset ? 'border-[#F0B90B] scale-110 shadow-md shadow-[#F0B90B]/20' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                Новый пароль (оставьте пустым, если не меняете)
              </label>
              <input
                type="password"
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0E1114] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-3 rounded-xl bg-[#F0B90B] hover:bg-[#FCD535] text-black font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-[#F0B90B]/20 disabled:opacity-50"
            >
              {isUpdating ? 'Сохранение...' : 'Сохранить изменения профиля'}
            </button>
          </form>
        </div>

        {/* Virtual Balance Management */}
        <div className="p-6 bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#F0B90B]" />
              Виртуальные счета
            </h3>

            <div className="space-y-3 mb-6">
              <div className="p-4 bg-[#0E1114] rounded-xl border border-[#2B313A] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#848E9C] block">Счет в долларах (USD)</span>
                  <div className="text-xl font-black font-mono-num text-[#0ECB81]">
                    ${(user?.balances.USD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <button
                  onClick={() => depositBalance(10000, 'USD')}
                  className="px-3 py-1.5 rounded-lg bg-[#2B313A] hover:bg-[#363D47] text-[#0ECB81] font-bold text-xs cursor-pointer"
                >
                  + $10,000
                </button>
              </div>

              <div className="p-4 bg-[#0E1114] rounded-xl border border-[#2B313A] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#848E9C] block">Счет в рублях (RUB)</span>
                  <div className="text-xl font-black font-mono-num text-[#F0B90B]">
                    {(user?.balances.RUB || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                  </div>
                </div>
                <button
                  onClick={() => depositBalance(1000000, 'RUB')}
                  className="px-3 py-1.5 rounded-lg bg-[#2B313A] hover:bg-[#363D47] text-[#F0B90B] font-bold text-xs cursor-pointer"
                >
                  + 1,000,000 ₽
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#2B313A]/30 border border-[#2B313A] text-xs text-[#848E9C] leading-relaxed">
              <span className="font-semibold text-white block mb-1">
                Учебный регламент симулятора:
              </span>
              Все транзакции исполняются по котировкам реального рынка Binance, но не несут финансовых рисков. Вся прибыль и убытки виртуальны.
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#2B313A]">
            <button
              onClick={resetBalance}
              className="w-full py-2.5 rounded-xl bg-[#F6465D]/15 hover:bg-[#F6465D]/25 text-[#F6465D] border border-[#F6465D]/30 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить демо-счет до начальных $50,000 / 4,500,000 ₽</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
