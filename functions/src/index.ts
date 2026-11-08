import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { countsFor, inReminderSeason, reminderFor, type CalendarDoc } from './reminders.js'

initializeApp()

const STALE_TOKEN = ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered']

/**
 * Sunday evening, from November to Christmas Eve: tells each member who turned
 * reminders on what is left to buy, wrap and fill in their family space.
 * Tokens FCM reports as gone are removed.
 */
export const sendReminders = onSchedule(
  { schedule: '0 18 * * 0', timeZone: 'Europe/Lisbon', region: 'europe-west1', maxInstances: 1, timeoutSeconds: 300 },
  async () => {
    const now = new Date()
    if (!inReminderSeason(now)) return

    const db = getFirestore()
    for (const workspace of (await db.collection('workspaces').get()).docs) {
      const calendars = await workspace.ref.collection('calendars').where('year', '==', now.getUTCFullYear()).get()
      if (calendars.empty) continue
      const counts = countsFor(calendars.docs.map((doc) => doc.data() as CalendarDoc))

      for (const uid of (workspace.get('memberIds') as string[]) ?? []) {
        const user = await db.doc(`users/${uid}`).get()
        const tokens = ((user.get('fcmTokens') as string[] | undefined) ?? []).filter((token) => typeof token === 'string')
        const message = reminderFor(counts, user.get('language'))
        if (!tokens.length || !message) continue

        const result = await getMessaging().sendEachForMulticast({ tokens, data: message })
        const stale = tokens.filter((_, index) => STALE_TOKEN.includes(result.responses[index].error?.code ?? ''))
        if (stale.length) await user.ref.update({ fcmTokens: FieldValue.arrayRemove(...stale) })
      }
    }
  },
)
