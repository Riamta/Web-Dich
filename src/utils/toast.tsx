import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdClose, MdCheckCircle, MdError, MdInfo } from 'react-icons/md';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'loading';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface ToastState extends ToastProps {
  id: number;
}

let toastCount = 0;
const toasts: ToastState[] = [];
let subscribers: ((toasts: ToastState[]) => void)[] = [];

const defaultConfig = {
  duration: 3000,
  position: 'bottom-right' as const
};

// Helper functions for different toast types
const createToast = (message: string, type: ToastProps['type'], options?: Partial<ToastProps>) => {
  return notify({
    message,
    type,
    ...defaultConfig,
    ...options
  });
};

const success = (message: string, options?: Partial<ToastProps>) => createToast(message, 'success', options);
const error = (message: string, options?: Partial<ToastProps>) => createToast(message, 'error', options);
const info = (message: string, options?: Partial<ToastProps>) => createToast(message, 'info', options);
const loading = (message: string, options?: Partial<ToastProps>) => createToast(message, 'loading', { ...options, duration: 0 });

const notify = (props: ToastProps) => {
  const id = toastCount++;
  const toast = { ...props, id };
  toasts.push(toast);
  subscribers.forEach(subscriber => subscriber([...toasts]));

  if (props.duration && props.duration > 0) {
    setTimeout(() => removeToast(id), props.duration);
  }

  return id;
};

const removeToast = (id: number) => {
  const index = toasts.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    subscribers.forEach(subscriber => subscriber([...toasts]));
  }
};

const useToast = () => {
  const [currentToasts, setCurrentToasts] = useState<ToastState[]>(toasts);

  useEffect(() => {
    subscribers.push(setCurrentToasts);
    return () => {
      subscribers = subscribers.filter(subscriber => subscriber !== setCurrentToasts);
    };
  }, []);

  return {
    notify,
    removeToast,
    success,
    error,
    info,
    loading,
    toasts: currentToasts,
  };
};

const Toast = ({ message, type = 'info', position = 'bottom-right', id }: ToastProps & { id: number }) => {
  const bgColor = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    loading: 'bg-blue-500',
  }[type];

  const Icon = {
    info: MdInfo,
    success: MdCheckCircle,
    error: MdError,
    loading: () => (
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    ),
  }[type];

  const positionClass = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }[position];

  return (
    <div 
      className={`fixed ${positionClass} z-50 animate-toast-slide-in`}
      style={{ 
        animationFillMode: 'forwards',
        animationDuration: '0.3s',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="flex-grow">{message}</span>
        {type !== 'loading' && (
          <button 
            onClick={() => removeToast(id)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <MdClose className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts } = useToast();
  
  if (typeof window === 'undefined') return null;

  return createPortal(
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} id={toast.id} />
      ))}
    </>,
    document.body
  );
};

export { useToast, ToastContainer, type ToastProps }; 