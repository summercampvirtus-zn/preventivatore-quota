/**
 * Stagione Summer Camp: anno, macro-periodi e settimane prenotabili.
 * Aggiornare qui a inizio stagione (id `mondayISO` e label coerenti con `CAMP_SEASON_YEAR`).
 * I buchi tra periodi (es. tra 7 e 17 ago) non si generano da soli: restano in `CAMP_WEEKS` esplicite.
 */
export const CAMP_SEASON_YEAR = 2026

const Y = CAMP_SEASON_YEAR

/** Macro-periodi (vincolo “a colpo d’occhio” + test di coerenza con `CAMP_WEEKS`). */
export const BOOKABLE_MACRO_PERIODS = [
  {
    id: 'p1',
    label: 'Periodo 1 (8 giu – 7 ago)',
    fromMondayISO: `${Y}-06-08`,
    throughFridayISO: `${Y}-08-07`,
  },
  {
    id: 'p2',
    label: 'Periodo 2 (17 ago – 4 set)',
    fromMondayISO: `${Y}-08-17`,
    throughFridayISO: `${Y}-09-04`,
  },
] as const

export interface CampWeek {
  id: string
  label: string
  mondayISO: string
}

export const CAMP_WEEKS: CampWeek[] = [
  // Periodo 1: 9 settimane
  { id: `w${Y}-06-08`, label: `8–12 giugno ${Y}`, mondayISO: `${Y}-06-08` },
  { id: `w${Y}-06-15`, label: `15–19 giugno ${Y}`, mondayISO: `${Y}-06-15` },
  { id: `w${Y}-06-22`, label: `22–26 giugno ${Y}`, mondayISO: `${Y}-06-22` },
  { id: `w${Y}-06-29`, label: `29 giu – 3 lug ${Y}`, mondayISO: `${Y}-06-29` },
  { id: `w${Y}-07-06`, label: `6–10 luglio ${Y}`, mondayISO: `${Y}-07-06` },
  { id: `w${Y}-07-13`, label: `13–17 luglio ${Y}`, mondayISO: `${Y}-07-13` },
  { id: `w${Y}-07-20`, label: `20–24 luglio ${Y}`, mondayISO: `${Y}-07-20` },
  { id: `w${Y}-07-27`, label: `27–31 luglio ${Y}`, mondayISO: `${Y}-07-27` },
  { id: `w${Y}-08-03`, label: `3–7 agosto ${Y}`, mondayISO: `${Y}-08-03` },
  // Periodo 2: 3 settimane
  { id: `w${Y}-08-17`, label: `17–21 agosto ${Y}`, mondayISO: `${Y}-08-17` },
  { id: `w${Y}-08-24`, label: `24–28 agosto ${Y}`, mondayISO: `${Y}-08-24` },
  { id: `w${Y}-08-31`, label: `31 ago – 4 set ${Y}`, mondayISO: `${Y}-08-31` },
]

export function campWeekById(id: string): CampWeek | undefined {
  return CAMP_WEEKS.find((w) => w.id === id)
}
