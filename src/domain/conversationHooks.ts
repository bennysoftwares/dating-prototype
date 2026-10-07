import type { Profile } from './types';

/**
 * Optional conversation starters for a new chat. Suggestions only: they are never
 * written into the message box or sent on the user's behalf.
 */
export function conversationHooks(viewer: Profile, other: Profile, sharedInterests: string[]): string[] {
  const hooks: string[] = [];
  if (sharedInterests[0]) hooks.push(`You both like ${sharedInterests[0].toLowerCase()}.`);
  const prompt = other.prompts[0];
  if (prompt) hooks.push(`Ask ${other.firstName} about their answer to “${prompt.prompt.replace(/\.\.\.$/, '…')}”`);
  if (sharedInterests[1]) hooks.push(`You’re both into ${sharedInterests[1].toLowerCase()}. Got a favourite?`);
  else if (other.job) hooks.push(`Ask ${other.firstName} what they enjoy about being a ${other.job.toLowerCase()}.`);
  if (viewer.location.city === other.location.city) hooks.push(`You’re both in ${other.location.city}. Favourite spot?`);
  return hooks.slice(0, 3);
}
