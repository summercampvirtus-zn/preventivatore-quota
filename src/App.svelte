<script lang="ts">
  import { CAMP_WEEKS } from './lib/campWeeks'
  import {
    computeQuote,
    defaultChildConfig,
    formatEur,
    normalizeChild,
    PRICING,
    SLOT_LABELS,
    SLOT_ORDER,
    type ChildConfig,
    type TimeSlot,
    type WeekAttendance,
  } from './lib/pricing'

  const MAX_CHILDREN = 6

  type Row = ChildConfig & { id: number; name: string }

  let nextId = 1
  function newRow(): Row {
    return { id: nextId++, name: '', ...defaultChildConfig() }
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

  const configs = $derived(children.map(({ name: _n, id: _i, ...c }) => normalizeChild(c)))
  const quote = $derived(computeQuote(configs))

  function reset() {
    nextId = 1
    children = [newRow()]
    detailsOpen = false
  }

  function scrollToSummary() {
    document.getElementById('riepilogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    detailsOpen = true
  }

  function weekOptionsForRow(child: Row, rowIndex: number) {
    const cur = child.attendances[rowIndex]?.weekId
    const other = new Set(
      child.attendances.map((a, i) => (i === rowIndex ? null : a.weekId)).filter(Boolean) as string[],
    )
    return CAMP_WEEKS.filter((w) => w.id === cur || !other.has(w.id))
  }

  function addAttendance(child: Row) {
    const used = new Set(child.attendances.map((a) => a.weekId))
    const next = CAMP_WEEKS.find((w) => !used.has(w.id))
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

  function onAttendanceSlotChange(a: WeekAttendance, slot: TimeSlot) {
    a.slot = slot
    if (slot !== 'full') a.canteen = false
  }
</script>

<div class="app">
  <header class="hero-stack" aria-labelledby="page-title">
    <div class="hero-brand">
      <p class="eyebrow">Polisportiva Virtus · Centri estivi</p>
      <h1 id="page-title">Preventivatore Summer Camp</h1>
    </div>
    <div class="hero-intro">
      <p class="lede">
        Tariffe <strong>settimanali</strong> del listino: per ogni settimana camp scegli la <strong>fascia</strong>
        (mattina, pomeriggio o giornata intera + mensa). Fino a {MAX_CHILDREN} figli; sconti fratelli e
        iscrizione tardiva (se applicabile) calcolati automaticamente.
      </p>
      <p class="disclaimer">
        Importi indicativi: verifica in segreteria. Eventuali maggiorazioni per <strong>assenza</strong> non
        comunicata non sono incluse qui (gestite in sede al camp). Easter:
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfBUGXXRYMp7Zw78Wz2RieTZt1dvUy6j_10isWCarTI_H86qA/viewform"
          target="_blank"
          rel="noreferrer">modulo Google</a
        >.
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
      <span class="hint">Una scheda per figlio (1–{MAX_CHILDREN}).</span>
    </div>
    <div class="toolbar-actions">
      <button type="button" class="btn primary" onclick={scrollToSummary}>Calcola / Riepilogo</button>
      <button type="button" class="btn ghost" onclick={reset}>Azzera</button>
    </div>
  </section>

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
                <select
                  id="sl-{child.id}-{j}"
                  bind:value={att.slot}
                  onchange={(e) =>
                    onAttendanceSlotChange(
                      att,
                      (e.currentTarget as HTMLSelectElement).value as TimeSlot,
                    )}
                >
                  {#each SLOT_ORDER as sk (sk)}
                    <option value={sk}>{SLOT_LABELS[sk]}</option>
                  {/each}
                </select>
              </div>
              <label class="check mensa-check" class:dim={att.slot !== 'full'}>
                <input type="checkbox" bind:checked={att.canteen} disabled={att.slot !== 'full'} />
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
      <div>
        <dt>Iscrizione ({quote.childCount} × {formatEur(PRICING.registrationPerChild)})</dt>
        <dd>{formatEur(quote.registrationTotal)}</dd>
      </div>
      <div>
        <dt>Quota figli (fino a maggiorazione tardiva)</dt>
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
      {#if quote.lateRegistration.nextWeekLabel}
        Prossima settimana camp (calendario): <strong>{quote.lateRegistration.nextWeekLabel}</strong>.
      {/if}
      Finestra tardiva attiva ora: <strong>{quote.lateRegistration.inWindow ? 'sì' : 'no'}</strong>.
      Iscrizione a quella settimana: <strong
        >{quote.lateRegistration.hasNextWeekEnrollment ? 'sì' : 'no'}</strong
      >. Settimane di frequenza totali (somma righe): <strong>{quote.totalChildWeeks}</strong>.
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
      <ul class="detail-lines">
        {#each quote.lines as line, ci}
          <li>
            <strong>{children[ci]?.name?.trim() || `Figlio ${ci + 1}`}</strong>
            <span class="mono">
              {#each line.attendanceLines as al}
                <br />{al.weekLabel}: {SLOT_LABELS[al.slot]}
                {formatEur(al.baseSlot + al.canteen)}
              {/each}
              {#if line.preschoolExtra > 0}<br />+ infanzia {formatEur(line.preschoolExtra)}{/if}
              {#if line.earlyDropoff > 0}<br />+ anticipo {formatEur(line.earlyDropoff)}{/if}
              {#if line.latePickupMorning > 0}<br />+ posticipo mattina {formatEur(line.latePickupMorning)}{/if}
              {#if line.latePickupEvening > 0}<br />+ posticipo sera {formatEur(line.latePickupEvening)}{/if}
              {#if line.siblingDiscountTotal > 0}<br />− sconto fratelli {formatEur(line.siblingDiscountTotal)}{/if}
              <br /><strong>= {formatEur(line.recurringChild)}</strong>
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <footer class="site-footer">
    <p>
      Ispirazione:
      <a href="https://www.asdludens.com/summercamp.php#calcolatore" target="_blank" rel="noreferrer"
        >Ludens</a
      >
      · Virtus · solo browser.
    </p>
  </footer>
</div>
