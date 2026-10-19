import { resolveBirthMoment, type BirthInput } from '../domain/chart';
import { CITIES } from './cities';

export const MANUAL_PLACE = '__manual__';

export interface BirthDraft {
  date: string;
  time: string;
  city: string;
  latitude: string;
  longitude: string;
  timeZone: string;
  timeOccurrence: '' | 'earlier' | 'later';
}

export function createBirthDraft(input?: BirthInput): BirthDraft {
  const city = input && CITIES.find((item) => item.latitude === input.latitude && item.longitude === input.longitude);
  return {
    date: input ? `${String(input.year).padStart(4, '0')}-${String(input.month).padStart(2, '0')}-${String(input.day).padStart(2, '0')}` : '',
    time: input?.hour !== undefined ? `${String(input.hour).padStart(2, '0')}:${String(input.minute ?? 0).padStart(2, '0')}` : '',
    city: city?.name ?? (input?.latitude !== undefined ? MANUAL_PLACE : ''),
    latitude: input?.latitude !== undefined ? String(input.latitude) : '',
    longitude: input?.longitude !== undefined ? String(input.longitude) : '',
    timeZone: input?.timeZone ?? '',
    timeOccurrence: input?.timeOccurrence ?? '',
  };
}

export function birthFromDraft(draft: BirthDraft): BirthInput {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) throw new Error('Please enter a birth date.');
  const [year, month, day] = draft.date.split('-').map(Number) as [number, number, number];
  const input: BirthInput = { year, month, day };
  if (draft.time) {
    if (!/^\d{2}:\d{2}$/.test(draft.time)) throw new Error('Please enter a valid birth time.');
    const [hour, minute] = draft.time.split(':').map(Number) as [number, number];
    input.hour = hour;
    input.minute = minute;
  }
  if (draft.city === MANUAL_PLACE) {
    if (!draft.latitude.trim() || !draft.longitude.trim()) {
      throw new Error('Enter both coordinates, or choose “Not sure / skip” for the birth place.');
    }
    input.latitude = Number(draft.latitude);
    input.longitude = Number(draft.longitude);
  } else if (draft.city) {
    const city = CITIES.find((item) => item.name === draft.city);
    if (!city) throw new Error('Choose a listed birth city or enter coordinates.');
    input.latitude = city.latitude;
    input.longitude = city.longitude;
  }
  if (draft.timeZone.trim()) input.timeZone = draft.timeZone.trim();
  if (input.hour !== undefined && input.latitude === undefined && !input.timeZone) {
    throw new Error('Choose a birth place or enter its timezone so we can interpret the local birth time.');
  }
  if (draft.timeOccurrence) input.timeOccurrence = draft.timeOccurrence;
  resolveBirthMoment(input);
  return input;
}
