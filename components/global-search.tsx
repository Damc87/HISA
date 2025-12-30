"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function GlobalSearch() {
  const router = useRouter();
  const [term, setTerm] = useState("");

  const runSearch = () => {
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    router.push(`/costs?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1">
      <Search className="h-4 w-4 text-slate-500" />
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && runSearch()}
        placeholder="Globalno iskanje stroškov"
        className="h-8 w-48 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
      />
      <Button size="sm" variant="ghost" onClick={runSearch}>
        Poišči
      </Button>
    </div>
  );
}
