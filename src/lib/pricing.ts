/** Fascia oraria settimanale (tariffe volantino Summer). */
export type TimeSlot = 'morning' | 'afternoon' | 'full'

export interface ChildConfig {
  /** Settimane di frequenza per questo figlio (moltiplica la sua quota settimanale). */
  weeks: number
  slot: TimeSlot
  preschool: boolean
  canteen: boolean
  earlyDropoff: boolean
  latePickup: boolean
  lateRegistration: boolean
  undeclaredAbsence: boolean
}

export const PRICING = {
  slotMorning: 40,
  slotAfternoon: 25,
  slotFull: 65,
  canteen: 30,
  preschoolExtra: 5,
  earlyDropoff: 5,
  latePickup: 5,
  lateRegistration: 10,
  undeclaredAbsence: 10,
  registrationPerChild: 15,
  siblingDiscountPerWeek: 10,
} as const

export const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Mattina (8:00–13:00)',
  afternoon: 'Pomeriggio (13:30–17:00)',
  full: 'Giornata intera (8:00–17:00)',
}

/** Ordine opzioni nel select. */
export const SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'full']

export function defaultChildConfig(): ChildConfig {
  return {
    weeks: 1,
    slot: 'morning',
    preschool: false,
    canteen: false,
    earlyDropoff: false,
    latePickup: false,
    lateRegistration: false,
    undeclaredAbsence: false,
  }
}

/** Settimane: minimo 1, massimo 52; non numerico o fuori range → 1. */
export function clampWeeks(w: unknown): number {
  const raw = Math.floor(Number(w))
  if (!Number.isFinite(raw)) return 1
  return Math.min(52, Math.max(1, raw))
}

export function normalizeChild(c: ChildConfig): ChildConfig {
  return {
    ...c,
    weeks: clampWeeks(c.weeks),
    canteen: c.slot === 'full' && c.canteen,
  }
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

export interface ChildLineDetail {
  index: number
  weeks: number
  baseSlot: number
  preschoolExtra: number
  canteen: number
  earlyDropoff: number
  latePickup: number
  lateRegistration: number
  undeclaredAbsence: number
  weeklyGross: number
  siblingDiscount: number
  weeklyNet: number
  /** weeklyNet × weeks */
  recurringChild: number
}

export interface QuoteResult {
  childCount: number
  registrationTotal: number
  /** Somma delle tariffe settimanali nette (come se ciascuno facesse 1 settimana). */
  weeklyRecurringNet: number
  /** Somma (tariffa settimanale netta × settimane) per ogni figlio. */
  recurringTotal: number
  total: number
  lines: ChildLineDetail[]
  /** Somma delle settimane inserite (tutti i figli). */
  totalChildWeeks: number
}

/**
 * Calcolo puro: iscrizione una tantum + per ogni figlio (quota settimanale netta × sue settimane).
 */
export function computeQuote(children: ChildConfig[]): QuoteResult {
  const normalized = children.map(normalizeChild)
  const n = normalized.length

  const registrationTotal = n * PRICING.registrationPerChild

  const lines: ChildLineDetail[] = normalized.map((c, index) => {
    const weeksForChild = c.weeks
    const baseSlot = baseSlotPrice(c.slot)
    let weeklyGross = baseSlot

    const preschoolExtra = c.preschool ? PRICING.preschoolExtra : 0
    weeklyGross += preschoolExtra

    const canteen = c.slot === 'full' && c.canteen ? PRICING.canteen : 0
    weeklyGross += canteen

    const earlyDropoff = c.earlyDropoff ? PRICING.earlyDropoff : 0
    weeklyGross += earlyDropoff

    const latePickup = c.latePickup ? PRICING.latePickup : 0
    weeklyGross += latePickup

    const lateRegistration = c.lateRegistration ? PRICING.lateRegistration : 0
    weeklyGross += lateRegistration

    const undeclaredAbsence = c.undeclaredAbsence ? PRICING.undeclaredAbsence : 0
    weeklyGross += undeclaredAbsence

    const siblingDiscount =
      index > 0 ? PRICING.siblingDiscountPerWeek : 0
    const weeklyNet = weeklyGross - siblingDiscount
    const recurringChild = weeklyNet * weeksForChild

    return {
      index,
      weeks: weeksForChild,
      baseSlot,
      preschoolExtra,
      canteen,
      earlyDropoff,
      latePickup,
      lateRegistration,
      undeclaredAbsence,
      weeklyGross,
      siblingDiscount,
      weeklyNet,
      recurringChild,
    }
  })

  const weeklyRecurringNet = lines.reduce((s, l) => s + l.weeklyNet, 0)
  const recurringTotal = lines.reduce((s, l) => s + l.recurringChild, 0)
  const totalChildWeeks = lines.reduce((s, l) => s + l.weeks, 0)
  const total = registrationTotal + recurringTotal

  return {
    childCount: n,
    registrationTotal,
    weeklyRecurringNet,
    recurringTotal,
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
