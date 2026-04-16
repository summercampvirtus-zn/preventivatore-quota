import { describe, it, expect } from 'vitest'
import { CAMP_WEEKS } from './campWeeks'
import {
  siblingDiscountPerWeek,
  normalizeChild,
  isInLateRegistrationWindow,
  computeLateRegistrationSurcharge,
  computeQuote,
  PRICING,
  type ChildConfig,
} from './pricing'

const W1 = CAMP_WEEKS[0].id
const W2 = CAMP_WEEKS[1].id

/** Fuori da qualsiasi finestra tardiva, per test di quote puliti. */
const SAFE_NOW = new Date(2026, 4, 1)

function mkChild(ov: Partial<ChildConfig> = {}): ChildConfig {
  return {
    attendances: [{ weekId: W1, slot: 'full', canteen: false }],
    preschool: false,
    earlyDropoff: false,
    latePickupMorning: false,
    latePickupEvening: false,
    ...ov,
  }
}

// ---------------------------------------------------------------------------
// siblingDiscountPerWeek
// ---------------------------------------------------------------------------
describe('siblingDiscountPerWeek', () => {
  it.each([
    [0, 0],
    [1, 10],
    [2, 15],
    [3, 20],
    [4, 20],
    [5, 20],
    [99, 20],
  ])('childIndex %i → sconto %i', (idx, expected) => {
    expect(siblingDiscountPerWeek(idx)).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// normalizeChild
// ---------------------------------------------------------------------------
describe('normalizeChild', () => {
  it('canteen forzata a false se slot != full', () => {
    const c = mkChild({
      attendances: [{ weekId: W1, slot: 'morning', canteen: true }],
    })
    expect(normalizeChild(c).attendances[0].canteen).toBe(false)
  })

  it('canteen mantenuta se slot è full', () => {
    const c = mkChild({
      attendances: [{ weekId: W1, slot: 'full', canteen: true }],
    })
    expect(normalizeChild(c).attendances[0].canteen).toBe(true)
  })

  it('rimuove weekId inesistenti e fallback alla prima settimana', () => {
    const c = mkChild({
      attendances: [{ weekId: 'w-fake', slot: 'full', canteen: false }],
    })
    const n = normalizeChild(c)
    expect(n.attendances).toHaveLength(1)
    expect(n.attendances[0].weekId).toBe(CAMP_WEEKS[0].id)
  })
})

// ---------------------------------------------------------------------------
// isInLateRegistrationWindow
// ---------------------------------------------------------------------------
describe('isInLateRegistrationWindow', () => {
  // w2026-07-06 = lun 6 luglio. Finestra: ven 3/7 00:00 → lun 6/7 07:30.
  const week = CAMP_WEEKS.find((w) => w.id === 'w2026-07-06')!

  it('giovedì 23:59 → false (prima della finestra)', () => {
    expect(isInLateRegistrationWindow(new Date(2026, 6, 2, 23, 59, 59), week)).toBe(false)
  })

  it('venerdì 00:00 → true (inizio finestra)', () => {
    expect(isInLateRegistrationWindow(new Date(2026, 6, 3, 0, 0, 0), week)).toBe(true)
  })

  it('sabato 12:00 → true', () => {
    expect(isInLateRegistrationWindow(new Date(2026, 6, 4, 12, 0, 0), week)).toBe(true)
  })

  it('domenica 18:00 → true', () => {
    expect(isInLateRegistrationWindow(new Date(2026, 6, 5, 18, 0, 0), week)).toBe(true)
  })

  it('lunedì 07:29 → true', () => {
    expect(isInLateRegistrationWindow(new Date(2026, 6, 6, 7, 29, 0), week)).toBe(true)
  })

  it('lunedì 07:30 → false (boundary esatto)', () => {
    expect(isInLateRegistrationWindow(new Date(2026, 6, 6, 7, 30, 0), week)).toBe(false)
  })

  it('lunedì 08:00 → false', () => {
    expect(isInLateRegistrationWindow(new Date(2026, 6, 6, 8, 0, 0), week)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// computeLateRegistrationSurcharge
// ---------------------------------------------------------------------------
describe('computeLateRegistrationSurcharge', () => {
  const enrolled = mkChild({
    attendances: [{ weekId: 'w2026-07-06', slot: 'full', canteen: false }],
  })

  it('in finestra + iscritto → maggiorazione', () => {
    const sat = new Date(2026, 6, 4, 10, 0, 0)
    const r = computeLateRegistrationSurcharge(sat, [enrolled])
    expect(r.inWindow).toBe(true)
    expect(r.hasNextWeekEnrollment).toBe(true)
    expect(r.amount).toBe(PRICING.lateRegistrationPerWeek)
  })

  it('in finestra + non iscritto a quella settimana → 0', () => {
    const sat = new Date(2026, 6, 4, 10, 0, 0)
    const other = mkChild({
      attendances: [{ weekId: 'w2026-08-03', slot: 'full', canteen: false }],
    })
    const r = computeLateRegistrationSurcharge(sat, [other])
    expect(r.inWindow).toBe(true)
    expect(r.amount).toBe(0)
  })

  it('fuori finestra + iscritto → 0', () => {
    const wed = new Date(2026, 6, 1, 10, 0, 0)
    const r = computeLateRegistrationSurcharge(wed, [enrolled])
    expect(r.inWindow).toBe(false)
    expect(r.amount).toBe(0)
  })

  it('2 figli iscritti → doppia maggiorazione', () => {
    const sat = new Date(2026, 6, 4, 10, 0, 0)
    const r = computeLateRegistrationSurcharge(sat, [enrolled, enrolled])
    expect(r.qualifyingChildWeeks).toBe(2)
    expect(r.amount).toBe(2 * PRICING.lateRegistrationPerWeek)
  })
})

// ---------------------------------------------------------------------------
// computeQuote – end-to-end
// ---------------------------------------------------------------------------
describe('computeQuote', () => {
  it('1 figlio, 1 sett., solo mattina', () => {
    const c = mkChild({
      attendances: [{ weekId: W1, slot: 'morning', canteen: false }],
    })
    const q = computeQuote([c], SAFE_NOW)
    expect(q.registrationTotal).toBe(15)
    expect(q.lines[0].sumBaseAndCanteen).toBe(40)
    expect(q.lines[0].recurringChild).toBe(40)
    expect(q.total).toBe(55)
  })

  it('1 figlio, giornata intera + mensa', () => {
    const c = mkChild({
      attendances: [{ weekId: W1, slot: 'full', canteen: true }],
    })
    const q = computeQuote([c], SAFE_NOW)
    expect(q.lines[0].sumBaseAndCanteen).toBe(95)
    expect(q.total).toBe(15 + 95)
  })

  it('2 figli, sconto fratello al secondo', () => {
    const q = computeQuote([mkChild(), mkChild()], SAFE_NOW)
    expect(q.registrationTotal).toBe(30)
    expect(q.lines[0].siblingDiscountPerWeek).toBe(0)
    expect(q.lines[1].siblingDiscountPerWeek).toBe(10)
    expect(q.lines[0].recurringChild).toBe(65)
    expect(q.lines[1].recurringChild).toBe(55)
    expect(q.total).toBe(30 + 65 + 55)
  })

  it('tutti gli extra su giornata intera', () => {
    const c = mkChild({
      preschool: true,
      earlyDropoff: true,
      latePickupMorning: true,
      latePickupEvening: true,
    })
    const q = computeQuote([c], SAFE_NOW)
    const l = q.lines[0]
    expect(l.preschoolExtra).toBe(5)
    expect(l.earlyDropoff).toBe(5)
    expect(l.latePickupMorning).toBe(5)
    expect(l.latePickupEvening).toBe(5)
    expect(l.extrasTotal).toBe(20)
    expect(l.recurringChild).toBe(65 + 20)
  })

  it('posticipo mattina non si applica a pomeriggio', () => {
    const c = mkChild({
      attendances: [{ weekId: W1, slot: 'afternoon', canteen: false }],
      latePickupMorning: true,
    })
    expect(computeQuote([c], SAFE_NOW).lines[0].latePickupMorning).toBe(0)
  })

  it('posticipo sera non si applica a mattina', () => {
    const c = mkChild({
      attendances: [{ weekId: W1, slot: 'morning', canteen: false }],
      latePickupEvening: true,
    })
    expect(computeQuote([c], SAFE_NOW).lines[0].latePickupEvening).toBe(0)
  })

  it('più settimane sommano correttamente', () => {
    const c = mkChild({
      attendances: [
        { weekId: W1, slot: 'morning', canteen: false },
        { weekId: W2, slot: 'full', canteen: true },
      ],
    })
    const q = computeQuote([c], SAFE_NOW)
    expect(q.lines[0].weekCount).toBe(2)
    expect(q.lines[0].sumBaseAndCanteen).toBe(40 + 65 + 30)
    expect(q.total).toBe(15 + 135)
  })

  it('maggiorazione tardiva inclusa nel totale', () => {
    const sat = new Date(2026, 6, 4, 10, 0, 0)
    const c = mkChild({
      attendances: [{ weekId: 'w2026-07-06', slot: 'full', canteen: false }],
    })
    const q = computeQuote([c], sat)
    expect(q.lateRegistration.amount).toBe(10)
    expect(q.total).toBe(15 + 65 + 10)
  })
})
