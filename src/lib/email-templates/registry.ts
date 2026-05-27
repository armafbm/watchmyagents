import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
import { template as earlyAccessConfirmation } from './early-access-confirmation'
import { template as earlyAccessAdminNotification } from './early-access-admin-notification'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'early-access-confirmation': earlyAccessConfirmation,
  'early-access-admin-notification': earlyAccessAdminNotification,
}

