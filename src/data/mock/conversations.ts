import type { Match, Message } from '../../domain/types';
import { daysAgo, hoursAgo, minutesAgo } from '../../utils/time';
import { CURRENT_USER_ID } from './profiles';

export function createMockMatches(now = Date.now()): Match[] {
  return [
    {
      id: 'm-emma', userIds: [CURRENT_USER_ID, 'u-emma'], createdAt: daysAgo(2, now),
      lastActivityAt: minutesAgo(18, now), status: 'active',
      context: 'You liked Emma\'s answer about Studio Ghibli.',
    },
    {
      id: 'm-maja', userIds: [CURRENT_USER_ID, 'u-maja'], createdAt: daysAgo(4, now),
      lastActivityAt: hoursAgo(5, now), status: 'active',
      context: 'Maja liked your Sunday prompt.',
    },
    {
      id: 'm-lina', userIds: [CURRENT_USER_ID, 'u-lina'], createdAt: daysAgo(9, now),
      lastActivityAt: daysAgo(6, now), status: 'active',
      context: 'You both love history.',
    },
  ];
}

export function createMockMessages(now = Date.now()): Message[] {
  return [
    { id: 'msg-1', matchId: 'm-emma', senderId: CURRENT_USER_ID, kind: 'text', body: 'Okay, I have to know. Best Ghibli film?', sentAt: hoursAgo(3, now) },
    { id: 'msg-2', matchId: 'm-emma', senderId: 'u-emma', kind: 'text', body: 'Spirited Away, obviously. But I respect a Princess Mononoke answer.', sentAt: hoursAgo(2, now) },
    { id: 'msg-3', matchId: 'm-emma', senderId: 'u-emma', kind: 'text', body: 'Wait, do you actually like horror or was that just for the profile?', sentAt: minutesAgo(18, now) },
    { id: 'msg-4', matchId: 'm-maja', senderId: 'u-maja', kind: 'text', body: 'A horror double feature on a Sunday is elite behaviour.', sentAt: hoursAgo(6, now) },
    { id: 'msg-5', matchId: 'm-maja', senderId: CURRENT_USER_ID, kind: 'text', body: 'Finally, someone gets it. What would your pick be?', sentAt: hoursAgo(5, now) },
  ];
}
