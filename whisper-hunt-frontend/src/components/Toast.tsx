"use client";

import React, { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: "check_circle",
    error: "error",
    info: "info"
  };

  const colors = {
    success: "text-tertiary-container border-tertiary-container/20 bg-surface-container-highest/80",
    error: "text-error border-error/20 bg-surface-container-highest/80",
    info: "text-primary-container border-primary-container/20 bg-surface-container-highest/80"
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-4 px-6 py-4 rounded-xl border backdrop-blur-xl transition-all duration-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${colors[type]}`}>
      <span className="material-symbols-outlined">{icons[type]}</span>
      <span className="font-headline text-xs font-bold uppercase tracking-widest">{message}</span>
      <button onClick={() => setIsVisible(false)} className="ml-4 opacity-40 hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return { toast, showToast, hideToast };
}
