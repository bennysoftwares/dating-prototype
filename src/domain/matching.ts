import { createId } from '../utils/id';
import type { ID, Like, LikeSnapshot, LikeTarget, Match, MatchContext, Message, Profile } from './types';

/* ------------------------------------------------------------------ */
/* Inactivity: gentle, never destructive                               */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;

/** After this many quiet days, ask "Still interested?". Matches never expire. */
export const NUDGE_AFTER_DAYS = 5;
/** After this many quiet days, move the chat to the Inactive section. Never unmatched. */
export const INACTIVE_AFTER_DAYS = 14;

export type ConversationState = 'new' | 'active' | 'nudge' | 'inactive' | 'archived';

/** Derived from activity; nothing is ever deleted or unmatched automatically. */
export function conversationState(match: Match, hasMessages: boolean, now = Date.now()): ConversationState {
  if (match.archivedAt) return 'archived';
  const last = new Date(match.lastActivityAt).getTime();
  const idleDays = (now - last) / DAY;
  const kept = match.keptForLaterAt ? new Date(match.keptForLaterAt).getTime() : 0;
  const keptRecently = kept > last;
  if (idleDays >= INACTIVE_AFTER_DAYS && (!keptRecently || (now - kept) / DAY >= INACTIVE_AFTER_DAYS)) return 'inactive';
  if (idleDays >= NUDGE_AFTER_DAYS && !keptRecently) return 'nudge';
  return hasMessages ? 'active' : 'new';
}

/* ------------------------------------------------------------------ */
/* Unread (private to the viewer; never a read receipt)                */
/* ------------------------------------------------------------------ */

export function unreadCount(match: Match, messages: Message[], viewerId: ID): number {
  const readAt = match.lastReadAt?.[viewerId] ?? '';
  return messages.filter((m) => m.matchId === match.id && m.senderId !== viewerId && m.sentAt > readAt).length;
}

/* ------------------------------------------------------------------ */
/* Like snapshots and match creation                                   */
/* ------------------------------------------------------------------ */

export function snapshotFor(profile: Profile | undefined, target: LikeTarget): LikeSnapshot {
  if (target.kind === 'photo') {
    const photo = profile?.photos.find((p) => p.id === target.photoId);
    return { kind: 'photo', photoId: target.photoId, tone: photo?.tone ?? ['#d8cfc5', '#8b8178'] };
  }
  if (target.kind === 'prompt') {
    const prompt = profile?.prompts.find((p) => p.id === target.promptId);
    return prompt ? { kind: 'prompt', prompt: prompt.prompt, answer: prompt.answer } : { kind: 'profile' };
  }
  return { kind: 'profile' };
}

function contextFromLike(like: Like): MatchContext {
  return {
    fromUserId: like.fromUserId,
    aboutUserId: like.toUserId,
    target: like.target,
    snapshot: like.snapshot ?? { kind: 'profile' },
    ...(like.comment ? { comment: like.comment } : {}),
    at: like.createdAt,
  };
}

/**
 * Two likes in opposite directions make a match. Any comment sent with a like becomes
 * a real first message (quoting what was liked), so nobody starts from an empty chat.
 */
export function createMatchFromLikes(first: Like, second: Like, now = new Date().toISOString()): { match: Match; messages: Message[] } {
  const matchId = createId('match');
  const likes = [first, second].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const messages: Message[] = likes
    .filter((l) => l.comment)
    .map((l) => ({
      id: createId('msg'),
      matchId,
      senderId: l.fromUserId,
      kind: 'text',
      body: l.comment!,
      sentAt: l.createdAt,
      likeContext: { aboutUserId: l.toUserId, snapshot: l.snapshot ?? { kind: 'profile' } },
    }));
  const match: Match = {
    id: matchId,
    userIds: [first.toUserId, first.fromUserId],
    createdAt: now,
    lastActivityAt: now,
    status: 'active',
    contexts: likes.map(contextFromLike),
    archivedAt: null,
    keptForLaterAt: null,
    lastReadAt: {},
  };
  return { match, messages };
}

/* ------------------------------------------------------------------ */
/* Human-language context                                              */
/* ------------------------------------------------------------------ */

const shortPrompt = (prompt: string) => `“${prompt.replace(/\.\.\.$|…$/, '…')}”`;

/** "your photo", "Emma's answer to “A perfect Sunday…”", from the viewer's perspective. */
export function describeSnapshot(snapshot: LikeSnapshot, ownerIsViewer: boolean, ownerName: string): string {
  const owner = ownerIsViewer ? 'your' : `${ownerName}'s`;
  if (snapshot.kind === 'photo') return `${owner} photo`;
  if (snapshot.kind === 'prompt') return `${owner} answer to ${shortPrompt(snapshot.prompt)}`;
  return ownerIsViewer ? 'your profile' : ownerName;
}

/** "You liked Emma's photo." / "Emma liked your answer to “A perfect Sunday…”." */
export function describeContext(ctx: MatchContext, viewerId: ID, otherName: string): string {
  const byViewer = ctx.fromUserId === viewerId;
  const what = describeSnapshot(ctx.snapshot, ctx.aboutUserId === viewerId, otherName);
  return byViewer ? `You liked ${what}.` : `${otherName} liked ${what}.`;
}

/** Preview text for message lists. */
export function messagePreview(m: Message, viewerId: ID): string {
  const prefix = m.senderId === viewerId ? 'You: ' : '';
  if (m.kind === 'photo') return `${prefix}Photo`;
  if (m.kind === 'voice') return `${prefix}Voice note`;
  if (m.kind === 'date') return `${prefix}Date suggestion`;
  return `${prefix}${m.body}`;
}
