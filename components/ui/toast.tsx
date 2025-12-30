"use client";

import { createContext, ReactNode, useContext } from "react";
import { Toaster, toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "success" | "error";

type Toast = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (toast: Toast) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = ({ title, description, variant = "default" }: Toast) => {
    const options = { description, duration: 4500 };
    if (variant === "success") {
      sonnerToast.success(title, options);
    } else if (variant === "error") {
      sonnerToast.error(title, options);
    } else {
      sonnerToast(title, options);
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster position="top-right" richColors closeButton expand duration={4500} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
