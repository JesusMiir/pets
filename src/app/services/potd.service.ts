import { Injectable, inject, signal } from '@angular/core';
import { PetsService } from './pets.service';
import { Observable, map, of } from 'rxjs';

type PotdDay = { date: string; id: number };
type PotdState = { start: string; days: PotdDay[] };

const LS_KEY = 'pet-of-the-day';

function localDateISO(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysLocal(baseISO: string, days: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + days);
  return localDateISO(date);
}

@Injectable({ providedIn: 'root' })
export class PotdService {
  private pets = inject(PetsService);
  private horizon = 31;

  todayId = signal<number | null>(null);

  constructor() {
    this.resolveToday();
  }

  private read(): PotdState | null {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as PotdState) : null;
    } catch {
      return null;
    }
  }

  private write(s: PotdState) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(s));
    } catch {}
  }

  private generateStateFromIds(ids: number[], startISO: string): PotdState {
    const pool = [...ids];
    const days: PotdDay[] = [];
    for (let i = 0; i < this.horizon; i++) {
      const date = addDaysLocal(startISO, i);
      const idx = i % pool.length;
      days.push({ date, id: pool[idx] });
    }
    return { start: startISO, days };
  }

  private needRebuild(s: PotdState | null): boolean {
    if (!s) return true;
    const first = s.start;
    const last = addDaysLocal(first, this.horizon - 1);
    const t = localDateISO();
    return t > last;
  }

  private ensureStateWithIds(ids: number[]): PotdState {
    const existing = this.read();
    if (this.needRebuild(existing)) {
      const start = localDateISO();
      const shuffled = this.shuffle(ids);
      const next = this.generateStateFromIds(shuffled, start);
      this.write(next);
      return next;
    }
    return existing!;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private fetchAllPetIds(): Observable<number[]> {
    return this.pets
      .getPetsPage({ page: 1, limit: 500 })
      .pipe(map((res) => (res.items ?? []).map((p) => p.id)));
  }

  getTodayPetId(): Observable<number> {
    const s = this.read();
    if (!this.needRebuild(s)) {
      const t = localDateISO();
      const found = s!.days.find((d: PotdDay) => d.date === t);
      if (found) return of(found.id);
    }

    return this.fetchAllPetIds().pipe(
      map((ids) => (ids.length ? ids : Array.from({ length: 30 }, (_, i) => i + 1))),
      map((ids) => {
        const next = this.ensureStateWithIds(ids);
        const t = localDateISO();
        const found = next.days.find((d: PotdDay) => d.date === t)!;
        return found.id;
      })
    );
  }

  getPetIdFor(dateISO: string): Observable<number> {
    const s = this.read();
    if (s && !this.needRebuild(s)) {
      const found = s.days.find((d: PotdDay) => d.date === dateISO);
      if (found) return of(found.id);
    }

    return this.fetchAllPetIds().pipe(
      map((ids) => (ids.length ? ids : Array.from({ length: 30 }, (_, i) => i + 1))),
      map((ids) => {
        const next = this.ensureStateWithIds(ids);
        const found = next.days.find((d: PotdDay) => d.date === dateISO) ?? next.days[0];
        return found.id;
      })
    );
  }

  private resolveToday() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;

      const data = JSON.parse(raw) as PotdState;
      const todayStr = localDateISO();
      const hit = data.days.find((d: PotdDay) => d.date === todayStr);
      this.todayId.set(hit ? hit.id : null);
    } catch {
      this.todayId.set(null);
    }
  }
}
