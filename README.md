# Gradnja – stroški

Sodobna Next.js aplikacija za spremljanje stroškov gradnje enodružinske hiše z več projekti, grafi in arhivom PDF računov.

## Tehnologije
- Next.js (App Router) + TypeScript
- Tailwind CSS in shadcn-navdihnjene komponente
- Prisma ORM s SQLite
- recharts za vizualizacije
- lucide-react ikone

## Namestitev in zagon
1. Namestite odvisnosti:
   ```bash
   npm install
   ```
2. Zaženite migracije in generiranje klienta:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```
3. Napolnite bazo z osnovnimi podatki:
   ```bash
   npx prisma db seed
   ```
4. Zaženite razvojni strežnik:
   ```bash
   npm run dev
   ```

Aplikacija bo dosegljiva na `http://localhost:3000`.

### Namizni način (Electron)
- Zagon v razvoju (Next + Electron okno): `npm run electron`
- Produkcijski installer (.exe): `npm run electron:build` (ustvari `dist/Gradnja - stroški Setup*.exe`)
- V namizni aplikaciji se SQLite baza in naloženi PDF shranjujejo v uporabniško mapo (brez ročnih nastavitev ali spremenljivk okolja):
  - Baza: `appData/gradnja-stroski/data/app.db` (npr. `%APPDATA%\\gradnja-stroski\\data\\app.db` na Windows)
  - Uploads: `appData/gradnja-stroski/uploads`
  - Do datotek se dostopa tudi v paketirani aplikaciji (.exe)

### Windows
- Zahteve: Node.js in npm.
- Ukazi:
  ```powershell
  npm install
  npm run electron
  ```
- Ni treba ustvarjati map ali nastavljati spremenljivk okolja – aplikacija sama izračuna in pripravi poti za bazo ter `uploads`. Ob zagonu v konzolo izpiše uporabljene poti (v razvojni različici) za lažje razhroščevanje.

## Struktura podatkov
Modeli (Prisma/SQLite): `Project`, `Contractor`, `Phase`, `Subphase`, `CostItem`, `Document`.
- `CostItem` vsebuje polja za datume, faze, izvajalca, količine, cene brez/z DDV, tip (material/delo/stroj/prevoz/ostalo), status (planirano/potrjeno/plačano), plačilne podatke in povezavo na dokument.
- `Document` hrani PDF račune z metapodatki, povezavo na projekt/fazo/izvajalca ter se veže na stroške preko polja `documentId`.

## Strani v aplikaciji
- **Dashboard**: kazalniki, grafi po fazah/izvajalcih, struktura stroškov, kumulativa in zapadli stroški.
- **Stroški**: tabela s filtri, dodajanje/urejanje/brisanje, izračun cena z DDV, uvoz/izvoz CSV ter nalaganje PDF računa direktno ob vnosu.
- **Faze**: šifrant faz in podfaz (prednastavljen nabor faz gradnje enodružinske hiše).
- **Izvajalci**: katalog izvajalcev za posamezni projekt.
- **Dokumenti**: seznam PDF računov z možnostjo filtriranja in skoka na strošek.
- **Nastavitve projekta**: neto/bruto m2, volumen m3 in izbira primarnega kazalnika.
- **Šifranti**: hiter dostop do upravljanja kataloga.

## Uvoz/izvoz CSV
- Izvoz: gumb **Izvoz v CSV** na strani *Stroški* (`/api/costs/export`).
- Uvoz: gumb **Uvoz CSV** na strani *Stroški* sprejme stolpce:
  `datum,opis,kolicina,enota,cenaBrezDDV,ddvStopnja,cenaZDDV,tip,status,faza,podfaza,izvajalec,nacinPlacila,stevilkaRacuna,datumRacuna,datumZapadlosti,opombe`.
  Ob uvozu se faze in izvajalci mapirajo po imenu, morebitni manjkajoči izvajalci se ustvarijo, napake se vrnejo v JSON poročilu.

## Izvoz PDF poročila
- Poročilo po fazah (brez prilog) je na `/api/reports/phases?projectId=ID` in dostopno z gumba v vmesniku.

## Nalaganje dokumentov
- PDF datoteke se shranjujejo v mapo `uploads` znotraj uporabniškega podatkovnega imenika aplikacije (npr. `%APPDATA%\\gradnja-stroski\\uploads` na Windows); mapo ob prvem zagonu ustvari aplikacija.
- Ob nalaganju se meta podatki zapišejo v bazo in dokument se poveže s stroškom, da ga je mogoče odpreti iz tabele stroškov.

## Seed podatki
`prisma/seed.ts` pripravi vzorčni projekt **“Enodružinska hiša – primer”**, osnovne faze, nekaj izvajalcev in stroškov z računom, da so grafi takoj vidni. Vključen je tudi prazen projekt za ročni vnos.

## Razvoj
- Konfiguracija Tailwind je v `tailwind.config.ts`, globalni slog v `app/globals.css`.
- API končnice so pod `app/api/*`, uporabniški vmesnik v `app/(app)/*`.

## Baza
- Privzeto se uporablja SQLite (`DATABASE_URL="file:./prisma/dev.db"`).
- Migracije in seed skripte zaženete z `npm run prisma:migrate` in `npm run seed`.

## Opombe
- Datoteke v mapi `uploads` niso verzionirane (razen `.gitkeep`).
- Za produkcijo nastavite varno lokacijo za `DATABASE_URL` in poskrbite za varnost nalaganja datotek.
