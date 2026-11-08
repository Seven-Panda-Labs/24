export const STATUSES = ['planned', 'bought', 'wrapped'] as const
export type Status = (typeof STATUSES)[number]

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
}

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
