export const STATUSES = ['planned', 'bought', 'wrapped'] as const
export type Status = (typeof STATUSES)[number]

/** A gift, on a day of the calendar or in its sack. It has a name, a photo or both. */
export interface Day {
  /** Empty when the gift is only a photo. */
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
  /** A small copy for doors and lists; photos from before thumbnails have none. */
  thumbUrl?: string
}

export const AGE_RANGES = ['child', 'teen', 'adult'] as const
export type AgeRange = (typeof AGE_RANGES)[number]

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
  /** Steers the suggestions. Calendars from before it have none and count as adult. */
  ageRange?: AgeRange
}

export const ageRangeOf = (calendar: Pick<CalendarFields, 'ageRange'>): AgeRange => calendar.ageRange ?? 'adult'

export interface Calendar extends CalendarFields {
  id: string
  /** Keyed by day number ("1".."24"). A missing key is an empty day. */
  days: Record<string, Day>
  /** Gifts without a day yet, keyed by an id that sorts by when they went in. */
  sack: Record<string, Day>
  /** Shared by everyone in the calendar. The defaults keep the same ids in every calendar. */
  tags: Record<string, TagFields>
  /** Who sees and edits it: the ids for the "my calendars" query, the names to show. */
  memberIds: string[]
  members: Record<string, Member>
  /** Lowercase emails invited in, until they accept or decline. */
  invitedEmails: string[]
}

/** Where a gift is kept: a day of the calendar, or the sack until it gets one. */
export type Slot = { day: number } | { sack: string }

export interface Member {
  name: string
  email: string
}

/** Someone who has signed in. Only approved accounts get past the waiting page. */
export interface Person extends Member {
  id: string
  /** Missing on entries from before approval, which count as pending. */
  status?: 'pending' | 'approved' | 'rejected'
  /** Set only with the Admin SDK (npm run admin:grant). */
  admin?: boolean
}

export const statusOf = (person: Pick<Person, 'status'>) => person.status ?? 'pending'

export interface TagFields {
  name: string
  color: TagColor
  emoji: string
}

export interface Tag extends TagFields {
  id: string
}

export const TAG_COLORS = ['amber', 'slate', 'sky', 'emerald', 'purple', 'red', 'pink', 'orange'] as const
export type TagColor = (typeof TAG_COLORS)[number]
