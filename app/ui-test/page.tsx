import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const sampleRows = [
  { name: "Beton", quantity: "12 m³", price: "€1.200" },
  { name: "Opeka", quantity: "2.400 kos", price: "€1.050" },
  { name: "Izvajalec A", quantity: "15 h", price: "€750" },
];

export default function UITestPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Preizkus UI</p>
          <h1 className="text-3xl font-semibold tracking-tight">Shadcn/Tailwind</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Sekundarni gumb</Button>
          <Button>Primarni gumb</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Stroški</CardTitle>
            <CardDescription>Izvedba v teku</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold">€12.450</p>
              <p className="text-sm text-muted-foreground">Skupaj od začetka projekta</p>
            </div>
            <Badge variant="secondary">+4,8%</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumenti</CardTitle>
            <CardDescription>Naloženi PDF</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold">34</p>
              <p className="text-sm text-muted-foreground">Računi in situacije</p>
            </div>
            <Badge>Potrjeno</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Izvajalci</CardTitle>
            <CardDescription>Aktivni partnerji</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold">8</p>
              <p className="text-sm text-muted-foreground">Vključeni v projekt</p>
            </div>
            <Badge variant="outline">2 novi</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabela materialov</CardTitle>
          <CardDescription>Preverite, ali tabela izgleda pravilno</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Postavka</TableHead>
                  <TableHead>Količina</TableHead>
                  <TableHead className="text-right">Cena</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleRows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell className="text-right">{row.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
