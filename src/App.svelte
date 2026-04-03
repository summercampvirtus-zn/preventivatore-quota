<script lang="ts">
  import {
    clampWeeks,
    computeQuote,
    defaultChildConfig,
    formatEur,
    normalizeChild,
    PRICING,
    SLOT_LABELS,
    SLOT_ORDER,
    type ChildConfig,
    type TimeSlot,
  } from './lib/pricing'

  const MAX_CHILDREN = 6

  type Row = ChildConfig & { id: number; name: string }

  let nextId = 1
  function newRow(): Row {
    return { id: nextId++, name: '', ...defaultChildConfig() }
  }

  let children = $state<Row[]>([newRow()])
  let detailsOpen = $state(false)

  /** `children.length` è l’unica fonte di verità: il select si aggancia a essa per evitare disallineamenti. */
  function setNumFigli(count: number) {
    const n = Math.min(MAX_CHILDREN, Math.max(1, Math.floor(count)))
    if (children.length < n) {
      const extra: Row[] = []
      while (children.length + extra.length < n) {
        extra.push(newRow())
      }
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
    document.getElementById('riepilogo')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    detailsOpen = true
  }

  function onSlotChange(child: Row, slot: TimeSlot) {
    child.slot = slot
    if (slot !== 'full') child.canteen = false
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
        Stima il costo in base al volantino: tariffe <strong>settimanali</strong>, fino a
        {MAX_CHILDREN} figli. Ogni figlio ha le <strong>sue settimane</strong> di frequenza.
        Iscrizione una tantum e sconto fratelli inclusi nel calcolo.
      </p>
      <p class="disclaimer">
        Importi indicativi: verifica sempre in segreteria. Per altri camp (es. Easter) usa il
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfBUGXXRYMp7Zw78Wz2RieTZt1dvUy6j_10isWCarTI_H86qA/viewform"
          target="_blank"
          rel="noreferrer">modulo Google ufficiale</a
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
      <label for="num-figli">Quanti figli vuoi inserire?</label>
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
      <span class="hint"
        >Vengono mostrate tante schede quanti figli selezioni (da 1 a {MAX_CHILDREN}).</span
      >
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
          <h2>
            {child.name.trim() ? child.name : `Figlio ${i + 1}`}
          </h2>
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

        <div class="field field-inline">
          <div>
            <label for="weeks-{child.id}">Settimane di frequenza</label>
            <input
              id="weeks-{child.id}"
              type="number"
              min="1"
              max="52"
              step="1"
              bind:value={child.weeks}
              onblur={() => {
                child.weeks = clampWeeks(child.weeks)
              }}
            />
          </div>
          <span class="hint inline-hint"
            >Minimo <strong>1</strong> settimana. Moltiplica la quota settimanale di questo figlio
            (fascia, opzioni, sconto fratello).</span
          >
        </div>

        <div class="field">
          <label for="slot-{child.id}">Fascia oraria</label>
          <select
            id="slot-{child.id}"
            bind:value={child.slot}
            onchange={(e) =>
              onSlotChange(child, (e.currentTarget as HTMLSelectElement).value as TimeSlot)}
          >
            {#each SLOT_ORDER as slotKey (slotKey)}
              <option value={slotKey}>{SLOT_LABELS[slotKey]}</option>
            {/each}
          </select>
        </div>

        <fieldset class="toggles">
          <legend>Opzioni e maggiorazioni (settimanali)</legend>
          <label class="check">
            <input type="checkbox" bind:checked={child.preschool} />
            <span>Scuola dell’infanzia (+{formatEur(PRICING.preschoolExtra)}/sett.)</span>
          </label>
          <label class="check" class:dim={child.slot !== 'full'}>
            <input
              type="checkbox"
              bind:checked={child.canteen}
              disabled={child.slot !== 'full'}
            />
            <span>Servizio mensa (+{formatEur(PRICING.canteen)}/sett., solo giornata intera)</span>
          </label>
          <label class="check">
            <input type="checkbox" bind:checked={child.earlyDropoff} />
            <span>Anticipo 7:30–8:00 (+{formatEur(PRICING.earlyDropoff)}/sett.)</span>
          </label>
          <label class="check">
            <input type="checkbox" bind:checked={child.latePickup} />
            <span>Posticipo (+{formatEur(PRICING.latePickup)}/sett.)</span>
          </label>
          <label class="check">
            <input type="checkbox" bind:checked={child.lateRegistration} />
            <span>Iscrizione tardiva (+{formatEur(PRICING.lateRegistration)}/sett.)</span>
          </label>
          <label class="check">
            <input type="checkbox" bind:checked={child.undeclaredAbsence} />
            <span>Maggiorazione assenza non comunicata (+{formatEur(PRICING.undeclaredAbsence)}/sett.)</span
            >
          </label>
        </fieldset>

        <p class="child-subtotal">
          Netto <strong>{formatEur(quote.lines[i]?.weeklyNet ?? 0)}</strong>/sett.
          × <strong>{quote.lines[i]?.weeks ?? 0}</strong> sett.
          = <strong>{formatEur(quote.lines[i]?.recurringChild ?? 0)}</strong> (parte ricorrente questo figlio)
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
        <dt>Totale ricorrente</dt>
        <dd>{formatEur(quote.recurringTotal)}</dd>
      </div>
    </dl>
    <p class="totals-explain">
      Somma di <strong>(quota settimanale netta × settimane)</strong> per ciascun figlio. Settimane
      complessive (somma): <strong>{quote.totalChildWeeks}</strong>.
    </p>
    <dl class="totals totals-tail">
      <div class="totals-ref">
        <dt>Riferimento: somma quote settimanali (1 sett. ciascuno)</dt>
        <dd>{formatEur(quote.weeklyRecurringNet)}</dd>
      </div>
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
        {#each quote.lines as line, i}
          <li>
            <strong>{children[i]?.name?.trim() || `Figlio ${i + 1}`}</strong>
            <span class="mono">
              base {formatEur(line.baseSlot)}
              {#if line.preschoolExtra}+ infanzia {formatEur(line.preschoolExtra)}{/if}
              {#if line.canteen}+ mensa {formatEur(line.canteen)}{/if}
              {#if line.earlyDropoff}+ anticipo {formatEur(line.earlyDropoff)}{/if}
              {#if line.latePickup}+ posticipo {formatEur(line.latePickup)}{/if}
              {#if line.lateRegistration}+ tardiva {formatEur(line.lateRegistration)}{/if}
              {#if line.undeclaredAbsence}+ assenza {formatEur(line.undeclaredAbsence)}{/if}
              {#if line.siblingDiscount > 0}
                − sconto fratello {formatEur(line.siblingDiscount)}
              {/if}
              → <strong>{formatEur(line.weeklyNet)}/sett.</strong>
              × {line.weeks} sett.
              = <strong>{formatEur(line.recurringChild)}</strong>
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <footer class="site-footer">
    <p>
      Ispirazione flusso:
      <a href="https://www.asdludens.com/summercamp.php#calcolatore" target="_blank" rel="noreferrer"
        >calcolatore Ludens</a
      >
      · Summer Camp Virtus · preventivo solo lato browser (nessun invio dati).
    </p>
  </footer>
</div>
