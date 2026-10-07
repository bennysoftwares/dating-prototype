import { DATING_INTENT_INFO } from '../domain/intent';
import type { Profile } from '../domain/types';
import { ageFromBirthDate } from './time';

export function profileAge(profile: Pick<Profile, 'birthDate'>): number {
  return ageFromBirthDate(profile.birthDate);
}

export function intentLabel(profile: Pick<Profile, 'intent'>): string {
  return DATING_INTENT_INFO[profile.intent].label;
}

export function formatHeight(cm: number): string {
  return `${cm} cm`;
}

/** Approximate great-circle distance, rounded to whole km. Never more precise than that. */
export function approxDistanceKm(a: Profile['location'], b: Profile['location']): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.max(1, Math.round(2 * R * Math.asin(Math.sqrt(h))));
}
