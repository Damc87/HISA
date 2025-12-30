"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type ToastVariant = "default" | "success" | "error";

type Toast = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (toast: Toast) => void;
};

type ToastWithId = Toast & { id: number };

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);

  const toast = ({ title, description, variant = "default" }: Toast) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [
      ...current,
      {
        id,
        title,
        description,
        variant,
      },
    ]);

    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);
  };

  const variantClasses: Record<ToastVariant, string> = useMemo(
    () => ({
      default: "border border-slate-200 bg-white text-slate-900 shadow-sm",
      success:
        "border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm",
      error: "border border-red-200 bg-red-50 text-red-900 shadow-sm",
    }),
    [],
  );

  const icon: Record<ToastVariant, string> = {
    default: "ℹ️",
    success: "✅",
    error: "⚠️",
  };

  return (
    <>
      <ToastContext.Provider value={{ toast }}>{children}</ToastContext.Provider>
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-2 p-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-sm rounded-lg px-4 py-3 ${variantClasses[toast.variant ?? "default"]}`}
          >
            <div className="flex items-start gap-3">
              <span aria-hidden>{icon[toast.variant ?? "default"]}</span>
              <div className="flex-1">
                <p className="font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="text-sm text-slate-600">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="text-sm text-slate-500 transition hover:text-slate-700"
                aria-label="Close"
                onClick={() =>
                  setToasts((current) =>
                    current.filter((item) => item.id !== toast.id),
                  )
                }
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
