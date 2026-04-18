import type { CampWeek } from './campWeeks'
import { CAMP_WEEKS, campWeekById } from './campWeeks'

export type TimeSlot = 'morning' | 'afternoon' | 'full'

export interface WeekAttendance {
  weekId: string
  slot: TimeSlot
  canteen: boolean
}

export interface ChildConfig {
  attendances: WeekAttendance[]
  preschool: boolean
  earlyDropoff: boolean
  latePickupMorning: boolean
  latePickupEvening: boolean
  /** Se true, nel totale entra la quota iscrizione per questo figlio. */
  includeRegistration: boolean
}

export const PRICING = {
  slotMorning: 40,
  slotAfternoon: 25,
  slotFull: 65,
  canteen: 30,
  preschoolExtra: 5,
  earlyDropoff: 5,
  latePickup: 5,
  lateRegistrationPerWeek: 10,
  registrationPerChild: 15,
} as const

export const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Mattina (8:00–13:00)',
  afternoon: 'Pomeriggio (13:30–17:00)',
  full: 'Giornata intera (8:00–17:00)',
}

export const SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'full']

export function siblingDiscountPerWeek(childIndex: number): number {
  const tier = [0, 10, 15, 20, 20, 20]
  return tier[Math.min(childIndex, tier.length - 1)] ?? 0
}

function baseSlotPrice(slot: TimeSlot): number {
  switch (slot) {
    case 'morning':
      return PRICING.slotMorning
    case 'afternoon':
      return PRICING.slotAfternoon
    case 'full':
      return PRICING.slotFull
  }
}

function normalizeAttendance(a: WeekAttendance): WeekAttendance {
  return {
    weekId: a.weekId,
    slot: a.slot,
    canteen: Boolean(a.canteen),
  }
}

function mondayOfWeekContaining(d: Date): Date {
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const res = new Date(y, m, day + diff)
  res.setHours(0, 0, 0, 0)
  return res
}

function startOfNextCalendarWeek(d: Date): Date {
  const m0 = mondayOfWeekContaining(d)
  const next = new Date(m0)
  next.setDate(next.getDate() + 7)
  return next
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

export function firstCampWeekOnOrAfter(mondayStart: string): CampWeek | undefined {
  const sorted = [...CAMP_WEEKS].sort((a, b) => a.mondayISO.localeCompare(b.mondayISO))
  return sorted.find((w) => w.mondayISO >= mondayStart)
}

export function nextCampWeekAfterCurrentCalendarWeek(now: Date): CampWeek | undefined {
  const targetMonday = toYMD(startOfNextCalendarWeek(now))
  return firstCampWeekOnOrAfter(targetMonday)
}

/** Venerdì 00:01 precedente al lunedì di inizio settimana camp (inizio finestra iscrizione tardiva). */
function fridayLateWindowStart(mondayISO: string): Date {
  const [yy, mm, dd] = mondayISO.split('-').map(Number)
  const monday = new Date(yy, mm - 1, dd, 0, 0, 0, 0)
  const fri = new Date(monday)
  fri.setDate(fri.getDate() - 3)
  fri.setHours(0, 1, 0, 0)
  return fri
}

function mondaySevenThirtyAm(mondayISO: string): Date {
  const [yy, mm, dd] = mondayISO.split('-').map(Number)
  return new Date(yy, mm - 1, dd, 7, 30, 0, 0)
}

/** Iscrizione alla settimana camp consentita fino a lunedì 07:30 (escluso) del suo lunedì di inizio. */
export function isCampWeekEnrollable(week: CampWeek, now: Date): boolean {
  return now.getTime() < mondaySevenThirtyAm(week.mondayISO).getTime()
}

/** Settimane ancora iscrivibili; se nessuna (stagione passata), tutte le settimane come fallback. */
export function enrollableCampWeeks(now: Date): CampWeek[] {
  const open = CAMP_WEEKS.filter((w) => isCampWeekEnrollable(w, now))
  return open.length > 0 ? open : [...CAMP_WEEKS]
}

function remapAttendancesForEnrollmentDeadline(
  attendances: WeekAttendance[],
  now: Date,
): WeekAttendance[] {
  const pool = enrollableCampWeeks(now)
  const used = new Set<string>()
  const out: WeekAttendance[] = []

  function pickNext(): CampWeek | undefined {
    return pool.find((w) => !used.has(w.id))
  }

  for (const a of attendances) {
    const wk = campWeekById(a.weekId)
    const keep = wk && isCampWeekEnrollable(wk, now) && !used.has(a.weekId)
    if (keep) {
      used.add(a.weekId)
      out.push(normalizeAttendance(a))
      continue
    }
    const p = pickNext()
    if (!p) break
    used.add(p.id)
    out.push(normalizeAttendance({ ...a, weekId: p.id }))
  }

  if (out.length === 0 && pool[0]) {
    out.push({ weekId: pool[0].id, slot: 'full', canteen: false })
  }
  return out
}

export function normalizeChild(c: ChildConfig, now?: Date): ChildConfig {
  let attendances = (c.attendances?.length ? c.attendances : []).map(normalizeAttendance)
  const validIds = new Set(CAMP_WEEKS.map((w) => w.id))
  attendances = attendances.filter((a) => validIds.has(a.weekId))

  const fallbackWeek = (): CampWeek | undefined => {
    if (now != null) return enrollableCampWeeks(now)[0]
    return CAMP_WEEKS[0]
  }

  if (attendances.length === 0) {
    const fb = fallbackWeek()
    if (fb) attendances = [{ weekId: fb.id, slot: 'full', canteen: false }]
  }

  if (now != null) {
    attendances = remapAttendancesForEnrollmentDeadline(attendances, now)
  }

  if (attendances.length === 0) {
    const fb = fallbackWeek()
    if (fb) attendances = [{ weekId: fb.id, slot: 'full', canteen: false }]
  }

  return {
    ...c,
    attendances,
    includeRegistration: Boolean(c.includeRegistration),
  }
}

export function defaultChildConfig(now?: Date): ChildConfig {
  const first = now ? enrollableCampWeeks(now)[0] : CAMP_WEEKS[0]
  return {
    attendances: first ? [{ weekId: first.id, slot: 'full', canteen: false }] : [],
    preschool: false,
    earlyDropoff: false,
    latePickupMorning: false,
    latePickupEvening: false,
    includeRegistration: false,
  }
}

export function isInLateRegistrationWindow(now: Date, targetWeek: CampWeek): boolean {
  const start = fridayLateWindowStart(targetWeek.mondayISO)
  const end = mondaySevenThirtyAm(targetWeek.mondayISO)
  return now.getTime() >= start.getTime() && now.getTime() < end.getTime()
}

export interface LateRegistrationResult {
  amount: number
  qualifyingChildWeeks: number
  nextWeekId: string | null
  nextWeekLabel: string | null
  inWindow: boolean
  hasNextWeekEnrollment: boolean
}

export function computeLateRegistrationSurcharge(
  now: Date,
  children: ChildConfig[],
): LateRegistrationResult {
  let qualifying = 0
  let refFromEnrollment: CampWeek | undefined

  for (const ch of children) {
    const n = normalizeChild(ch, now)
    for (const a of n.attendances) {
      const wk = campWeekById(a.weekId)
      if (wk && isInLateRegistrationWindow(now, wk)) {
        qualifying += 1
        refFromEnrollment ??= wk
      }
    }
  }

  const inWindow = CAMP_WEEKS.some((w) => isInLateRegistrationWindow(now, w))
  const amount = qualifying * PRICING.lateRegistrationPerWeek

  const refWeek =
    refFromEnrollment ?? CAMP_WEEKS.find((w) => isInLateRegistrationWindow(now, w))

  return {
    amount,
    qualifyingChildWeeks: qualifying,
    nextWeekId: refWeek?.id ?? null,
    nextWeekLabel: refWeek?.label ?? null,
    inWindow,
    hasNextWeekEnrollment: qualifying > 0,
  }
}

export interface AttendanceLineDetail {
  weekId: string
  weekLabel: string
  slot: TimeSlot
  baseSlot: number
  canteen: number
}

export interface ChildLineDetail {
  index: number
  weekCount: number
  attendanceLines: AttendanceLineDetail[]
  preschoolExtra: number
  earlyDropoff: number
  latePickupMorning: number
  latePickupEvening: number
  sumBaseAndCanteen: number
  extrasTotal: number
  siblingDiscountPerWeek: number
  siblingDiscountTotal: number
  weeklyGross: number
  weeklyNet: number
  recurringChild: number
  registrationIncluded: boolean
}

export interface QuoteResult {
  childCount: number
  registrationTotal: number
  /** Figli con quota iscrizione inclusa nel totale. */
  registrationPayerCount: number
  weeklyRecurringNet: number
  recurringTotal: number
  lateRegistration: LateRegistrationResult
  total: number
  lines: ChildLineDetail[]
  totalChildWeeks: number
}

/** Opzioni secondo argomento di `computeQuote`. */
export interface ComputeQuoteOptions {
  now?: Date
}

/** Sconto fratelli (€) solo sulle settimane in cui un altro figlio ha la stessa `weekId`. */
function siblingDiscountTotalForChild(
  childIndex: number,
  normalized: ChildConfig[],
): number {
  const tier = siblingDiscountPerWeek(childIndex)
  if (tier === 0) return 0
  const self = normalized[childIndex]
  if (!self) return 0
  let overlapRows = 0
  for (const att of self.attendances) {
    const shared = normalized.some(
      (other, j) =>
        j !== childIndex &&
        other.attendances.some((a) => a.weekId === att.weekId),
    )
    if (shared) overlapRows += 1
  }
  return tier * overlapRows
}

function posticipoMorningForRow(slot: TimeSlot, flag: boolean): number {
  if (!flag) return 0
  return slot === 'morning' || slot === 'full' ? PRICING.latePickup : 0
}

function posticipoEveningForRow(slot: TimeSlot, flag: boolean): number {
  if (!flag) return 0
  return slot === 'afternoon' || slot === 'full' ? PRICING.latePickup : 0
}

export function computeQuote(
  children: ChildConfig[],
  options?: ComputeQuoteOptions,
): QuoteResult {
  const now = options?.now ?? new Date()
  const normalized = children.map((c) => normalizeChild(c, now))
  const n = normalized.length
  const registrationPayerCount = normalized.filter((c) => c.includeRegistration).length
  const registrationTotal = registrationPayerCount * PRICING.registrationPerChild
  const late = computeLateRegistrationSurcharge(now, normalized)

  const lines: ChildLineDetail[] = normalized.map((c, index) => {
    const W = c.attendances.length
    const attendanceLines: AttendanceLineDetail[] = c.attendances.map((a) => {
      const wk = campWeekById(a.weekId)
      const base = baseSlotPrice(a.slot)
      const cant = a.canteen ? PRICING.canteen : 0
      return {
        weekId: a.weekId,
        weekLabel: wk?.label ?? a.weekId,
        slot: a.slot,
        baseSlot: base,
        canteen: cant,
      }
    })

    const sumBaseAndCanteen = attendanceLines.reduce(
      (s, r) => s + r.baseSlot + r.canteen,
      0,
    )

    let lateMorning = 0
    let lateEvening = 0
    if (c.latePickupMorning) {
      lateMorning = c.attendances.reduce(
        (s, a) => s + posticipoMorningForRow(a.slot, true),
        0,
      )
    }
    if (c.latePickupEvening) {
      lateEvening = c.attendances.reduce(
        (s, a) => s + posticipoEveningForRow(a.slot, true),
        0,
      )
    }

    const preschoolExtra = c.preschool ? W * PRICING.preschoolExtra : 0
    const earlyDropoff = c.earlyDropoff ? W * PRICING.earlyDropoff : 0

    const extrasTotal = preschoolExtra + earlyDropoff + lateMorning + lateEvening
    const discPerWeek = siblingDiscountPerWeek(index)
    const siblingDiscountTotal = siblingDiscountTotalForChild(index, normalized)
    const weeklyGross = sumBaseAndCanteen + extrasTotal
    const recurringChild = weeklyGross - siblingDiscountTotal
    const weeklyNet = W > 0 ? recurringChild / W : 0

    return {
      index,
      weekCount: W,
      attendanceLines,
      preschoolExtra,
      earlyDropoff,
      latePickupMorning: lateMorning,
      latePickupEvening: lateEvening,
      sumBaseAndCanteen,
      extrasTotal,
      siblingDiscountPerWeek: discPerWeek,
      siblingDiscountTotal,
      weeklyGross,
      weeklyNet,
      recurringChild,
      registrationIncluded: Boolean(c.includeRegistration),
    }
  })

  const weeklyRecurringNet = lines.reduce((s, l) => s + l.weeklyNet * l.weekCount, 0)
  const recurringFromChildren = lines.reduce((s, l) => s + l.recurringChild, 0)
  const recurringTotal = recurringFromChildren + late.amount
  const totalChildWeeks = lines.reduce((s, l) => s + l.weekCount, 0)
  const total = registrationTotal + recurringTotal

  return {
    childCount: n,
    registrationTotal,
    registrationPayerCount,
    weeklyRecurringNet,
    recurringTotal,
    lateRegistration: late,
    total,
    lines,
    totalChildWeeks,
  }
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}
