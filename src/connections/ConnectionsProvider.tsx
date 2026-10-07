import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { conversationState, unreadCount, type ConversationState } from '../domain/matching';
import type { ID, Like, Match, Message, Pass, Profile } from '../domain/types';
import type { NewMessage } from '../repositories/types';
import { useRepositories } from '../repositories/RepositoryContext';

export interface Conversation {
  match: Match;
  other: Profile;
  messages: Message[];
  last: Message | undefined;
  unread: number;
  state: ConversationState;
}

export interface IncomingLike {
  like: Like;
  from: Profile;
}

interface ConnectionsData {
  viewer: Profile;
  received: Like[];
  passes: Pass[];
  matches: Match[];
  messages: Message[];
  profilesByUser: Map<ID, Profile>;
}

interface ConnectionsValue {
  status: 'loading' | 'ready' | 'error';
  error: Error | null;
  viewer: Profile | null;
  /** Likes received that haven't been matched or passed on. Newest first. */
  incoming: IncomingLike[];
  /** All conversations including archived, most recent activity first. */
  conversations: Conversation[];
  /** Badge counts. Archived chats never count. */
  pendingLikeCount: number;
  unreadConversationCount: number;
  refresh: () => Promise<void>;
  getConversation: (matchId: ID) => Conversation | undefined;
  getIncoming: (likeId: ID) => IncomingLike | undefined;
  acceptLike: (likeId: ID) => Promise<Match | null>;
  passLike: (likeId: ID) => Promise<void>;
  sendMessage: (matchId: ID, input: NewMessage) => Promise<void>;
  markRead: (matchId: ID) => Promise<void>;
  setArchived: (matchId: ID, archived: boolean) => Promise<void>;
  keepForLater: (matchId: ID) => Promise<void>;
}

const ConnectionsContext = createContext<ConnectionsValue | null>(null);

/**
 * Likes received, matches and messages for the signed-in user. Stays in sync with
 * storage changes (other tabs, the debug panel) through the repository subscription.
 */
export function ConnectionsProvider({ children }: { children: ReactNode }) {
  const repos = useRepositories();
  const [status, setStatus] = useState<ConnectionsValue['status']>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const inflight = useRef<Promise<void> | null>(null);
  const again = useRef(false);

  const load = useCallback(async () => {
    try {
      const [viewer, received, discovery, matches, messages, others] = await Promise.all([
        repos.profiles.getCurrentProfile(),
        repos.incomingLikes.listReceived(),
        repos.discovery.getState(),
        repos.matches.listMatches(),
        repos.matches.listAllMessages(),
        repos.profiles.listCandidates(),
      ]);
      if (!viewer) throw new Error('Finish your profile to see likes and matches.');
      setData({ viewer, received, passes: discovery.passes, matches, messages, profilesByUser: new Map(others.map((p) => [p.userId, p])) });
      setNow(Date.now());
      setStatus('ready');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repos]);

  /** Coalesce bursts of storage events into at most one reload in flight plus one follow-up. */
  const refresh = useCallback(async () => {
    if (inflight.current) {
      again.current = true;
      return inflight.current;
    }
    const run = (async () => {
      do {
        again.current = false;
        await load();
      } while (again.current);
    })();
    inflight.current = run;
    try {
      await run;
    } finally {
      inflight.current = null;
    }
  }, [load]);

  useEffect(() => {
    void refresh();
    return repos.matches.subscribe(() => void refresh());
  }, [refresh, repos]);

  // Re-evaluate time-based states (Still interested?, Inactive) every minute.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const derived = useMemo(() => {
    if (!data) return { incoming: [] as IncomingLike[], conversations: [] as Conversation[] };
    const me = data.viewer.userId;
    const matchedWith = new Set(data.matches.flatMap((m) => m.userIds).filter((id) => id !== me));
    const passed = new Set(data.passes.map((p) => p.toProfileId));
    const incoming = data.received
      .filter((l) => !matchedWith.has(l.fromUserId) && !passed.has(l.fromProfileId ?? ''))
      .map((like) => ({ like, from: data.profilesByUser.get(like.fromUserId) }))
      .filter((x): x is IncomingLike => Boolean(x.from));

    const byMatch = new Map<ID, Message[]>();
    for (const m of data.messages) {
      const list = byMatch.get(m.matchId) ?? [];
      list.push(m);
      byMatch.set(m.matchId, list);
    }
    const conversations = data.matches
      .map((match): Conversation | null => {
        const otherId = match.userIds.find((id) => id !== me);
        const other = otherId ? data.profilesByUser.get(otherId) : undefined;
        if (!other) return null;
        const messages = byMatch.get(match.id) ?? [];
        return {
          match,
          other,
          messages,
          last: messages[messages.length - 1],
          unread: unreadCount(match, messages, me),
          // Like comments carried into the chat are context, not the start of a conversation.
          state: conversationState(match, messages.some((m) => !m.likeContext), now),
        };
      })
      .filter((c): c is Conversation => c !== null)
      .sort((a, b) => b.match.lastActivityAt.localeCompare(a.match.lastActivityAt));
    return { incoming, conversations };
  }, [data, now]);

  const getConversation = useCallback((id: ID) => derived.conversations.find((c) => c.match.id === id), [derived]);
  const getIncoming = useCallback((id: ID) => derived.incoming.find((i) => i.like.id === id), [derived]);

  const acceptLike = useCallback(
    async (likeId: ID) => {
      const match = await repos.incomingLikes.respond(likeId, 'match');
      await refresh();
      return match;
    },
    [repos, refresh],
  );

  const passLike = useCallback(
    async (likeId: ID) => {
      await repos.incomingLikes.respond(likeId, 'pass');
      await refresh();
    },
    [repos, refresh],
  );

  const sendMessage = useCallback(
    async (matchId: ID, input: NewMessage) => {
      const me = data?.viewer.userId ?? '';
      const at = new Date().toISOString();
      // Optimistic: show the message immediately; storage sync replaces it.
      setData((d) => d && { ...d, messages: [...d.messages, { id: `pending-${at}`, matchId, senderId: me, sentAt: at, ...input }] });
      try {
        await repos.matches.sendMessage(matchId, input);
      } finally {
        await refresh();
      }
    },
    [data?.viewer.userId, repos, refresh],
  );

  // Each change waits for fresh data so the next screen never shows a stale list.
  const markRead = useCallback(
    async (matchId: ID) => {
      await repos.matches.markRead(matchId);
      await refresh();
    },
    [repos, refresh],
  );
  const setArchived = useCallback(
    async (matchId: ID, archived: boolean) => {
      await repos.matches.setArchived(matchId, archived);
      await refresh();
    },
    [repos, refresh],
  );
  const keepForLater = useCallback(
    async (matchId: ID) => {
      await repos.matches.keepForLater(matchId);
      await refresh();
    },
    [repos, refresh],
  );

  const value = useMemo<ConnectionsValue>(
    () => ({
      status,
      error,
      viewer: data?.viewer ?? null,
      incoming: derived.incoming,
      conversations: derived.conversations,
      pendingLikeCount: derived.incoming.length,
      unreadConversationCount: derived.conversations.filter((c) => c.unread > 0 && c.state !== 'archived').length,
      refresh,
      getConversation,
      getIncoming,
      acceptLike,
      passLike,
      sendMessage,
      markRead,
      setArchived,
      keepForLater,
    }),
    [status, error, data, derived, refresh, getConversation, getIncoming, acceptLike, passLike, sendMessage, markRead, setArchived, keepForLater],
  );
  return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>;
}

export function useConnections(): ConnectionsValue {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) throw new Error('useConnections must be used inside <ConnectionsProvider>.');
  return ctx;
}
