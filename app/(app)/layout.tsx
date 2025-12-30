import Link from "next/link";
import { ReactNode } from "react";
import { LayoutDashboard, Wallet, Layers, Users, FileText, Settings, BookOpen } from "lucide-react";
import { ProjectProvider } from "@/components/project-provider";
import { ProjectSwitcher } from "@/components/project-switcher";
import { ToastProvider } from "@/components/ui/toast";
import { GlobalSearch } from "@/components/global-search";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/costs", label: "Stroški", icon: Wallet },
  { href: "/phases", label: "Faze", icon: Layers },
  { href: "/contractors", label: "Izvajalci", icon: Users },
  { href: "/documents", label: "Dokumenti", icon: FileText },
  { href: "/settings", label: "Nastavitve projekta", icon: Settings },
  { href: "/sifranti", label: "Šifranti", icon: BookOpen },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ProjectProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
            <aside className="hidden border-r border-slate-200 bg-white/80 backdrop-blur md:block">
              <div className="p-6">
                <div className="text-lg font-semibold text-slate-900">Gradnja – stroški</div>
                <p className="text-sm text-slate-600">Nadzorna plošča projektov</p>
              </div>
              <nav className="space-y-1 px-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="px-6 py-4">
                <div className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
                  Nasvet: dodajte nove projekte in faze v razdelku »Šifranti«.
                </div>
              </div>
            </aside>

            <main className="flex flex-col">
              <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
                <div className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Projekt</p>
                    <ProjectSwitcher />
                  </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                    Lokalni arhiv računov
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                    V realnem času
                  </span>
                  <GlobalSearch />
                </div>
              </div>
                <div className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </header>
              <div className="p-4 md:p-6 lg:p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ProjectProvider>
    </ToastProvider>
  );
}
