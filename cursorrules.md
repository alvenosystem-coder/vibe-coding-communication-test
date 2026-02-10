# 🎯 KOMUNIKAČNÍ CENTRUM – Master Prompt pro Cursor

> **DŮLEŽITÉ:** Toto je kompletní zadání projektu. Přečti si ho celé, než začneš cokoliv programovat. Postupuj přesně podle sekcí a fází. Po každé fázi se zastav a čekej na potvrzení.

---

## 📋 O PROJEKTU

Vytváříme **Komunikační centrum** – samostatnou webovou aplikaci, která bude sloužit jako interní komunikační nástroj pro firmu. Aplikace bude v budoucnu vložena přes `<iframe>` do existujícího HR systému Alveno, ale nyní ji stavíme jako **samostatné demo běžící lokálně**.

Aplikace se napojí na **reálné Alveno HR API** a stáhne si seznam zaměstnanců i oddělení – takže v demu budou skutečná jména a organizační struktura z HR systému.

### Klíčový cíl
Funkční MVP demo, které ukáže pět hlavních funkcí:
1. **Synchronizace zaměstnanců a oddělení** – stažení reálných dat z Alveno HR API
2. **Oznámení / Nástěnka** – tvorba a zobrazení firemních oznámení
3. **Ankety s hlasováním** – tvorba anket, hlasování, výsledky v reálném čase
4. **Notifikace** – počítadlo nepřečtených oznámení a anket
5. **Správa rolí** – přepínání mezi zaměstnanci + Admin mód

### Důležitá omezení pro demo
- **BEZ vlastní autentizace** – žádné přihlašování přes heslo
- Místo loginu bude **výběr zaměstnance z dropdownu** (data z Alveno API) + toggle "Admin mód"
- Vybraný zaměstnanec se ukládá do localStorage
- Aplikace běží **čistě lokálně** (localhost)

---

## 🚀 DEPLOYMENT – VERCEL + GITHUB

### GitHub Repository
- **Organizace:** `alvenosystem-coder`
- **Repository:** (aktuální repozitář pro Komunikační centrum, bez historických odkazů na jiné projekty)
- **Status:** Public repository
- **Vercel:** Propojeno s Vercel pro automatické deploymenty
- **POŽADAVEK:** Veškeré commity, tagy i branche v tomto projektu musí být
  vytvářené a pushované **pouze pod účtem/identitou `alvenosystem-coder`**
  (žádný jiný uživatel/jméno jako např. `domee-app` zde nesmí figurovat).

### Vercel Deployment
- Aplikace je nasazena na **Vercel** pro produkční provoz
- Automatické deploymenty při pushnutí do `main` branch
- Environment proměnné (`ALVENO_API_URL`, `ALVENO_API_KEY`, `ALVENO_TENANT`, `DATABASE_URL`) musí být nastaveny v Vercel dashboardu
- **DŮLEŽITÉ - DATABÁZE:**
  - **Na localhostu:** SQLite funguje perfektně, data jsou perzistentní v souboru `prisma/dev.db`
  - **Na Vercelu:** SQLite v `/tmp` se resetuje mezi serverless funkcemi a deploymenty - **data nejsou perzistentní**
  - **Pro produkci na Vercelu:** Je **nutné** napojit cloudovou databázi:
    - **Vercel Postgres** (doporučeno pro Vercel)
    - **Supabase** (PostgreSQL)
    - **Azure Database** (PostgreSQL/MySQL)
    - Jiná cloudová databáze
  - Aktuální stav: Aplikace funguje na localhostu, na Vercelu je potřeba napojit perzistentní databázi pro produkční provoz

### Iframe Integration
- Aplikace je připravena pro vložení do HR systému Alveno přes `<iframe>`
- Pro embed pouze oznámení: použít URL `/embed/announcements` (připravit)
- Pro celou aplikaci: použít root URL z Vercelu

---

## 🔌 ALVENO HR API – INTEGRACE (OVĚŘENO, FUNKČNÍ)

### Základní info
- **Base URL:** `https://hr.alveno.cz/api/external`
- **Autentizace:** API klíč v hlavičce `X-API-Key: {token}`
- **Tenant ID:** `06777198`
- **Formát:** JSON
- **Dokumentace:** https://hr.alveno.cz/api/external/docs

### Environment proměnné (soubor `.env.local`)
```env
ALVENO_API_URL=https://hr.alveno.cz/api/external
ALVENO_API_KEY=sem_vlozit_api_klic
ALVENO_TENANT=06777198
```

> **DŮLEŽITÉ:** Nikdy neposílej API klíč na frontend! Veškerá komunikace s Alveno API probíhá výhradně přes Next.js API routes (server-side).

---

### Endpoint 1: Test spojení (Echo)
```
GET /v1/{tenant}/echo?message=test
Headers: X-API-Key: {ALVENO_API_KEY}

Odpověď: { "message": "test" }
```

---

### Endpoint 2: Seznam zaměstnanců
```
GET /v1/{tenant}/employees?offset=0&limit=100
Headers: X-API-Key: {ALVENO_API_KEY}
```

**Odpověď – stránkovaný seznam:**
```typescript
interface AlvenoEmployeesResponse {
  items: AlvenoEmployee[];
  offset: number;        // Aktuální offset
  limit: number;         // Aktuální limit
  totalCount: number;    // Celkový počet zaměstnanců
}

interface AlvenoEmployee {
  id: string;              // UUID – unikátní identifikátor
  firstName: string;       // Křestní jméno (např. "Tomáš")
  lastName: string;        // Příjmení (např. "Foltas")
  email: string | null;    // Email (POZOR: může být null!)
  avatarId: string | null; // UUID profilové fotky (nelze stáhnout přes API)
  jobTitle: string;        // Pozice (může být prázdný řetězec "")
  personalNumber: string;  // Osobní číslo (např. "2")
  isActive: boolean;       // Je aktivní zaměstnanec?
  isDisabled: boolean;     // Je deaktivován?
  operationId: string | null; // UUID oddělení
  workgroupId: string | null; // UUID pracovní skupiny
  gender: string;          // "male" | "female"
  startDate: string | null;   // Datum nástupu
  localization: string;    // "cs" | "en"
}
```

**Stránkování:** Pro stažení všech zaměstnanců iteruj s `offset` dokud `offset < totalCount`. Aktuálně je v systému **38 zaměstnanců**, takže stačí jeden request s `limit=100`.

**POZOR na reálná data:**
- `email` může být `null` u mnoha zaměstnanců
- `jobTitle` může být prázdný řetězec `""`
- `avatarId` existuje, ale endpoint `/files` je zakázaný – **avatary nelze stáhnout přes API**
- Pro avatar použij **iniciály zaměstnance** (první písmeno jména + příjmení) v barevném kruhu

---

### Endpoint 3: Seznam oddělení (Operations)
```
GET /v1/{tenant}/operations
Headers: X-API-Key: {ALVENO_API_KEY}
```

**Odpověď:**
```typescript
interface AlvenoOperationsResponse {
  items: AlvenoOperation[];
}

interface AlvenoOperation {
  id: string;           // UUID oddělení
  name: string;         // Název (např. "Marketingové oddělení")
  isDisabled: boolean;  // Je aktivní?
}
```

**Aktuální oddělení v systému:**
- Prodejna Brno-střed
- Obchodní tým
- Marketingové oddělení
- Tým konzultantů
- Administrativa
- Prodejna Praha
- HR oddělení
- Dobrovolníci

Oddělení se synchronizují spolu se zaměstnanci a slouží k zobrazení "Oddělení" u jména zaměstnance v UI.

---

### Synchronizace – jak to funguje
1. Při prvním spuštění (nebo tlačítkem "Synchronizovat") se zavolá Alveno API
2. Nejdřív se stáhnou oddělení (`/operations`) a uloží do DB
3. Pak se stáhnou zaměstnanci (`/employees`) – s automatickým stránkováním pokud `totalCount > limit`
4. Vše se uloží do lokální SQLite databáze (upsert – existující = update, nový = create)
5. Tlačítko "🔄 Synchronizovat" v admin panelu umožní ruční aktualizaci
6. Při synchronizaci zobrazit loading stav a po dokončení toast se statistikou

---

## 🛠 TECH STACK

| Technologie | Verze | Účel |
|---|---|---|
| **Next.js** | 14+ (App Router) | Framework – frontend + API routes |
| **TypeScript** | strict mode | Typová bezpečnost |
| **Tailwind CSS** | 3.4+ | Styling |
| **shadcn/ui** | latest | UI komponenty |
| **Prisma** | latest | ORM pro databázi |
| **SQLite** | – | Lokální databáze (soubor, žádný server) |
| **Lucide React** | latest | Ikony |

---

## 📁 STRUKTURA PROJEKTU

```
komunikacni-centrum/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                  # Seed data pro ankety a oznámení
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Hlavní layout s navigací
│   │   ├── page.tsx             # Dashboard / Nástěnka
│   │   ├── announcements/
│   │   │   ├── page.tsx         # Seznam oznámení
│   │   │   └── new/
│   │   │       └── page.tsx     # Formulář nového oznámení (admin)
│   │   ├── polls/
│   │   │   ├── page.tsx         # Seznam anket
│   │   │   └── new/
│   │   │       └── page.tsx     # Formulář nové ankety (admin)
│   │   └── api/
│   │       ├── alveno/
│   │       │   ├── sync/
│   │       │   │   └── route.ts     # Synchronizace zaměstnanců + oddělení
│   │       │   └── test/
│   │       │       └── route.ts     # Test spojení (echo)
│   │       ├── employees/
│   │       │   └── route.ts         # Seznam zaměstnanců z lokální DB
│   │       ├── announcements/
│   │       │   ├── route.ts         # CRUD oznámení
│   │       │   └── [id]/
│   │       │       └── read/
│   │       │           └── route.ts # Označení jako přečtené
│   │       ├── polls/
│   │       │   ├── route.ts         # CRUD anket
│   │       │   └── [id]/
│   │       │       └── vote/
│   │       │           └── route.ts # Hlasování
│   │       └── notifications/
│   │           └── route.ts         # Počet nepřečtených
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Boční navigace
│   │   │   ├── Header.tsx           # Horní lišta s notifikacemi
│   │   │   └── UserSwitcher.tsx     # Výběr zaměstnance + Admin toggle
│   │   ├── announcements/
│   │   │   ├── AnnouncementCard.tsx
│   │   │   ├── AnnouncementForm.tsx
│   │   │   └── AnnouncementList.tsx
│   │   ├── polls/
│   │   │   ├── PollCard.tsx
│   │   │   ├── PollForm.tsx
│   │   │   ├── PollResults.tsx
│   │   │   └── PollList.tsx
│   │   ├── notifications/
│   │   │   └── NotificationBadge.tsx
│   │   └── ui/
│   │       └── EmployeeAvatar.tsx   # Komponenta avatara s iniciálami
│   ├── lib/
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── alveno-api.ts            # Alveno API client (server-side only)
│   │   └── user-context.tsx         # React context pro vybraného uživatele + admin mód
│   └── types/
│       └── index.ts                 # TypeScript typy
├── .env.local                       # API klíče (NIKDY do gitu!)
├── .env.example                     # Šablona env proměnných
├── .gitignore
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🗄 DATABÁZOVÝ MODEL (Prisma Schema)

**Aktuální konfigurace:**
- Používá **SQLite** pro lokální vývoj
- Na Vercelu je potřeba změnit na PostgreSQL (Vercel Postgres, Supabase, Azure, atd.)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  // Na Vercelu změnit na: provider = "postgresql"
  // a nastavit DATABASE_URL v environment variables
}

// Oddělení synchronizovaná z Alveno HR API
model Operation {
  id         String     @id                    // UUID z Alveno
  name       String                            // Název oddělení
  isDisabled Boolean    @default(false)
  syncedAt   DateTime   @default(now())

  employees  Employee[]
}

// Zaměstnanci synchronizovaní z Alveno HR API
model Employee {
  id              String     @id               // UUID z Alveno
  firstName       String
  lastName        String
  email           String?                      // Může být null
  jobTitle        String     @default("")
  personalNumber  String     @default("")
  gender          String     @default("")
  isActive        Boolean    @default(true)
  isDisabled      Boolean    @default(false)
  operationId     String?                      // FK na oddělení
  operation       Operation? @relation(fields: [operationId], references: [id])
  syncedAt        DateTime   @default(now())

  announcements   Announcement[]
  votes           Vote[]
}

model Announcement {
  id          String   @id @default(cuid())
  title       String
  content     String
  priority    String   @default("normal")      // "low" | "normal" | "high" | "urgent"
  authorId    String
  author      Employee @relation(fields: [authorId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  readBy      AnnouncementRead[]
}

// Kdo přečetl které oznámení
model AnnouncementRead {
  id              String       @id @default(cuid())
  announcementId  String
  announcement    Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  employeeId      String
  readAt          DateTime     @default(now())

  @@unique([announcementId, employeeId])
}

model Poll {
  id          String       @id @default(cuid())
  title       String
  description String?
  authorId    String
  author      Employee     @relation(fields: [authorId], references: [id])
  isActive    Boolean      @default(true)
  expiresAt   DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  options     PollOption[]
  votes       Vote[]
}

model PollOption {
  id     String @id @default(cuid())
  text   String
  pollId String
  poll   Poll   @relation(fields: [pollId], references: [id], onDelete: Cascade)
  votes  Vote[]
}

model Vote {
  id           String     @id @default(cuid())
  pollId       String
  poll         Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  optionId     String
  option       PollOption @relation(fields: [optionId], references: [id], onDelete: Cascade)
  employeeId   String
  employee     Employee   @relation(fields: [employeeId], references: [id])
  createdAt    DateTime   @default(now())

  @@unique([pollId, employeeId])
}

model Notification {
  id         String   @id @default(cuid())
  type       String                            // "announcement" | "poll"
  refId      String                            // ID oznámení nebo ankety
  title      String
  employeeId String                            // Pro koho je notifikace
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())
}
```

---

## 🔑 ALVENO API CLIENT (`src/lib/alveno-api.ts`)

Tento soubor zapouzdřuje veškerou komunikaci s Alveno HR API. Používá se POUZE na serveru (v API routes).

```typescript
// Základní kostra – Cursor dopíše kompletní implementaci

const ALVENO_API_URL = process.env.ALVENO_API_URL!;
const ALVENO_API_KEY = process.env.ALVENO_API_KEY!;
const ALVENO_TENANT = process.env.ALVENO_TENANT!;

const headers = {
  "X-API-Key": ALVENO_API_KEY,
  "Content-Type": "application/json",
};

function baseUrl(path: string): string {
  return `${ALVENO_API_URL}/v1/${ALVENO_TENANT}${path}`;
}

// Test spojení – GET /v1/{tenant}/echo?message=test
async function testConnection(): Promise<boolean> { ... }

// Stažení oddělení – GET /v1/{tenant}/operations
async function fetchOperations(): Promise<AlvenoOperation[]> {
  // Vrací { items: [...] }
}

// Stažení všech zaměstnanců – GET /v1/{tenant}/employees
async function fetchAllEmployees(): Promise<AlvenoEmployee[]> {
  // Stránkování: offset=0, limit=100
  // Iteruj dokud offset < totalCount
  // Vrať pouze zaměstnance kde isActive === true && isDisabled === false
  // POZOR: email může být null, jobTitle může být ""
}

// Kompletní synchronizace do lokální DB
async function syncAll(): Promise<{ employees: number; operations: number }> {
  // 1. Stáhni a upsertuj oddělení
  // 2. Stáhni a upsertuj zaměstnance
  // 3. Vrať statistiku
}
```

---

## 🎨 DESIGN – VIZUÁLNÍ STYL ODPOVÍDAJÍCÍ ALVENO HR SYSTÉMU

Komunikační centrum musí vizuálně ladit s Alveno HR systémem, aby vypadalo jako jeho přirozená součást. Design vychází z reálného UI Alveno systému.

### Barevné schéma (přesné barvy z Alveno)

```typescript
// tailwind.config.ts – rozšíření barev
const colors = {
  alveno: {
    sidebar: '#1B2A4A',        // Tmavě modrý sidebar
    sidebarHover: '#243558',   // Hover stav v sidebaru
    sidebarActive: '#00BCD4',  // Aktivní položka – tyrkysová/cyan
    accent: '#00BCD4',         // Hlavní akcentní barva – tyrkysová
    accentLight: '#E0F7FA',    // Světlý accent pro pozadí
    success: '#4CAF50',        // Zelená pro tlačítka a úspěch
    successHover: '#43A047',   // Hover zelené
    text: '#2D3748',           // Tmavý text
    textLight: '#718096',      // Světlejší text
    bg: '#F7F8FA',             // Pozadí hlavní oblasti
    card: '#FFFFFF',           // Bílé karty
    border: '#E2E8F0',        // Jemné ohraničení
    danger: '#E53E3E',         // Červená pro urgentní/chyby
    warning: '#ED8936',        // Oranžová pro varování
    admin: '#9F7AEA',          // Fialová pro admin mód indikátor
  }
}
```

### Layout – přesně jako Alveno

```
┌──────────────────────────────────────────────────────────┐
│ [LOGO]           KOMUNIKAČNÍ CENTRUM                     │
│                                                          │
│ ┌──────────┐ ┌─────────────────────────────────────────┐ │
│ │          │ │ Header: Název stránky    🔔 3   [Avatar]│ │
│ │ TMAVÝ    │ │─────────────────────────────────────────│ │
│ │ SIDEBAR  │ │                                         │ │
│ │          │ │  Hlavní obsah                            │ │
│ │ 🏠 Nást. │ │  (bílé karty na šedém pozadí)           │ │
│ │ 📢 Ozn.  │ │                                         │ │
│ │ 📊 Ank.  │ │                                         │ │
│ │          │ │                                         │ │
│ │          │ │                                         │ │
│ │──────────│ │                                         │ │
│ │ 👤 User  │ │                                         │ │
│ │ 🛡 Admin │ │                                         │ │
│ │ 🔄 Sync  │ │                                         │ │
│ └──────────┘ └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Sidebar (levý panel)
- **Pozadí:** `alveno.sidebar` (#1B2A4A) – tmavě modrá
- **Šířka:** 260px
- **Logo nahoře:** Text "Komunikační centrum" v bílé, případně s malou ikonou
- **Menu položky:**
  - Neaktivní: bílý text, ikona z Lucide, padding 12px 20px
  - Hover: pozadí `alveno.sidebarHover`
  - Aktivní: **tyrkysové pozadí** `alveno.sidebarActive` (#00BCD4) s bílým textem a border-radius 8px
- **Dolní část sidebaru:** UserSwitcher (oddělený jemnou čárou)

### Header (horní lišta)
- **Pozadí:** bílé s jemným border-bottom
- **Vlevo:** Název aktuální stránky (tučný, `alveno.text`)
- **Vpravo:** Notifikační zvoneček s badge + jméno a avatar aktuálního uživatele
- **Výška:** 64px

### Karty a obsah
- **Pozadí stránky:** `alveno.bg` (#F7F8FA)
- **Karty:** Bílé, border-radius 12px, jemný shadow (`shadow-sm`), border 1px `alveno.border`
- **Nadpisy sekcí:** S tyrkysovým podtržením (gradient linka pod nadpisem – jako v Alveno)
- **Tlačítka primární:** Zelená (`alveno.success`), border-radius 8px, bílý text
- **Tlačítka sekundární:** Bílé s tyrkysovým ohraničením

### EmployeeAvatar komponenta
Protože avatary z API nelze stáhnout, vytvoříme vlastní:
- Kruh 40x40px (v headeru 32x32px)
- Pozadí: barva vygenerovaná z jména (hash jména → index do palety barev)
- Text: iniciály (první písmeno jména + příjmení), bílé, tučné
- Paleta barev pro avatary: `['#00BCD4', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#3F51B5', '#009688', '#F44336']`

### Prioritní badge (oznámení)
- Nízká: šedý badge
- Normální: modrý badge
- Vysoká: oranžový badge
- Urgentní: červený badge s pulzující animací (ring animation)

### Tyrkysový gradient divider
Pod nadpisy sekcí (jako v Alveno) zobrazit tenký gradient:
```css
background: linear-gradient(90deg, #00BCD4 0%, #4CAF50 100%);
height: 3px;
border-radius: 2px;
```

### Admin mód indikátor
Když je zapnutý Admin mód:
- V sidebaru malý fialový badge "ADMIN" vedle jména uživatele
- Tlačítka pro tvorbu obsahu mají jemné fialové ohraničení
- Toast při přepnutí: "Admin mód zapnut" / "Admin mód vypnut"

---

## ⚙️ FUNKČNÍ SPECIFIKACE

### 1. Nástěnka (Dashboard) – stránka `/`
**Co zobrazuje:**
- Uvítání: "Dobrý den, {jméno}!" + oddělení zaměstnance (z Operation tabulky)
- Souhrn ve 3 kartách vedle sebe:
  - 📢 Nových oznámení: {počet nepřečtených}
  - 📊 Aktivních anket: {počet}
  - 👥 Zaměstnanců: {počet} (jen admin mód)
- Posledních 3–5 oznámení (nejnovější nahoře)
- Poslední 2–3 aktivní ankety
- Každá sekce má odkaz "Zobrazit vše →"
- V admin módu navíc: datum poslední synchronizace, tlačítko sync

### 2. Oznámení – stránka `/announcements`

**Seznam oznámení:**
- Karty seřazené od nejnovějšího
- Každá karta zobrazuje: titulek, obsah (zkrácený na 150 znaků), prioritu (barevný badge), datum, **jméno autora s EmployeeAvatar** + oddělení autora
- Nepřečtené oznámení (aktuálním uživatelem) mají **tyrkysové levé ohraničení** (border-left 4px solid `alveno.accent`)
- Klik na kartu = rozbalení celého oznámení (expand animace)
- Po zobrazení se oznámení automaticky označí jako přečtené (→ AnnouncementRead)

**Vytvoření oznámení (jen Admin mód):**
- Tlačítko "➕ Nové oznámení" – zelené (`alveno.success`), viditelné jen v admin módu
- Formulář: Titulek (povinný), Obsah (textarea, povinný), Priorita (select: Nízká/Normální/Vysoká/Urgentní)
- Autor = aktuálně vybraný zaměstnanec
- Po odeslání: toast "Oznámení bylo vytvořeno ✅", redirect na seznam
- Automaticky se vytvoří Notification pro každého aktivního zaměstnance (kromě autora)

### 3. Ankety – stránka `/polls`

**Seznam anket:**
- Aktivní ankety nahoře, uzavřené dole (šedivé, opacity 0.6)
- Každá karta: titulek, popis, počet hlasů, stav (Aktivní/Ukončená s barevným badge), jméno autora s EmployeeAvatar

**Hlasování:**
- Klik na anketu = rozbalení s možnostmi
- Radio buttony pro výběr jedné možnosti
- Tlačítko "Hlasovat" (zelené)
- Po hlasování: animovaný přechod na **výsledky s progress bary a procenty**
- Progress bary v tyrkysové barvě (`alveno.accent`)
- Hlasování se ukládá do DB (tabulka Vote s vazbou na zaměstnance)
- Pokud zaměstnanec již hlasoval → rovnou zobrazit výsledky
- V Admin módu vidí výsledky vždy bez hlasování

**Vytvoření ankety (jen Admin mód):**
- Tlačítko "➕ Nová anketa" – zelené, viditelné jen v admin módu
- Formulář: Titulek (povinný), Popis (nepovinný), Možnosti (minimálně 2, dynamické přidávání "+ Přidat možnost", odebrání "✕")
- Po odeslání: toast "Anketa byla vytvořena ✅"
- Automaticky se vytvoří Notification pro každého aktivního zaměstnance (kromě autora)

### 4. Notifikace

**NotificationBadge v headeru:**
- Ikona zvonečku (Bell z Lucide) v headeru
- Červený badge s číslem nepřečtených **pro aktuálního zaměstnance**
- Klik = dropdown se seznamem posledních notifikací (max 10)
- Každá notifikace: ikona typu (📢/📊), titulek, relativní čas ("před 5 min", "před 2 hod", "včera")
- Klik na notifikaci = redirect na oznámení/anketu + označit jako přečtené
- Tlačítko "Označit vše jako přečtené" na konci dropdownu

---

### UserSwitcher (nahrazuje přihlášení)
Umístěný v dolní části sidebaru. Obsahuje:

1. **Dropdown "Přihlášen jako:"**
   - Searchable select s filtrováním – při 38 zaměstnancích potřebujeme hledání
   - Zobrazuje: EmployeeAvatar + Jméno + Oddělení (z Operation tabulky)
   - Po výběru se okamžitě změní kontext celé aplikace (notifikace, hlasování)

2. **Toggle "🛡️ Admin mód"**
   - Shadcn Switch komponenta
   - Zapnutý = vidí tlačítka pro tvorbu + správu + sync
   - Fialový badge "ADMIN" se zobrazí v headeru

3. **Tlačítko "🔄 Synchronizovat"** (viditelné jen v admin módu)
   - Spustí sync z Alveno API (oddělení + zaměstnanci)
   - Loading spinner během synchronizace
   - Toast s výsledkem: "Synchronizováno: 38 zaměstnanců, 8 oddělení ✅"

4. Vybraný zaměstnanec + admin stav se ukládá do localStorage

### Stav při prvním spuštění (onboarding)
Pokud v databázi nejsou žádní zaměstnanci:
- Zobrazí se **úvodní obrazovka** na celou stránku
- Velká ikona + text "Vítejte v Komunikačním centru"
- Popis: "Pro začátek je potřeba načíst zaměstnance z HR systému Alveno"
- Zelené tlačítko "🚀 Načíst zaměstnance z Alveno HR"
- Loading stav s progress informací
- Po úspěšné synchronizaci → redirect na výběr zaměstnance → Dashboard

---

## 🌱 SEED DATA

Soubor `prisma/seed.ts`. Seed se spouští AŽ PO synchronizaci zaměstnanců z API.

> **POZNÁMKA:** Seed načte prvního zaměstnance z DB jako autora. Pokud zaměstnanci neexistují, vypíše varování a skončí.

**Oznámení (5 kusů):**
1. "🎄 Firemní vánoční večírek" – priorita: vysoká – "Zveme vás na tradiční firemní vánoční večírek, který se koná 20. prosince od 18:00 v restauraci U Zlatého lva. Dress code: smart casual. Potvrďte prosím účast do 15. prosince."
2. "🅿️ Změna parkování od ledna" – priorita: normální – "Od 1. ledna dochází ke změně přidělení parkovacích míst. Nový rozpis najdete na recepci. Kontaktujte HR oddělení pro případné dotazy."
3. "🛡️ Povinné školení BOZP" – priorita: urgentní – "Připomínáme povinné školení bezpečnosti práce pro všechny zaměstnance. Termín: 10. ledna, 9:00, zasedací místnost A3. Účast je povinná."
4. "☕ Nový kávovar v kuchyňce" – priorita: nízká – "V kuchyňce ve 2. patře byl instalován nový kávovar. Návod k použití je vyvěšen na zdi vedle kávovaru."
5. "💰 Výplata bonusů za Q3" – priorita: vysoká – "Bonusy za třetí kvartál budou vyplaceny s říjnovou výplatou. Individuální částky byly odeslány na firemní e-maily."

**Ankety (3 kusy):**
1. "🍽️ Kam na teambuilding?" – možnosti: "Bowling", "Úniková hra", "Laser game", "Paintball" – aktivní
2. "⏰ Preferovaný začátek pracovní doby" – možnosti: "7:00", "8:00", "9:00", "Flexibilní" – aktivní
3. "🎁 Vánoční dárek pro děti zaměstnanců" – možnosti: "Poukázka do hračkářství", "Vstupenka do ZOO", "Sladký balíček" – uzavřená (isActive: false)

**Notifikace:** Pro každé oznámení a aktivní anketu vytvoř notifikaci pro každého aktivního zaměstnance v DB (kromě autora).

---

## 🚀 FÁZE IMPLEMENTACE

### FÁZE 1: Setup projektu
1. Vytvoř Next.js 14 projekt s TypeScript a Tailwind (`npx create-next-app@latest komunikacni-centrum --typescript --tailwind --app --src-dir`)
2. Nainstaluj a nakonfiguruj Prisma se SQLite
3. Nainstaluj shadcn/ui: `npx shadcn@latest init` a pak komponenty: button, card, badge, dialog, toast, dropdown-menu, input, textarea, select, label, separator, progress, avatar, switch, command (pro searchable select)
4. Nainstaluj lucide-react
5. Rozšiř `tailwind.config.ts` o alveno barvy (viz sekce Design)
6. Vytvoř Prisma schema podle specifikace
7. Spusť `npx prisma migrate dev --name init`
8. Vytvoř `.env.local` s placeholdery a `.env.example`
9. Vytvoř `src/lib/alveno-api.ts` – Alveno API client
10. Vytvoř `src/lib/prisma.ts` – Prisma client singleton
11. **ZASTAV SE a čekej na potvrzení**

### FÁZE 2: API synchronizace + Layout + UserSwitcher
1. Vytvoř API route `api/alveno/test` – test spojení (echo endpoint)
2. Vytvoř API route `api/alveno/sync` – synchronizace (oddělení + zaměstnanci → upsert do DB)
3. Vytvoř API route `api/employees` – seznam zaměstnanců z lokální DB (s JOIN na Operation)
4. Vytvoř UserContext (React Context + localStorage)
5. Vytvoř EmployeeAvatar komponentu (iniciály + barva z hash jména)
6. Vytvoř UserSwitcher (searchable dropdown + admin toggle + sync tlačítko)
7. Vytvoř Sidebar s Alveno designem a navigací
8. Vytvoř Header s NotificationBadge (zatím statický)
9. Vytvoř hlavní layout
10. Vytvoř onboarding obrazovku (první spuštění → sync CTA)
11. **ZASTAV SE a čekej na potvrzení**

### FÁZE 3: Oznámení
1. Vytvoř API routes: GET (seznam s autorem), POST (vytvoření + notifikace), PATCH (označení jako přečtené)
2. Vytvoř AnnouncementCard (s EmployeeAvatar, oddělením, prioritním badge, nepřečtený indikátor)
3. Vytvoř stránku se seznamem oznámení (s expand animací)
4. Vytvoř formulář pro nové oznámení (admin only)
5. **ZASTAV SE a čekej na potvrzení**

### FÁZE 4: Ankety
1. Vytvoř API routes: GET (seznam), POST (vytvoření + notifikace), POST vote (hlasování s kontrolou duplicity)
2. Vytvoř PollCard s hlasováním a progress bar výsledky
3. Vytvoř stránku se seznamem anket
4. Vytvoř formulář pro novou anketu (dynamické přidávání možností)
5. **ZASTAV SE a čekej na potvrzení**

### FÁZE 5: Notifikace a Dashboard
1. Vytvoř API route pro notifikace (GET nepřečtené pro zaměstnance, PATCH označit jako přečtené)
2. Napoj NotificationBadge na API
3. Vytvoř dropdown s notifikacemi
4. Vytvoř Dashboard s uvítáním, souhrnem a posledními záznamy
5. **ZASTAV SE a čekej na potvrzení**

### FÁZE 6: Seed data a finální test
1. Implementuj a spusť seed (oznámení + ankety + notifikace)
2. Otestuj kompletní flow:
   - ✅ Synchronizace 38 zaměstnanců + 8 oddělení z Alveno API
   - ✅ Výběr zaměstnance z dropdownu se jmény
   - ✅ Admin vytvoří oznámení → přepnu na jiného zaměstnance → vidí nepřečtené
   - ✅ Admin vytvoří anketu → zaměstnanec hlasuje → výsledky s progress bary
   - ✅ Notifikační badge ukazuje správný počet pro každého zaměstnance
   - ✅ Přepnutí zaměstnance → jiné notifikace, jiný stav hlasování
3. Oprav chyby, dolaď design
4. **HOTOVO – připraveno pro demo**

---

## ⚠️ PRAVIDLA PRO CURSOR

1. **VŽDY piš v TypeScriptu** – strict mode, žádné `any`
2. **Používej App Router** (Next.js 14) – složky v `src/app/`
3. **Všechny texty v UI jsou ČESKY** – tlačítka, labely, placeholdery, toasty, chybové hlášky
4. **Komponentový přístup** – každá komponenta v samostatném souboru
5. **Shadcn/ui komponenty** – nepiš vlastní UI, používej shadcn
6. **Error handling** – každé API volání musí mít try/catch a zobrazit toast při chybě
7. **Konzistentní pojmenování** – PascalCase pro komponenty, camelCase pro utility
8. **Žádné mock data v komponentách** – vše z API/databáze
9. **Po každé fázi se ZASTAV** – nepostupuj dál bez potvrzení
10. **Piš čistý, čitelný kód** – s komentáři u složitějších částí
11. **API klíče NIKDY na frontend** – komunikace s Alveno API pouze přes Next.js API routes
12. **Upsert při synchronizaci** – existující záznam = update, nový = create
13. **Alveno design** – dodržuj barvy a styl podle sekce Design
14. **Null-safe přístup** – `email` může být null, `jobTitle` může být "", vždy ošetři

---

## 🎯 MĚŘÍTKO ÚSPĚCHU

Demo je úspěšné, když:
- [ ] Synchronizace stáhne reálných 38 zaměstnanců + 8 oddělení z Alveno HR API
- [ ] Dropdown ukazuje skutečná jména s avatary (iniciály) a odděleními
- [ ] Přepínání zaměstnanců okamžitě mění kontext
- [ ] Admin vytvoří oznámení/anketu se svým jménem jako autor
- [ ] Zaměstnanec vidí oznámení a může hlasovat
- [ ] Notifikační badge ukazuje správný počet PRO daného zaměstnance
- [ ] Výsledky ankety mají tyrkysové progress bary
- [ ] Design vizuálně ladí s Alveno HR systémem (tmavý sidebar, tyrkysové akcenty, zelená tlačítka)
- [ ] Vše běží lokálně, API klíč je bezpečně na serveru
- [ ] Celá aplikace je česky