import { NextResponse } from 'next/server';
import {
  sendTeamsNotification,
  goalSubmittedCard,
  goalApprovedCard,
  goalReturnedCard,
  checkinSubmittedCard,
} from '@/lib/teams-notify';

export type TeamsEventType =
  | 'goal_submitted'
  | 'goal_approved'
  | 'goal_returned'
  | 'checkin_submitted';

interface TeamsNotifyBody {
  event: TeamsEventType;
  employeeName: string;
  goalTitle?: string;
  reviewerName?: string;
  comment?: string;
  status?: string;
}

export async function POST(request: Request) {
  if (!process.env.TEAMS_WEBHOOK_URL) {
    return NextResponse.json({ ok: false, reason: 'not_configured' });
  }

  try {
    const body: TeamsNotifyBody = await request.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    let card;
    switch (body.event) {
      case 'goal_submitted':
        card = goalSubmittedCard(body.employeeName, body.goalTitle ?? '', appUrl);
        break;
      case 'goal_approved':
        card = goalApprovedCard(body.goalTitle ?? '', body.reviewerName ?? '', appUrl);
        break;
      case 'goal_returned':
        card = goalReturnedCard(body.goalTitle ?? '', body.comment ?? '', appUrl);
        break;
      case 'checkin_submitted':
        card = checkinSubmittedCard(body.employeeName, body.goalTitle ?? '', body.status ?? '', appUrl);
        break;
      default:
        return NextResponse.json({ ok: false, reason: 'unknown_event' });
    }

    const sent = await sendTeamsNotification(card);
    return NextResponse.json({ ok: sent });
  } catch (err) {
    console.error('[teams notify]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
