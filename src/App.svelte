<script lang="ts">
  import { CAMP_WEEKS } from './lib/campWeeks'
  import {
    computeQuote,
    defaultChildConfig,
    formatEur,
    isCampWeekEnrollable,
    normalizeChild,
    PRICING,
    SLOT_LABELS,
    SLOT_ORDER,
    type ChildConfig,
    type ChildLineDetail,
    type TimeSlot,
  } from './lib/pricing'

  const MAX_CHILDREN = 6
  /** `false` nasconde il selettore data/ora di test per l’iscrizione tardiva. */
  const SHOW_TEST_NOW = true

  /** Base URL Vite (slash finale) per asset in `public/` su GitHub Pages. */
  const pub = import.meta.env.BASE_URL

  type Row = ChildConfig & { id: number; name: string }

  /** Valore `datetime-local`; vuoto = usa l’orario reale del browser. */
  let testDateTimeLocal = $state('')

  /** Stesso istante usato dal preventivo (reale o simulato). */
  const effectiveNow = $derived.by(() => {
    let now = new Date()
    if (SHOW_TEST_NOW && testDateTimeLocal.trim() !== '') {
      const d = new Date(testDateTimeLocal)
      if (!Number.isNaN(d.getTime())) now = d
    }
    return now
  })

  let nextId = 1
  function newRow(): Row {
    return { id: nextId++, name: '', ...defaultChildConfig(effectiveNow) }
  }

  let children = $state<Row[]>([newRow()])
  let detailsOpen = $state(false)

  function setNumFigli(count: number) {
    const n = Math.min(MAX_CHILDREN, Math.max(1, Math.floor(count)))
    if (children.length < n) {
      const extra: Row[] = []
      while (children.length + extra.length < n) extra.push(newRow())
      children = [...children, ...extra]
    } else if (children.length > n) {
      children = children.slice(0, n)
    }
  }

  function sameAtt(
    a: { weekId: string; slot: TimeSlot; canteen: boolean }[],
    b: typeof a,
  ): boolean {
    if (a.length !== b.length) return false
    return a.every(
      (x, i) =>
        x.weekId === b[i]?.weekId && x.slot === b[i]?.slot && x.canteen === b[i]?.canteen,
    )
  }

  /** Allinea le settimane alle scadenze iscrizione rispetto a `effectiveNow`. */
  $effect.pre(() => {
    const now = effectiveNow
    for (const ch of children) {
      const { id: _id, name: _nm, ...cfg } = ch
      const n = normalizeChild(cfg, now)
      if (!sameAtt(ch.attendances, n.attendances)) {
        ch.attendances = n.attendances
      }
    }
  })

  const quote = $derived(
    computeQuote(
      children.map(({ name: _n, id: _i, ...c }) => c),
      { now: effectiveNow },
    ),
  )

  function reset() {
    nextId = 1
    children = [newRow()]
    detailsOpen = false
    testDateTimeLocal = ''
  }

  function scrollToSummary() {
    document.getElementById('riepilogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    detailsOpen = true
  }

  /** N. settimane in cui lo sconto fratelli si applica (tier > 0). */
  function siblingOverlapWeeks(l: ChildLineDetail): number {
    if (l.siblingDiscountPerWeek <= 0) return 0
    return Math.round(l.siblingDiscountTotal / l.siblingDiscountPerWeek)
  }

  function weekOptionsForRow(child: Row, rowIndex: number) {
    const now = effectiveNow
    const cur = child.attendances[rowIndex]?.weekId
    const other = new Set(
      child.attendances.map((a, i) => (i === rowIndex ? null : a.weekId)).filter(Boolean) as string[],
    )
    return CAMP_WEEKS.filter(
      (w) => (w.id === cur || !other.has(w.id)) && isCampWeekEnrollable(w, now),
    )
  }

  function addAttendance(child: Row) {
    const used = new Set(child.attendances.map((a) => a.weekId))
    const now = effectiveNow
    const next = CAMP_WEEKS.find((w) => !used.has(w.id) && isCampWeekEnrollable(w, now))
    if (!next) return
    child.attendances = [
      ...child.attendances,
      { weekId: next.id, slot: 'full' as TimeSlot, canteen: false },
    ]
  }

  function removeAttendance(child: Row, idx: number) {
    if (child.attendances.length <= 1) return
    child.attendances = child.attendances.filter((_, i) => i !== idx)
  }

</script>

<div class="app">
  <header class="hero-stack" aria-labelledby="page-title">
    <div class="hero-brand">
      <div class="hero-brand-inner">
        <div class="hero-brand-text">
          <p class="eyebrow">Polisportiva Virtus · Centri estivi</p>
          <h1 id="page-title">Preventivatore Summer Camp</h1>
        </div>
        <div class="hero-brand-logos" aria-hidden="true">
          <img
            class="hero-logo hero-logo--camp"
            src={`${pub}logo-summer-camp-zane.png`}
            alt=""
            decoding="async"
          />
          <img
            class="hero-logo hero-logo--shield"
            src={`${pub}logo-virtus-zane-shield.png`}
            alt=""
            decoding="async"
          />
        </div>
      </div>
    </div>
    <div class="hero-intro">
      <p class="lede">
        Utilizza il preventivatore del Virtus Summer Camp per il calcolo esatto del costo.
      </p>
      <p class="lede">
        Le tariffe sono <strong>settimanali</strong>, pertanto selezionare la fascia quotidiana (mattina,
        pomeriggio, giornata intera) più tutti i servizi accessori (mensa, anticipo, posticipo, ecc.).
      </p>
      <p class="lede">
        Per la scuola dell’infanzia ricordarsi di selezionare la maggiorazione di {formatEur(
          PRICING.preschoolExtra,
        )} per il calcolo completo della quota.
      </p>
      <p class="lede">
        Lo sconto fratelli (solo se due o più figli frequentano la stessa settimana) e l’eventuale iscrizione
        tardiva sono calcolati automaticamente dal sistema.
      </p>
      <p class="disclaimer">
        L’assenza non comunicata comporta una penale sulla successiva iscrizione. Tale penale verrà gestita
        direttamente dalla segreteria del Camp.
      </p>
      <div class="pill-row" aria-hidden="true">
        <span class="pill">Volley</span>
        <span class="pill">Calcio</span>
        <span class="pill">Basket</span>
        <span class="pill">Laboratori</span>
        <span class="pill">Orienteering</span>
        <span class="pill">3–14 anni</span>
      </div>
    </div>
  </header>

  <section class="toolbar card" aria-label="Impostazioni generali">
    <div class="field num-figli-field">
      <label for="num-figli">Quanti figli?</label>
      <div class="toolbar-controls-row">
        <select
          id="num-figli"
          class="select-num-figli"
          value={String(children.length)}
          onchange={(e) =>
            setNumFigli(Number((e.currentTarget as HTMLSelectElement).value))}
        >
          {#each Array.from({ length: MAX_CHILDREN }, (_, i) => i + 1) as n (n)}
            <option value={String(n)}>{n}</option>
          {/each}
        </select>
        <div class="toolbar-actions">
          <button type="button" class="btn primary" onclick={scrollToSummary}>Riepilogo</button>
          <button type="button" class="btn ghost" onclick={reset}>Azzera</button>
        </div>
      </div>
      <span class="hint">Una scheda per figlio (1–{MAX_CHILDREN}).</span>
    </div>
  </section>

  {#if SHOW_TEST_NOW}
    <section class="card dev-test-now" aria-label="Data simulata per test iscrizione tardiva">
      <div class="field dev-test-now-field">
        <label for="test-now-dt">Data e ora simulata (“oggi” per il calcolo)</label>
        <input
          id="test-now-dt"
          class="input-datetime-test"
          type="datetime-local"
          bind:value={testDateTimeLocal}
        />
        <span class="hint"
          >Lasciare vuoto per usare l’orario reale. Utile per provare la finestra ven 00:00 – lun 07:30 della
          settimana camp successiva al calendario.</span
        >
      </div>
    </section>
  {/if}

  <div class="children-grid">
    {#each children as child, i (child.id)}
      <article class="card child-card">
        <div class="child-head">
          <h2>{child.name.trim() ? child.name : `Figlio ${i + 1}`}</h2>
        </div>

        <div class="field">
          <label for="name-{child.id}">Nome (opzionale)</label>
          <input
            id="name-{child.id}"
            type="text"
            bind:value={child.name}
            placeholder="Es. Marco"
            autocomplete="name"
          />
        </div>

        <div class="field child-reg-field">
          <label class="check">
            <input type="checkbox" bind:checked={child.includeRegistration} />
            <span
              >Includi quota di iscrizione ({formatEur(PRICING.registrationPerChild)} per questo
              figlio)</span
            >
          </label>
        </div>

        <div class="attendance-block">
          <div class="attendance-head">
            <h3 class="h3">Settimane di frequenza</h3>
            <button
              type="button"
              class="btn secondary small"
              onclick={() => addAttendance(child)}
              disabled={child.attendances.length >= CAMP_WEEKS.length}
            >
              Aggiungi settimana
            </button>
          </div>
          <p class="hint attendance-hint">
            Per ogni riga: settimana del camp e fascia. I prezzi 40 / 25 / 65 € (+30 mensa) sono <strong
              >per settimana</strong
            >.
          </p>

          {#each child.attendances as att, j (`${child.id}-${j}`)}
            <div class="attendance-row">
              <div class="field">
                <label for="wk-{child.id}-{j}">Settimana</label>
                <select
                  id="wk-{child.id}-{j}"
                  bind:value={att.weekId}
                >
                  {#each weekOptionsForRow(child, j) as w (w.id)}
                    <option value={w.id}>{w.label}</option>
                  {/each}
                </select>
              </div>
              <div class="field">
                <label for="sl-{child.id}-{j}">Fascia</label>
                <select id="sl-{child.id}-{j}" bind:value={att.slot}>
                  {#each SLOT_ORDER as sk (sk)}
                    <option value={sk}>{SLOT_LABELS[sk]}</option>
                  {/each}
                </select>
              </div>
              <label class="check mensa-check">
                <input type="checkbox" bind:checked={att.canteen} />
                <span>Mensa (+{formatEur(PRICING.canteen)})</span>
              </label>
              {#if child.attendances.length > 1}
                <button
                  type="button"
                  class="btn text danger small-remove"
                  onclick={() => removeAttendance(child, j)}>Rimuovi</button
                >
              {/if}
            </div>
          {/each}
        </div>

        <fieldset class="toggles">
          <legend>Opzioni (per ogni settimana di questo figlio)</legend>
          <label class="check">
            <input type="checkbox" bind:checked={child.preschool} />
            <span>Scuola dell’infanzia (+{formatEur(PRICING.preschoolExtra)}/sett. × n. settimane)</span>
          </label>
          <label class="check">
            <input type="checkbox" bind:checked={child.earlyDropoff} />
            <span>Anticipo 7:30–8:00 (+{formatEur(PRICING.earlyDropoff)}/sett. × n. settimane)</span>
          </label>
          <label class="check">
            <input type="checkbox" bind:checked={child.latePickupMorning} />
            <span>Posticipo 13:00–13:30 (+{formatEur(PRICING.latePickup)}/sett. per settimana in mattina o giornata intera)</span>
          </label>
          <label class="check">
            <input type="checkbox" bind:checked={child.latePickupEvening} />
            <span>Posticipo 17:00–17:45 (+{formatEur(PRICING.latePickup)}/sett. per settimana in pomeriggio o giornata intera)</span>
          </label>
        </fieldset>

        <p class="child-subtotal">
          Totale ricorrente questo figlio:
          <strong>{formatEur(quote.lines[i]?.recurringChild ?? 0)}</strong>
          ({quote.lines[i]?.weekCount ?? 0} sett.; media
          <strong>{formatEur(quote.lines[i]?.weeklyNet ?? 0)}</strong>/sett. dopo sconto fratello)
        </p>
      </article>
    {/each}
  </div>

  <section id="riepilogo" class="card summary" aria-labelledby="riepilogo-title">
    <h2 id="riepilogo-title">Riepilogo</h2>
    <dl class="totals">
      {#if quote.registrationTotal > 0}
        <div>
          <dt
            >Iscrizione ({quote.registrationPayerCount} × {formatEur(PRICING.registrationPerChild)})</dt
          >
          <dd>{formatEur(quote.registrationTotal)}</dd>
        </div>
      {/if}
      <div>
        <dt>Quota figli</dt>
        <dd>{formatEur(quote.weeklyRecurringNet)}</dd>
      </div>
      {#if quote.lateRegistration.amount > 0}
        <div>
          <dt
            >Iscrizione tardiva ({quote.lateRegistration.qualifyingChildWeeks} × {formatEur(
              PRICING.lateRegistrationPerWeek,
            )})</dt
          >
          <dd>{formatEur(quote.lateRegistration.amount)}</dd>
        </div>
      {/if}
      <div>
        <dt>Totale ricorrente</dt>
        <dd>{formatEur(quote.recurringTotal)}</dd>
      </div>
    </dl>
    <p class="totals-explain">
      Finestra tardiva attiva ora: <strong>{quote.lateRegistration.inWindow ? 'sì' : 'no'}</strong>
      (per ogni settimana camp: dal <strong>venerdì 00:01</strong> al <strong>lunedì 07:29</strong> del
      suo lunedì di inizio; la maggiorazione vale sulle righe in cui quella settimana è in finestra).
      Almeno una riga in finestra: <strong
        >{quote.lateRegistration.hasNextWeekEnrollment ? 'sì' : 'no'}</strong
      >. Settimane di frequenza totali (somma righe): <strong>{quote.totalChildWeeks}</strong>.
      Le settimane camp non sono più selezionabili dopo il lunedì 07:30 del loro inizio.
    </p>
    <dl class="totals totals-tail">
      <div class="grand">
        <dt>Totale stimato</dt>
        <dd>{formatEur(quote.total)}</dd>
      </div>
    </dl>

    <button
      type="button"
      class="btn ghost small details-toggle"
      onclick={() => (detailsOpen = !detailsOpen)}
      aria-expanded={detailsOpen}
    >
      {detailsOpen ? 'Nascondi' : 'Mostra'} dettaglio per figlio
    </button>

    {#if detailsOpen}
      <div class="detail-panel">
        <h3 class="detail-panel-title">Dettaglio per figlio</h3>
        <ul class="detail-lines">
          {#each quote.lines as line, ci}
            <li class="detail-child">
              <strong class="detail-child-name">{children[ci]?.name?.trim() || `Figlio ${ci + 1}`}</strong>
              <ul class="detail-weeks detail-weeks--compact mono">
                {#each line.attendanceLines as al}
                  <li class="detail-week-one">
                    <span class="detail-week-head">{al.weekLabel}</span>
                    · {SLOT_LABELS[al.slot]}{#if al.canteen > 0} + mensa{/if}:
                    {formatEur(al.baseSlot + al.canteen)}
                  </li>
                {/each}
              </ul>
              <ul class="detail-totals mono">
                <li>
                  Attività ({line.weekCount} sett.): {formatEur(line.sumBaseAndCanteen)}
                </li>
                {#if line.extrasTotal > 0}
                  <li>Supplementi: {formatEur(line.extrasTotal)}</li>
                {/if}
                {#if line.siblingDiscountTotal > 0}
                  <li>
                    Sconto fratelli: −{formatEur(line.siblingDiscountTotal)} ({siblingOverlapWeeks(
                      line,
                    )} sett. in comune)
                  </li>
                {/if}
                {#if line.registrationIncluded}
                  <li>Quota iscrizione: {formatEur(PRICING.registrationPerChild)}</li>
                {/if}
                <li><strong>Totale ricorrente figlio: {formatEur(line.recurringChild)}</strong></li>
              </ul>
            </li>
          {/each}
        </ul>
        <p class="detail-late-row mono">
          <strong>Iscrizione tardiva</strong>
          {#if quote.lateRegistration.amount > 0}
            · {quote.lateRegistration.qualifyingChildWeeks} × {formatEur(PRICING.lateRegistrationPerWeek)} =
            {formatEur(quote.lateRegistration.amount)}
          {:else}
            · <span class="detail-muted">{formatEur(0)}</span>
          {/if}
        </p>
      </div>
    {/if}
  </section>

  <footer class="site-footer"></footer>
</div>
