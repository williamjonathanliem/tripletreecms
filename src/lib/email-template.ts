import type { CentreSettings } from './centre-settings'

export type EmailType = 'parent-notice' | 'staff-notice' | 'fee-reminder' | 'parent-invite'

const TYPE_META: Record<EmailType, { label: string; accent: string }> = {
  'parent-notice':  { label: 'Notice to Parents',        accent: '#1E8449' },
  'staff-notice':   { label: 'Staff Announcement',       accent: '#1A5276' },
  'fee-reminder':   { label: 'Fee Payment Reminder',     accent: '#B7770D' },
  'parent-invite':  { label: 'Parent Portal Invitation', accent: '#1E8449' },
}


function contactFooter(settings?: Partial<CentreSettings>): string {
  const phone   = settings?.phone         ?? process.env.CENTRE_PHONE   ?? ''
  const email   = settings?.contact_email ?? process.env.CENTRE_EMAIL   ?? process.env.SMTP_FROM ?? process.env.SMTP_USER ?? ''
  const address = settings?.address       ?? process.env.CENTRE_ADDRESS ?? ''
  const weekday = settings?.hours_weekday ?? ''
  const weekend = settings?.hours_weekend ?? ''

  const label = (text: string) =>
    `<span style="display:inline-block;width:80px;color:#9CA3AF;font-size:12px">${text}</span>`

  const rows = [
    phone   && `<tr><td style="padding:4px 0;font-size:13px;color:#6B7280">${label('Phone')}<a href="tel:${phone}" style="color:#374151;text-decoration:none">${phone}</a></td></tr>`,
    email   && `<tr><td style="padding:4px 0;font-size:13px;color:#6B7280">${label('Email')}<a href="mailto:${email}" style="color:#374151;text-decoration:none">${email}</a></td></tr>`,
    address && `<tr><td style="padding:4px 0;font-size:13px;color:#6B7280">${label('Address')}${address}</td></tr>`,
    weekday && `<tr><td style="padding:4px 0;font-size:13px;color:#6B7280">${label('Mon – Fri')}${weekday}</td></tr>`,
    weekend && `<tr><td style="padding:4px 0;font-size:13px;color:#6B7280">${label('Sat – Sun')}${weekend}</td></tr>`,
  ].filter(Boolean).join('\n')

  if (!rows) return ''

  return `
    <div style="border-top:1px solid #E5E7EB;padding:24px 40px 20px;background:#F9FAFB">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF">Contact Us</p>
      <table style="width:100%;border-collapse:collapse">
        <tbody>${rows}</tbody>
      </table>
    </div>`
}

export function buildEmail(opts: {
  type: EmailType
  title: string
  body: string
  isHtml?: boolean
  senderName?: string
  settings?: Partial<CentreSettings>
}): string {
  const meta = TYPE_META[opts.type]
  const accent  = meta.accent

  const bodyHtml = opts.isHtml
    ? opts.body
    : `<div style="color:#374151;font-size:14px;line-height:1.8;white-space:pre-line">${opts.body.replace(/\n/g, '<br>')}</div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:580px;margin:40px auto 60px;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);border:1px solid #E5E7EB;background:#ffffff">

    <div style="background:#0D1F12;padding:28px 40px 24px;text-align:center">
      <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.01em">Triple Tree Enrichment Centre</p>
      <span style="display:inline-block;margin-top:8px;padding:3px 12px;background:${accent};border-radius:99px;color:#ffffff;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">
        ${meta.label}
      </span>
    </div>

    <div style="height:3px;background:${accent}"></div>

    <div style="padding:36px 40px 32px">
      <h2 style="margin:0 0 20px;font-size:18px;font-weight:700;color:#111827;line-height:1.3">${opts.title}</h2>
      ${bodyHtml}
    </div>

    ${contactFooter(opts.settings)}

    <div style="padding:16px 40px 20px;background:#F9FAFB;border-top:1px solid #E5E7EB;text-align:center">
      <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6">
        This message was sent via Triple Tree CMS. Please do not reply to this email.<br>
        If you believe this was sent in error, please contact us directly.
      </p>
    </div>
  </div>
</body>
</html>`
}
