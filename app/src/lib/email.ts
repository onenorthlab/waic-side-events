export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

export function defaultEmailFrom(): string {
  // 生产环境请在 Cloudflare Dashboard 或 wrangler secret 设置 EMAIL_FROM 为已验证域名
  return 'WAIC 周边活动 <no-reply@waic-side-events.ingle.workers.dev>'
}

export async function sendEmail(
  apiKey: string,
  payload: EmailPayload,
  from?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || defaultEmailFrom(),
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { ok: false, error: data.message || `Resend ${res.status}` }
    }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

export function registrationConfirmedEmail(eventTitle: string, eventUrl: string, ticketUrl?: string) {
  const ticketHtml = ticketUrl ? `<p><b>您的电子票：</b><a href="${ticketUrl}">${ticketUrl}</a><br/>入场时向工作人员出示票面二维码。</p>` : ''
  const ticketText = ticketUrl ? `\n\n您的电子票：${ticketUrl}\n入场时向工作人员出示票面二维码。` : ''
  return {
    subject: `【报名成功】${eventTitle}`,
    html: `<p>您好，</p><p>您已成功报名 <b>${eventTitle}</b>。</p>${ticketHtml}<p>活动详情：<a href="${eventUrl}">${eventUrl}</a></p><p>期待与您见面！</p>`,
    text: `您好，\n\n您已成功报名 ${eventTitle}。${ticketText}\n\n活动详情：${eventUrl}\n\n期待与您见面！`,
  }
}

export function registrationPendingEmail(eventTitle: string) {
  return {
    subject: `【报名待审批】${eventTitle}`,
    html: `<p>您好，</p><p>您已提交 <b>${eventTitle}</b> 的报名申请，我们正在审核中。</p><p>审核结果将通过邮件通知您。</p>`,
    text: `您好，\n\n您已提交 ${eventTitle} 的报名申请，我们正在审核中。\n\n审核结果将通过邮件通知您。`,
  }
}

export function registrationApprovedEmail(eventTitle: string, eventUrl: string, ticketUrl?: string) {
  const ticketHtml = ticketUrl ? `<p><b>您的电子票：</b><a href="${ticketUrl}">${ticketUrl}</a><br/>入场时向工作人员出示票面二维码。</p>` : ''
  const ticketText = ticketUrl ? `\n\n您的电子票：${ticketUrl}\n入场时向工作人员出示票面二维码。` : ''
  return {
    subject: `【报名通过】${eventTitle}`,
    html: `<p>您好，</p><p>恭喜！您的 <b>${eventTitle}</b> 报名申请已通过审核。</p>${ticketHtml}<p>活动详情：<a href="${eventUrl}">${eventUrl}</a></p><p>期待与您见面！</p>`,
    text: `您好，\n\n恭喜！您的 ${eventTitle} 报名申请已通过审核。${ticketText}\n\n活动详情：${eventUrl}\n\n期待与您见面！`,
  }
}

export function registrationRejectedEmail(eventTitle: string, eventUrl: string) {
  return {
    subject: `【报名结果】${eventTitle}`,
    html: `<p>您好，</p><p>很抱歉，您对 <b>${eventTitle}</b> 的报名申请未能通过审核（可能因名额有限或不符合本场活动的参与条件）。</p><p>您可以继续浏览其他活动：<a href="${eventUrl}">${eventUrl}</a></p><p>感谢您的关注！</p>`,
    text: `您好，\n\n很抱歉，您对 ${eventTitle} 的报名申请未能通过审核（可能因名额有限或不符合本场活动的参与条件）。\n\n您可以继续浏览其他活动：${eventUrl}\n\n感谢您的关注！`,
  }
}
