import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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

const notify = (props: ToastProps) => {
  const id = toastCount++;
  const toast = { ...props, id };
  toasts.push(toast);
  subscribers.forEach(subscriber => subscriber([...toasts]));

  if (props.duration && props.duration > 0) {
    setTimeout(() => {
      const index = toasts.findIndex(t => t.id === id);
      if (index > -1) {
        toasts.splice(index, 1);
        subscribers.forEach(subscriber => subscriber([...toasts]));
      }
    }, props.duration);
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
    toasts: currentToasts,
  };
};

const Toast = ({ message, type = 'info', position = 'bottom-right' }: ToastProps) => {
  const bgColor = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    loading: 'bg-blue-500',
  }[type];

  const positionClass = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }[position];

  return (
    <div className={`fixed ${positionClass} z-50`}>
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
        {type === 'loading' && (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span>{message}</span>
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
        <Toast key={toast.id} {...toast} />
      ))}
    </>,
    document.body
  );
};

export { useToast, ToastContainer, type ToastProps }; 