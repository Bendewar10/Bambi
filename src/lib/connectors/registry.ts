export type ConnectorAvailability = 'available' | 'coming_soon'
export type TokenStatus = 'active' | 'expired'

export interface ConnectorDefinition {
  id: string
  name: string
  description: string
  scopes: string[]
  availability: ConnectorAvailability
  color: string
  initial: string
}

export interface ConnectorTokenStatus {
  provider: string
  status: TokenStatus
  accountEmail: string
  connectedAt: string
}

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [
  {
    id: 'google',
    name: 'Google',
    description: 'Google Calendar & Gmail — Kalender-Events und E-Mails lesen',
    scopes: ['calendar.readonly', 'gmail.readonly'],
    availability: 'available',
    color: '#4285F4',
    initial: 'G',
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Kalender & E-Mails (Office 365)',
    scopes: ['Calendars.Read', 'Mail.Read'],
    availability: 'coming_soon',
    color: '#0078D4',
    initial: 'O',
  },
]
