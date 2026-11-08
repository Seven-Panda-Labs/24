export const STATUSES = ['planned', 'bought', 'wrapped'] as const
export type Status = (typeof STATUSES)[number]

/** A gift, on a day of the calendar or in its sack. */
export interface Day {
  gift: string
  status: Status
  tagIds: string[]
  notes: string
  /** The gift was picked from a suggestion. */
  fromSuggestion?: boolean
  /** Storage path, to delete the photo. */
  photoPath?: string
  /** Download URL, stored so the photo shows offline from the service worker cache. */
  photoUrl?: string
}

export interface CalendarFields {
  year: number
  person: string
  name: string
  /** YYYY-MM-DD, the date of day 1. */
  startDate: string
  dayCount: number
  allowRepeats: boolean
  /** 0 favours traditions, 1 favours new ideas. */
  originality: number
}

export interface Calendar extends CalendarFields {
  id: string
  /** Keyed by day number ("1".."24"). A missing key is an empty day. */
  days: Record<string, Day>
  /** Gifts without a day yet, keyed by an id that sorts by when they went in. */
  sack: Record<string, Day>
}

/** Where a gift is kept: a day of the calendar, or the sack until it gets one. */
export type Slot = { day: number } | { sack: string }

export interface Member {
  name: string
  email: string
}

export interface Workspace {
  id: string
  name: string
  ownerId: string
  memberIds: string[]
  members: Record<string, Member>
  invitedEmails: string[]
}

export interface Tag {
  id: string
  name: string
  color: TagColor
  emoji: string
}

export const TAG_COLORS = ['amber', 'slate', 'sky', 'emerald', 'purple', 'red', 'pink', 'orange'] as const
export type TagColor = (typeof TAG_COLORS)[number]
