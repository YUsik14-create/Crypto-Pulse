import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { NotificationToast } from '../types/user';

interface ToastProps {
  toasts: NotificationToast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-start gap-3 backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
              isSuccess
                ? 'bg-[#181A20]/95 border-[#0ECB81]/40 text-[#EAECEF]'
                : isError
                ? 'bg-[#181A20]/95 border-[#F6465D]/40 text-[#EAECEF]'
                : 'bg-[#181A20]/95 border-[#F0B90B]/40 text-[#EAECEF]'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#0ECB81]" />}
              {isError && <AlertCircle className="w-5 h-5 text-[#F6465D]" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-[#F0B90B]" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white tracking-wide">{toast.title}</h4>
              <p className="text-xs text-[#848E9C] mt-0.5 break-words">{toast.message}</p>
            </div>

            <button
              onClick={() => onRemove(toast.id)}
              className="text-[#848E9C] hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
