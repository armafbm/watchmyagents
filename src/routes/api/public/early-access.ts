import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'watchmyagents'
const SENDER_DOMAIN = 'notify.watchmyagents.com'
const FROM_DOMAIN = 'watchmyagents.com'
const TEMPLATE_NAME = 'early-access-confirmation'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function redactEmail(email: string): string {
  const [l, d] = email.split('@')
  if (!l || !d) return '***'
  return `${l[0]}***@${d}`
}

export const Route = createFileRoute('/api/public/early-access')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        let email = ''
        let source = 'landing_cta'
        let userAgent: string | null = null
        try {
          const body = await request.json()
          email = String(body.email || '').trim().toLowerCase()
          if (body.source) source = String(body.source).slice(0, 64)
          if (body.userAgent) userAgent = String(body.userAgent).slice(0, 500)
        } catch {
          return Response.json({ error: 'Invalid body' }, { status: 400 })
        }

        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) {
          return Response.json({ error: 'Invalid email' }, { status: 400 })
        }

        const supabase = createClient(supabaseUrl, serviceKey)

        // 1. Insert signup (ignore duplicate)
        const { error: insertError } = await supabase
          .from('early_access_signups')
          .insert({ email, source, user_agent: userAgent })

        let alreadyRegistered = false
        if (insertError) {
          if ((insertError as any).code === '23505') {
            alreadyRegistered = true
          } else {
            console.error('early-access insert failed', insertError)
            return Response.json({ error: 'Failed to save signup' }, { status: 500 })
          }
        }

        // 2. If already registered, don't re-send the email
        if (alreadyRegistered) {
          return Response.json({ success: true, alreadyRegistered: true })
        }

        // 3. Check suppression
        const { data: suppressed } = await supabase
          .from('suppressed_emails')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (suppressed) {
          return Response.json({ success: true, suppressed: true })
        }

        // 4. Get or create unsubscribe token
        let unsubscribeToken: string
        const { data: existingToken } = await supabase
          .from('email_unsubscribe_tokens')
          .select('token, used_at')
          .eq('email', email)
          .maybeSingle()

        if (existingToken?.token && !existingToken.used_at) {
          unsubscribeToken = existingToken.token
        } else {
          unsubscribeToken = generateToken()
          await supabase
            .from('email_unsubscribe_tokens')
            .upsert(
              { token: unsubscribeToken, email },
              { onConflict: 'email', ignoreDuplicates: true }
            )
          const { data: stored } = await supabase
            .from('email_unsubscribe_tokens')
            .select('token')
            .eq('email', email)
            .maybeSingle()
          if (stored?.token) unsubscribeToken = stored.token
        }

        // 5. Render template
        const template = TEMPLATES[TEMPLATE_NAME]
        if (!template) {
          console.error('Template missing', TEMPLATE_NAME)
          return Response.json({ success: true, emailQueued: false })
        }
        const element = React.createElement(template.component, {})
        const html = await render(element)
        const plainText = await render(element, { plainText: true })
        const subject =
          typeof template.subject === 'function' ? template.subject({}) : template.subject

        const messageId = crypto.randomUUID()
        const idempotencyKey = `early-access-${email}`

        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: TEMPLATE_NAME,
          recipient_email: email,
          status: 'pending',
        })

        const { error: enqueueError } = await supabase.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: email,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text: plainText,
            purpose: 'transactional',
            label: TEMPLATE_NAME,
            idempotency_key: idempotencyKey,
            unsubscribe_token: unsubscribeToken,
            queued_at: new Date().toISOString(),
          },
        })

        if (enqueueError) {
          console.error('enqueue failed', enqueueError, redactEmail(email))
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: TEMPLATE_NAME,
            recipient_email: email,
            status: 'failed',
            error_message: 'Failed to enqueue email',
          })
          return Response.json({ success: true, emailQueued: false })
        }

        return Response.json({ success: true, emailQueued: true })
      },
    },
  },
})
