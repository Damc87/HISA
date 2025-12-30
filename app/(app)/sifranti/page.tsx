import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Users, Wallet } from "lucide-react";

export default function SifrantiPage() {
  const items = [
    {
      href: "/phases",
      title: "Faze in podfaze",
      description: "Urejanje šifranta faz gradnje in podfaz za izbrane projekte.",
      icon: Layers,
    },
    {
      href: "/contractors",
      title: "Izvajalci",
      description: "Dodajanje izvajalcev, kontaktov in povezovanje s projekti.",
      icon: Users,
    },
    {
      href: "/costs",
      title: "Stroški",
      description: "Upravljanje stroškov, tipov in statusov z možnostjo uvoza/izvoza.",
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">Šifranti in katalogi</p>
        <h1 className="text-2xl font-semibold">Šifranti</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-2">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Icon className="h-5 w-5 text-blue-700" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">{item.description}</CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
