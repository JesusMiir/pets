import { Pet } from '../models/pet.model';

export function petOfTheDay(pets: Pet[], tz = 'Europe/Madrid'): Pet | null {
  if (!pets.length) return null;
  const d = new Date();
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d); // YYYY-MM-DD
  // hash simple
  let hash = 0;
  for (let i = 0; i < ymd.length; i++) hash = (hash * 31 + ymd.charCodeAt(i)) >>> 0;
  const idx = hash % pets.length;
  return pets[idx];
}
