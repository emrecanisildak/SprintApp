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

### Import / Export
- **CSV Export:** Sprint story'lerini CSV olarak disari aktar (Epic, Story, Description, Developer, SP, Status)
- **CSV Import:** CSV dosyasindan story'leri sprint'e aktar. Olmayan developer ve epic otomatik olusturulur, bos status "Open" olarak atanir
- **PDF Report Export:** Sprint raporu PDF olarak kaydet
- **PDF Plan Export:** Sprint plani PDF olarak kaydet (developer bazli kapasite ve story detaylari)

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
│   │   └── report/           # SprintReport, BurndownChart, DeveloperStats, EpicStats
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
