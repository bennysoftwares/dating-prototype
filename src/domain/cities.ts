import type { ApproxLocation } from './types';

export interface City extends ApproxLocation {
  id: string;
}

/**
 * Curated city list for the prototype. Coordinates are city centres rounded
 * to two decimals, which is all the precision the app ever needs.
 * A real backend would replace this with a geocoding service.
 */
export const CITIES: readonly City[] = [
  { id: 'gothenburg', city: 'Gothenburg', country: 'Sweden', lat: 57.71, lng: 11.97 },
  { id: 'stockholm', city: 'Stockholm', country: 'Sweden', lat: 59.33, lng: 18.07 },
  { id: 'malmo', city: 'Malmö', country: 'Sweden', lat: 55.6, lng: 13.0 },
  { id: 'uppsala', city: 'Uppsala', country: 'Sweden', lat: 59.86, lng: 17.64 },
  { id: 'lund', city: 'Lund', country: 'Sweden', lat: 55.7, lng: 13.19 },
  { id: 'molndal', city: 'Mölndal', country: 'Sweden', lat: 57.66, lng: 12.01 },
  { id: 'kungsbacka', city: 'Kungsbacka', country: 'Sweden', lat: 57.49, lng: 12.08 },
  { id: 'boras', city: 'Borås', country: 'Sweden', lat: 57.72, lng: 12.94 },
  { id: 'halmstad', city: 'Halmstad', country: 'Sweden', lat: 56.67, lng: 12.86 },
  { id: 'trollhattan', city: 'Trollhättan', country: 'Sweden', lat: 58.28, lng: 12.29 },
  { id: 'helsingborg', city: 'Helsingborg', country: 'Sweden', lat: 56.05, lng: 12.69 },
  { id: 'jonkoping', city: 'Jönköping', country: 'Sweden', lat: 57.78, lng: 14.16 },
  { id: 'linkoping', city: 'Linköping', country: 'Sweden', lat: 58.41, lng: 15.62 },
  { id: 'norrkoping', city: 'Norrköping', country: 'Sweden', lat: 58.59, lng: 16.19 },
  { id: 'orebro', city: 'Örebro', country: 'Sweden', lat: 59.27, lng: 15.21 },
  { id: 'vasteras', city: 'Västerås', country: 'Sweden', lat: 59.61, lng: 16.55 },
  { id: 'umea', city: 'Umeå', country: 'Sweden', lat: 63.83, lng: 20.26 },
  { id: 'copenhagen', city: 'Copenhagen', country: 'Denmark', lat: 55.68, lng: 12.57 },
  { id: 'aarhus', city: 'Aarhus', country: 'Denmark', lat: 56.16, lng: 10.2 },
  { id: 'oslo', city: 'Oslo', country: 'Norway', lat: 59.91, lng: 10.75 },
  { id: 'bergen', city: 'Bergen', country: 'Norway', lat: 60.39, lng: 5.32 },
  { id: 'helsinki', city: 'Helsinki', country: 'Finland', lat: 60.17, lng: 24.94 },
  { id: 'london', city: 'London', country: 'United Kingdom', lat: 51.51, lng: -0.13 },
  { id: 'berlin', city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.4 },
  { id: 'amsterdam', city: 'Amsterdam', country: 'Netherlands', lat: 52.37, lng: 4.9 },
];

const BY_ID = new Map(CITIES.map((c) => [c.id, c]));

export function getCity(id: string | null | undefined): City | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function findCityByName(name: string): City | undefined {
  const n = name.trim().toLowerCase();
  return CITIES.find((c) => c.city.toLowerCase() === n);
}

export function toApproxLocation(city: City): ApproxLocation {
  return { city: city.city, country: city.country, lat: city.lat, lng: city.lng };
}
