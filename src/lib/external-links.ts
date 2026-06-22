export function normalizePhoneForWhatsApp(phone: string) {
  const hasLeadingPlus = phone.trim().startsWith('+')
  const digits = phone.replace(/[^\d]/g, '')
  return hasLeadingPlus ? `+${digits}` : digits
}

export function buildWhatsAppLink(phone: string, text: string) {
  const digits = normalizePhoneForWhatsApp(phone)
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

function toCalendarDate(isoDate: string) {
  return isoDate.replace(/-/g, '')
}

function addDay(isoDate: string) {
  const date = new Date(isoDate)
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

export function buildCalendarLink(title: string, isoDate: string) {
  const dateOnly = isoDate.slice(0, 10)
  const start = toCalendarDate(dateOnly)
  const end = toCalendarDate(addDay(dateOnly))
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
