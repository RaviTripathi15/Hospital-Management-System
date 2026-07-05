import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

export function formatDate(date, fmt = 'MMM dd, yyyy') {
  if (!date) return 'N/A'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return 'Invalid date'
    return format(d, fmt)
  } catch {
    return 'Invalid date'
  }
}

export function formatDateTime(date) {
  return formatDate(date, 'MMM dd, yyyy HH:mm')
}

export function formatTime(date) {
  return formatDate(date, 'HH:mm')
}

export function formatRelativeTime(date) {
  if (!date) return 'N/A'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return 'Invalid date'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return 'N/A'
  }
}

export function formatCurrency(amount, currency = 'INR') {
  if (amount === null || amount === undefined) return 'N/A'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return new Intl.NumberFormat('en-IN').format(num)
}

export function formatPhone(phone) {
  if (!phone) return 'N/A'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return phone
}

export function truncateText(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return '0%'
  return `${Number(value).toFixed(decimals)}%`
}

export function formatAge(dateOfBirth) {
  if (!dateOfBirth) return 'N/A'
  try {
    const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth
    const today = new Date()
    const age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      return age - 1
    }
    return age
  } catch {
    return 'N/A'
  }
}
