import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Composer } from '../../components/connections/Composer';
import { LikedSnapshot } from '../../components/connections/LikedSnapshot';
import { MessageBubble } from '../../components/connections/MessageBubble';
import { ActionList, Avatar, BottomSheet, Button, EmptyState, Icon, IconButton, LoadingRegion, Skeleton, useToast } from '../../components/ui';
import { useConnections } from '../../connections/ConnectionsProvider';
import { useDrafts } from '../../connections/useDrafts';
import { TONES } from '../../data/mock/tones';
import { conversationHooks } from '../../domain/conversationHooks';
import { describeContext } from '../../domain/matching';
import { useKeyboardInset } from '../../hooks/useKeyboardInset';
import { buildCompatibility } from '../../recommendation/compatibility';
import { formatDay } from '../../utils/day';
import { useBack } from '../onboarding/useStepNavigation';
import './ChatScreen.css';

const TONE_LIST = Object.values(TONES);
const DAY = 86_400_000;

/**
 * One conversation. No read receipts, no online status, no typing indicators.
 * Like context opens the chat; quiet chats get a gentle "Still interested?" instead of expiring.
 */
export function ChatScreen() {
  const { matchId = '' } = useParams();
  const navigate = useNavigate();
  const back = useBack();
  const toast = useToast();
  const { status, viewer, getConversation, sendMessage, markRead, setArchived, keepForLater } = useConnections();
  const { drafts, setDraft } = useDrafts();
  const convo = getConversation(matchId);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const firstScroll = useRef(true);
  useKeyboardInset();

  const messageCount = convo?.messages.length ?? 0;

  // Opening the chat marks it read for you. Nothing is sent to the other person.
  useEffect(() => {
    if (convo && convo.unread > 0) void markRead(convo.match.id);
  }, [convo, markRead]);

  // Start at the latest message; follow new messages.
  useLayoutEffect(() => {
    if (!convo) return;
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: firstScroll.current ? ('instant' as ScrollBehavior) : 'smooth' });
    firstScroll.current = false;
  }, [convo?.match.id, messageCount]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') {
    return (
      <LoadingRegion label="Loading conversation">
        <div className="chat__loading"><Skeleton height={60} /><Skeleton height={60} /></div>
      </LoadingRegion>
    );
  }
  if (!convo || !viewer) {
    return (
      <div className="chat__missing">
        <EmptyState icon="chat" title="Conversation not found" action={<Button onClick={() => navigate(ROUTES.matches, { replace: true })}>Back to matches</Button>} />
      </div>
    );
  }

  const { match, other, messages, state } = convo;
  const draft = drafts[match.id] ?? '';
  const idleDays = Math.floor((Date.now() - new Date(match.lastActivityAt).getTime()) / DAY);
  const contexts = match.contexts ?? [];
  const compat = buildCompatibility(viewer, other);
  const started = messages.some((m) => !m.likeContext);
  const hooks = started ? [] : conversationHooks(viewer, other, compat.shared);
  const archived = state === 'archived';

  const send = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch {
      toast({ message: 'Your message didn’t send. Try again.' });
    }
  };
  const sendText = (text: string) => {
    setDraft(match.id, '');
    void send(() => sendMessage(match.id, { kind: 'text', body: text })).then(() => undefined);
  };
  const sendPhoto = () =>
    void send(() => sendMessage(match.id, { kind: 'photo', body: '', photo: { tone: TONE_LIST[messages.length % TONE_LIST.length]! } }));
  const sendVoice = (durationSec: number) => void send(() => sendMessage(match.id, { kind: 'voice', body: '', voice: { durationSec } }));

  const archive = async (value: boolean) => {
    setMenuOpen(false);
    await setArchived(match.id, value);
    toast({ message: value ? `Archived your chat with ${other.firstName}` : `${other.firstName} is back in your matches` });
    if (value) navigate(ROUTES.matches, { replace: true });
  };

  return (
    <div className="chat">
      <header className="chat__top">
        <IconButton icon="chevronLeft" label="Back to matches" onClick={() => back(ROUTES.matches)} />
        <button type="button" className="chat__who" onClick={() => navigate(ROUTES.chatProfile(match.id))} aria-label={`View ${other.firstName}'s profile`}>
          <Avatar photo={other.photos[0]} name={other.firstName} size={36} />
          <span>{other.firstName}</span>
        </button>
        <IconButton icon="more" label="Conversation options" onClick={() => setMenuOpen(true)} />
      </header>

      <main className="chat__body" aria-label={`Conversation with ${other.firstName}`}>
        <section className="chat__intro" aria-label="How you matched">
          <Avatar photo={other.photos[0]} name={other.firstName} size={72} />
          <p className="chat__intro-title">You matched with {other.firstName}</p>
          <p className="chat__intro-date">{formatDay(match.createdAt)}</p>
          {contexts.some((c) => !c.comment) && (
            <ul className="chat__contexts" role="list">
              {/* Likes with a comment appear below as messages, quoting what was liked. */}
              {contexts.filter((c) => !c.comment).map((c) => (
                <li key={`${c.fromUserId}-${c.at}`}>
                  <span>{describeContext(c, viewer.userId, other.firstName)}</span>
                  {c.snapshot.kind !== 'profile' && (
                    <LikedSnapshot snapshot={c.snapshot} owner={c.aboutUserId === viewer.userId ? viewer : other} compact />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {archived && (
          <div className="chat__banner" role="status">
            <p className="chat__banner-title">This conversation is archived</p>
            <p>It's hidden from your matches. Sending a message brings it back.</p>
            <div className="chat__banner-actions">
              <Button variant="secondary" size="sm" onClick={() => void archive(false)}>Unarchive</Button>
            </div>
          </div>
        )}

        {(state === 'nudge' || state === 'inactive') && (
          <div className="chat__banner" role="region" aria-label="Still interested?">
            <p className="chat__banner-title">{state === 'nudge' ? `Still interested in ${other.firstName}?` : 'This conversation is inactive'}</p>
            <p>
              {state === 'nudge'
                ? `It's been quiet for ${idleDays} days. No pressure either way.`
                : `Quiet for ${idleDays} days. Nothing has been removed. Pick it up whenever you like.`}
            </p>
            <div className="chat__banner-actions">
              <Button size="sm" icon="chat" onClick={() => inputRef.current?.focus()}>Send a message</Button>
              {state === 'nudge' && (
                <Button variant="secondary" size="sm" onClick={() => void keepForLater(match.id).then(() => toast({ message: 'Kept for later' }))}>
                  Keep for later
                </Button>
              )}
              <Button variant="quiet" size="sm" onClick={() => void archive(true)}>Archive match</Button>
            </div>
          </div>
        )}

        {hooks.length > 0 && (
          <section className="chat__hooks" aria-label="Conversation ideas">
            <p className="chat__hooks-title"><Icon name="sparkle" size={16} /> Conversation ideas</p>
            <ul role="list">
              {hooks.map((h) => <li key={h}>{h}</li>)}
            </ul>
            <p className="chat__hooks-note">Just suggestions. Say it your way.</p>
          </section>
        )}

        <ol className="chat__messages" aria-label="Messages">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const newDay = !prev || formatDay(prev.sentAt) !== formatDay(m.sentAt);
            const lastOfGroup = !next || next.senderId !== m.senderId || formatDay(next.sentAt) !== formatDay(m.sentAt);
            return (
              <Fragment key={m.id}>
                {newDay && (
                  <li className="chat__day" aria-hidden="false">
                    <span>{formatDay(m.sentAt)}</span>
                  </li>
                )}
                <li className={lastOfGroup ? 'chat__item chat__item--last' : 'chat__item'}>
                  <MessageBubble
                    message={m}
                    mine={m.senderId === viewer.userId}
                    viewer={viewer}
                    other={other}
                    showTime={lastOfGroup}
                    onPlayVoice={() => toast({ message: 'Voice playback is coming in a later version' })}
                  />
                </li>
              </Fragment>
            );
          })}
        </ol>
      </main>

      <Composer
        value={draft}
        onChange={(v) => setDraft(match.id, v)}
        onSendText={sendText}
        onSendPhoto={sendPhoto}
        onSendVoice={sendVoice}
        name={other.firstName}
        inputRef={inputRef}
      />

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={other.firstName}>
        <ActionList
          actions={[
            { label: 'View profile', icon: 'user', onSelect: () => { setMenuOpen(false); navigate(ROUTES.chatProfile(match.id)); } },
            archived
              ? { label: 'Unarchive conversation', icon: 'archive', onSelect: () => void archive(false) }
              : { label: 'Archive conversation', icon: 'archive', onSelect: () => void archive(true) },
          ]}
        />
      </BottomSheet>
    </div>
  );
}
