// No Firebase imports here: the root Vitest suite tests this file directly.
/** What is left across a workspace's calendars for the year. */
export function countsFor(calendars) {
    const counts = { toBuy: 0, toWrap: 0, empty: 0 };
    for (const calendar of calendars) {
        for (let day = 1; day <= calendar.dayCount; day++) {
            const value = calendar.days?.[String(day)];
            if (typeof value?.gift !== 'string' || !value.gift)
                counts.empty++;
            else if (value.status === 'bought')
                counts.toWrap++;
            else if (value.status !== 'wrapped')
                counts.toBuy++;
        }
    }
    return counts;
}
/** Sundays from 1 November to 24 December. The schedule picks the Sunday; this the season. */
export function inReminderSeason(date) {
    const month = date.getUTCMonth() + 1;
    return month === 11 || (month === 12 && date.getUTCDate() <= 24);
}
const TEXT = {
    'pt-PT': { title: '24 · Ponto da situação', toBuy: 'Por comprar', toWrap: 'Por embrulhar', empty: 'Dias por preencher' },
    en: { title: '24 · Where things stand', toBuy: 'To buy', toWrap: 'To wrap', empty: 'Days to fill' },
};
/** The push data for one person, or null when nothing is left to do. */
export function reminderFor(counts, language) {
    const text = language === 'en' ? TEXT.en : TEXT['pt-PT'];
    const parts = ['toBuy', 'toWrap', 'empty'].filter((key) => counts[key] > 0).map((key) => `${text[key]}: ${counts[key]}`);
    if (!parts.length)
        return null;
    return { title: text.title, body: parts.join(' · '), url: counts.toBuy + counts.toWrap > 0 ? '/shopping' : '/' };
}
//# sourceMappingURL=reminders.js.map