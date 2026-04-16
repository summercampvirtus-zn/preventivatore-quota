import { describe, it, expect } from 'vitest'
import { CAMP_WEEKS, campWeekById } from './campWeeks'

/** Periodi camp consentiti (estremi inclusi, lun-ven). */
const PERIOD_1 = { from: '2026-06-08', to: '2026-08-07' }
const PERIOD_2 = { from: '2026-08-17', to: '2026-09-04' }

function inPeriod(mondayISO: string): boolean {
  const fri = addDays(mondayISO, 4)
  return (
    (mondayISO >= PERIOD_1.from && fri <= PERIOD_1.to) ||
    (mondayISO >= PERIOD_2.from && fri <= PERIOD_2.to)
  )
}

function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function dayOfWeek(isoDate: string): number {
  return new Date(isoDate + 'T00:00:00').getDay()
}

describe('CAMP_WEEKS', () => {
  it('contiene esattamente 12 settimane', () => {
    expect(CAMP_WEEKS).toHaveLength(12)
  })

  it('ogni mondayISO è effettivamente un lunedì', () => {
    for (const w of CAMP_WEEKS) {
      expect(dayOfWeek(w.mondayISO), `${w.id} dovrebbe essere lunedì`).toBe(1)
    }
  })

  it('tutte le settimane cadono nei periodi consentiti', () => {
    for (const w of CAMP_WEEKS) {
      expect(inPeriod(w.mondayISO), `${w.id} fuori periodo`).toBe(true)
    }
  })

  it('nessun id duplicato', () => {
    const ids = CAMP_WEEKS.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('nessun mondayISO duplicato', () => {
    const mondays = CAMP_WEEKS.map((w) => w.mondayISO)
    expect(new Set(mondays).size).toBe(mondays.length)
  })

  it('sono ordinate cronologicamente', () => {
    for (let i = 1; i < CAMP_WEEKS.length; i++) {
      expect(CAMP_WEEKS[i].mondayISO > CAMP_WEEKS[i - 1].mondayISO).toBe(true)
    }
  })
})

describe('campWeekById', () => {
  it('restituisce la settimana corretta', () => {
    const w = campWeekById('w2026-07-06')
    expect(w).toBeDefined()
    expect(w!.mondayISO).toBe('2026-07-06')
  })

  it('restituisce undefined per id inesistente', () => {
    expect(campWeekById('w2099-01-01')).toBeUndefined()
  })
})
