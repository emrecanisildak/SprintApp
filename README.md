# SprintApp

Sprint planlama ve takip uygulaması. Birden fazla projeyi yönetebilen, sprint planlama, backlog yonetimi, developer capacity hesaplama ve sprint raporu cikarabilen bir desktop uygulamasi.

## Teknoloji Stack

- **Runtime:** Electron
- **Frontend:** React + Tailwind CSS + TypeScript
- **Database:** SQLite (better-sqlite3, her proje icin ayri DB)
- **Charts:** Chart.js (react-chartjs-2)
- **Build:** Vite + electron-builder

## Ozellikler

### Proje Yonetimi
- Birden fazla proje olusturma ve yonetme
- Proje bazli ayarlar (story point/saat orani, gunluk calisma saati)
- Developer ekleme/silme/duzenleme

### Backlog Yonetimi
- Story ekleme, duzenleme, silme
- Epic olusturma ve renk atama
- Epic bazli filtreleme
- Story'leri sprint'e tasima

### Sprint Planlama
- Sprint olusturma (tarih, sure, is gunu)
- Developer allocation (% bazli kapasite atama)
- Kapasite hesaplama ve gorsellestirme
- Backlog'dan story cekme, sprint'e atama
- Sprint tamamlandiginda bitmemis story'ler otomatik backlog'a doner

### Sprint Board
- Kanban tarzi status kolonlari (Open, In Progress, On Hold, Resolved, Closed, Deployed)
- Drag & drop ile status degistirme

### Raporlama
- Sprint ozet kartlari (toplam story, SP, tamamlanan, kapasite)
- Tamamlanma yuzdesi progress bar
- Burndown chart
- Status dagilimi chart
- Epic bazli breakdown (bar + doughnut chart)
- Developer bazli istatistikler (bar chart + tablo)
- PDF export (standalone rapor)

### Proje Raporu
- Tum sprint'leri kapsayan proje geneli ozet rapor
- Ozet kartlar: toplam sprint, story, SP, tamamlanma orani, backlog durumu
- Sprint bazli ilerleme bar chart
- Genel tamamlanma doughnut chart (tamamlanan / kalan / backlog)
- Developer performans bar chart (tum sprint'ler genelinde)
- Epic dagilimi doughnut chart
- PDF export

### Import / Export
- **CSV Export:** Sprint story'lerini CSV olarak disari aktar
- **CSV Import:** CSV dosyasindan story'leri sprint'e veya backlog'a aktar
- **Status CSV Import:** Jira vb. sistemlerden story statuslerini toplu guncelle
- **PDF Report Export:** Sprint raporu veya proje raporu PDF olarak kaydet
- **PDF Plan Export:** Sprint plani PDF olarak kaydet (developer bazli kapasite ve story detaylari)

## CSV Import Formatlari

### Story Import (Sprint veya Backlog)

Sprint listesindeki "Import CSV" butonu ile sprint'e, backlog sayfasindaki "Import CSV" butonu ile backlog'a story aktarabilirsiniz.

**Format:**
```
Epic,Story,Description,Developer,Story Points,Status
```

**Ornek:**
```csv
Epic,Story,Description,Developer,Story Points,Status
Auth,Login sayfasi,Kullanici giris ekrani,Ahmet,3,Open
Auth,Sifre sifirlama,Email ile sifre sifirlama,Mehmet,5,Open
Dashboard,Ana sayfa,Dashboard tasarimi,Ayse,8,In Progress
,Teknik borc temizligi,Legacy kod refactor,,2,Open
```

**Kurallar:**
- Ilk satir header olmali (yukaridaki format)
- Epic ve Developer alanlari bossa sorunsuz calisir
- Olmayan Epic ve Developer otomatik olusturulur
- Status bossa projenin default statusu atanir
- Ayni isimli story varsa guncellenir, yoksa yeni olusturulur
- UTF-8 encoding desteklenir

### Status Update Import

Sprint listesindeki "Import Status" butonu ile Jira vb. sistemlerden export edilen CSV ile story statuslerini toplu guncelleyebilirsiniz.

**Format:**
```
Story,Status
```

**Ornek:**
```csv
Story,Status
Login sayfasi,Resolved
Sifre sifirlama,In Progress
Ana sayfa,Deployed
```

**Kurallar:**
- Story basligi sprint'teki story ile eslestirilir (buyuk/kucuk harf duyarsiz)
- Projede olmayan statusler otomatik olusturulur
- Eslesmesi bulunamayan story'ler atlanir

## Kurulum

```bash
npm install
npx electron-rebuild -f -w better-sqlite3
```

## Calistirma

```bash
npm run electron:dev
```

## Build

```bash
npm run electron:build
```

## Kapasite Hesaplama

```
Kisi kapasitesi (SP) = (sprint_gun * gunluk_saat * allocation%) / sp_saat
Toplam kapasite = tum uyelerin kapasitelerinin toplami
```

## Proje Yapisi

```
SprintApp/
├── electron/
│   ├── main.ts              # Electron main process + IPC handlers
│   ├── preload.ts            # Context bridge
│   └── db/
│       ├── connection.ts     # DB connection manager
│       ├── migrations.ts     # Schema migrations
│       └── repositories/     # CRUD (project, developer, epic, story, sprint, sprintStory)
├── src/
│   ├── App.tsx               # Router + layout
│   ├── components/
│   │   ├── layout/           # Sidebar, Header
│   │   ├── project/          # ProjectForm, ProjectSettings, DeveloperList
│   │   ├── backlog/          # BacklogView, StoryForm, StoryCard
│   │   ├── sprint/           # SprintList, SprintPlanning, SprintBoard
│   │   └── report/           # SprintReport, ProjectReport, BurndownChart, DeveloperStats, EpicStats
│   ├── hooks/useDB.ts        # IPC bridge hooks
│   ├── types/index.ts        # TypeScript tipleri
│   └── utils/capacity.ts     # Kapasite hesaplama
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Database

- **app.db:** Proje listesi (tum projeler icin tek DB)
- **{proje}.db:** Her proje icin ayri SQLite dosyasi (developers, epics, stories, sprints, sprint_members)
