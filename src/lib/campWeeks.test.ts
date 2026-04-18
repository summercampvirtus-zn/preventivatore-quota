import { describe, it, expect } from 'vitest'
import {
  BOOKABLE_MACRO_PERIODS,
  CAMP_SEASON_YEAR,
  CAMP_WEEKS,
  campWeekById,
} from './campWeeks'

function inPeriod(mondayISO: string): boolean {
  const fri = addDays(mondayISO, 4)
  return BOOKABLE_MACRO_PERIODS.some(
    (p) => mondayISO >= p.fromMondayISO && fri <= p.throughFridayISO,
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

  it('BOOKABLE_MACRO_PERIODS copre due blocchi', () => {
    expect(BOOKABLE_MACRO_PERIODS).toHaveLength(2)
    expect(BOOKABLE_MACRO_PERIODS[0].id).toBe('p1')
    expect(BOOKABLE_MACRO_PERIODS[1].id).toBe('p2')
  })
})

describe('campWeekById', () => {
  it('restituisce la settimana corretta', () => {
    const id = `w${CAMP_SEASON_YEAR}-07-06`
    const w = campWeekById(id)
    expect(w).toBeDefined()
    expect(w!.mondayISO).toBe(`${CAMP_SEASON_YEAR}-07-06`)
  })

  it('restituisce undefined per id inesistente', () => {
    expect(campWeekById('w2099-01-01')).toBeUndefined()
  })
})
