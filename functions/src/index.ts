import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { countsFor, inReminderSeason, reminderFor, type CalendarDoc } from './reminders.js'

initializeApp()

const STALE_TOKEN = ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered']

/**
 * Sunday evening, from November to Christmas Eve: tells each person who turned
 * reminders on what is left to buy, wrap and fill in the calendars they are in.
 * Tokens FCM reports as gone are removed.
 */
export const sendReminders = onSchedule(
  { schedule: '0 18 * * 0', timeZone: 'Europe/Lisbon', region: 'europe-west1', maxInstances: 1, timeoutSeconds: 300 },
  async () => {
    const now = new Date()
    if (!inReminderSeason(now)) return

    const db = getFirestore()
    const calendarsOf = new Map<string, CalendarDoc[]>()
    for (const calendar of (await db.collection('calendars').where('year', '==', now.getUTCFullYear()).get()).docs) {
      for (const uid of (calendar.get('memberIds') as string[]) ?? []) {
        calendarsOf.set(uid, [...(calendarsOf.get(uid) ?? []), calendar.data() as CalendarDoc])
      }
    }

    for (const [uid, calendars] of calendarsOf) {
      const user = await db.doc(`users/${uid}`).get()
      const tokens = ((user.get('fcmTokens') as string[] | undefined) ?? []).filter((token) => typeof token === 'string')
      const message = reminderFor(countsFor(calendars), user.get('language'))
      if (!tokens.length || !message) continue

      const result = await getMessaging().sendEachForMulticast({ tokens, data: message })
      const stale = tokens.filter((_, index) => STALE_TOKEN.includes(result.responses[index].error?.code ?? ''))
      if (stale.length) await user.ref.update({ fcmTokens: FieldValue.arrayRemove(...stale) })
    }
  },
)
