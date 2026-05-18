/**
 * Microsoft Teams notification via Incoming Webhook.
 * BRD §5.2 — automated notifications for key events.
 *
 * Set TEAMS_WEBHOOK_URL in .env.local to enable.
 * Get it from: Teams channel → ... → Connectors → Incoming Webhook → Configure
 */

export interface TeamsCard {
  title: string;
  text: string;
  themeColor?: string; // hex without #, e.g. '0078D4'
  facts?: Array<{ name: string; value: string }>;
  actionUrl?: string;
  actionLabel?: string;
}

export async function sendTeamsNotification(card: TeamsCard): Promise<boolean> {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) return false;

  // Teams Adaptive Card (MessageCard format — works with all webhook connectors)
  const payload: Record<string, unknown> = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: card.themeColor ?? '0078D4',
    summary: card.title,
    sections: [
      {
        activityTitle: card.title,
        activityText: card.text,
        facts: card.facts ?? [],
        markdown: true,
      },
    ],
  };

  if (card.actionUrl && card.actionLabel) {
    payload.potentialAction = [
      {
        '@type': 'OpenUri',
        name: card.actionLabel,
        targets: [{ os: 'default', uri: card.actionUrl }],
      },
    ];
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('[teams]', err);
    return false;
  }
}

// ─── Pre-built notification templates ────────────────────────────────────────

export function goalSubmittedCard(employeeName: string, goalTitle: string, appUrl: string): TeamsCard {
  return {
    title: '📋 Goal Submitted for Approval',
    text: `**${employeeName}** has submitted a goal for your review.`,
    themeColor: '0078D4',
    facts: [{ name: 'Goal', value: goalTitle }],
    actionUrl: `${appUrl}/approvals`,
    actionLabel: 'Review in Portal',
  };
}

export function goalApprovedCard(goalTitle: string, reviewerName: string, appUrl: string): TeamsCard {
  return {
    title: '✅ Goal Approved',
    text: `Your goal has been approved by **${reviewerName}**.`,
    themeColor: '107C10',
    facts: [{ name: 'Goal', value: goalTitle }],
    actionUrl: `${appUrl}/my-goals`,
    actionLabel: 'View My Goals',
  };
}

export function goalReturnedCard(goalTitle: string, comment: string, appUrl: string): TeamsCard {
  return {
    title: '🔄 Goal Returned for Rework',
    text: 'Your goal has been returned with feedback.',
    themeColor: 'D83B01',
    facts: [
      { name: 'Goal', value: goalTitle },
      { name: 'Comment', value: comment || '—' },
    ],
    actionUrl: `${appUrl}/my-goals`,
    actionLabel: 'Edit Goal',
  };
}

export function checkinReminderCard(employeeName: string, appUrl: string): TeamsCard {
  return {
    title: '⏰ Check-in Reminder',
    text: `**${employeeName}**, the quarterly check-in window is open. Please submit your progress updates.`,
    themeColor: 'FFB900',
    actionUrl: `${appUrl}/my-goals`,
    actionLabel: 'Submit Check-in',
  };
}

export function checkinSubmittedCard(employeeName: string, goalTitle: string, status: string, appUrl: string): TeamsCard {
  return {
    title: '📊 Check-in Submitted',
    text: `**${employeeName}** has submitted a quarterly check-in.`,
    themeColor: '0078D4',
    facts: [
      { name: 'Goal', value: goalTitle },
      { name: 'Status', value: status },
    ],
    actionUrl: `${appUrl}/team`,
    actionLabel: 'View Team Progress',
  };
}
