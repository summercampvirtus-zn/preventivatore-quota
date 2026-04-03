# Preventivatore Summer Camp (Virtus)

Mini-app **Svelte 5 + Vite + TypeScript**: calcolo del preventivo **solo nel browser** (nessun backend), in linea con il volantino **Summer** (tariffe settimanali, fino a 6 figli).

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

- Tariffe e regole sono centralizzate in [`src/lib/pricing.ts`](src/lib/pricing.ts).
- Ogni figlio ha **proprio numero di settimane**; il totale ricorrente è la somma di (quota settimanale netta × settimane) per figlio.
- Per iscrizioni / moduli ufficiali (es. Easter Camp) usa i link indicati nell’app.
