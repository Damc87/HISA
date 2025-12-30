"use client";

import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastVariant = "default" | "success" | "error";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex min-w-[260px] items-start gap-3 rounded-2xl border bg-white/80 p-4 shadow-lg backdrop-blur",
              t.variant === "success" && "border-emerald-200",
              t.variant === "error" && "border-rose-200"
            )}
          >
            <div className="mt-0.5">
              {t.variant === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : t.variant === "error" ? (
                <TriangleAlert className="h-5 w-5 text-rose-600" />
              ) : (
                <Info className="h-5 w-5 text-slate-500" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              {t.description ? <p className="text-xs text-slate-600">{t.description}</p> : null}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="ml-auto text-slate-400 transition hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
