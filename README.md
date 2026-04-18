# Preventivatore Summer Camp (Virtus)

Mini-app **Svelte 5 + Vite + TypeScript**: calcolo del preventivo **solo nel browser** (nessun backend), in linea con il listino **Summer**: tariffe **settimanali** per ogni settimana camp e fascia scelta, fino a 6 figli.

## Sviluppo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Per un deploy in sottocartella (es. **GitHub Pages** `https://utente.github.io/nome-repo/`), imposta il `base` di Vite in fase di build:

```bash
VITE_BASE=/nome-repo/ npm run build
```

Sostituisci `nome-repo` con il nome effettivo del repository (stesso valore usato nell’URL di Pages).

## Pubblicazione su GitHub Pages (passo-passo)

1. **Crea il repository** su GitHub (es. `preventivatore-virtus-camp`), senza README generato da GitHub se vuoi evitare conflitti al primo push.
2. **Da terminale**, nella cartella del progetto (se non è già un repo git):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: preventivatore Summer Camp"
   git branch -M main
   git remote add origin https://github.com/TUO_UTENTE/nome-repo.git
   git push -u origin main
   ```
3. Sul repo GitHub: **Settings → Pages** (Impostazioni → Pagine).
4. In **Build and deployment**, sotto **Source**, scegli **GitHub Actions** (non “Deploy from a branch”).
5. Al primo utilizzo di Pages con Actions, GitHub può chiedere di **approvare i permessi** del workflow: vai su **Actions**, apri l’ultima esecuzione di **Deploy to GitHub Pages** e completa l’eventuale richiesta di approvazione per l’ambiente `github-pages`.
6. Ogni push su **`main`** rilancia il deploy: il file [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) esegue `npm ci`, `npm run build` con `VITE_BASE=/${{ github.event.repository.name }}/` e pubblica la cartella `dist`.

**URL del sito:** `https://TUO_UTENTE.github.io/nome-repo/` (il nome repo deve coincidere con quello usato da GitHub nel path; il workflow imposta automaticamente il `base` di Vite sul nome del repository).

**In locale**, per simulare lo stesso `base` della pubblicazione:
```bash
VITE_BASE=/nome-repo/ npm run build && npm run preview
```

## Verifica tipi e Svelte

```bash
npm run check
```

## Note

- Tariffe e regole: [`src/lib/pricing.ts`](src/lib/pricing.ts); **calendario, anno e periodi prenotabili**: [`src/lib/campSeason.config.ts`](src/lib/campSeason.config.ts) (re-export anche da [`src/lib/campWeeks.ts`](src/lib/campWeeks.ts); aggiornare a inizio stagione).
- Per ogni figlio si aggiungono **una o più settimane** dal calendario; **per ogni settimana** si sceglie la fascia (40 / 25 / 65 €) e opzionalmente la **mensa** (+30 €) per qualsiasi fascia.
- **Sconto fratelli**: 2° −10 €, 3° −15 €, dal 4° al 6° −20 € **per settimana in cui almeno un altro figlio ha la stessa settimana** (non su tutte le settimane se i fratelli non coincidono).
- **Posticipi**: due voci (+5 € ciascuna per settimana compatibile con la fascia di quella riga).
- **Quota di iscrizione**: opzionale **per ogni figlio** (checkbox nella scheda del figlio); se inclusa, +15 € per quel figlio.
- **Iscrizione tardiva** (+10 € per ogni combinazione figlio–settimana): per **ogni settimana camp selezionata**, se l’orario “oggi” cade nella finestra **ven 00:01 – lun 07:29** (rispetto al lunedì di inizio di **quella** settimana), si applica la maggiorazione su quella riga. Vedi riepilogo nell’app.
- **Chiusura iscrizioni** a una settimana camp: stesso limite (**lunedì 07:30** del lunedì di inizio di quella settimana); nel preventivatore quella settimana **non compare** più tra le opzioni e le righe già impostate vengono spostate sulla prima settimana successiva ancora aperta.
- Le maggiorazioni per **assenza** non comunicata **non** sono nel tool (gestione in sede al camp).
- Per adesioni ufficiali seguire le comunicazioni della società.
