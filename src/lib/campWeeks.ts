/** Settimane Summer Camp (lunedì di inizio; aggiornare le date ogni stagione). */
export interface CampWeek {
  id: string
  label: string
  mondayISO: string
}

export const CAMP_WEEKS: CampWeek[] = [
  // Periodo 1: 8 giu – 7 ago (9 settimane)
  { id: 'w2026-06-08', label: '8–12 giugno 2026', mondayISO: '2026-06-08' },
  { id: 'w2026-06-15', label: '15–19 giugno 2026', mondayISO: '2026-06-15' },
  { id: 'w2026-06-22', label: '22–26 giugno 2026', mondayISO: '2026-06-22' },
  { id: 'w2026-06-29', label: '29 giu – 3 lug 2026', mondayISO: '2026-06-29' },
  { id: 'w2026-07-06', label: '6–10 luglio 2026', mondayISO: '2026-07-06' },
  { id: 'w2026-07-13', label: '13–17 luglio 2026', mondayISO: '2026-07-13' },
  { id: 'w2026-07-20', label: '20–24 luglio 2026', mondayISO: '2026-07-20' },
  { id: 'w2026-07-27', label: '27–31 luglio 2026', mondayISO: '2026-07-27' },
  { id: 'w2026-08-03', label: '3–7 agosto 2026', mondayISO: '2026-08-03' },
  // Periodo 2: 17 ago – 4 set (3 settimane)
  { id: 'w2026-08-17', label: '17–21 agosto 2026', mondayISO: '2026-08-17' },
  { id: 'w2026-08-24', label: '24–28 agosto 2026', mondayISO: '2026-08-24' },
  { id: 'w2026-08-31', label: '31 ago – 4 set 2026', mondayISO: '2026-08-31' },
]

export function campWeekById(id: string): CampWeek | undefined {
  return CAMP_WEEKS.find((w) => w.id === id)
}
