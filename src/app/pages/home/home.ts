import {
  Component,
  effect,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PetsService } from '../../services/pets.service';
import { Pet } from '../../models/pet.model';
import { PetsQuery } from '../../models/pets-query';
import { PetCard } from '../../components/pet-card/pet-card';
import { PetsControls } from '../../components/pets-controls/pets-controls';
import { PotdService } from '../../services/potd.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PotdBanner } from '../../components/potd-banner/potd-banner';

type PersistedFilters = Pick<PetsQuery, 'sortBy' | 'sortOrder' | 'kind' | 'nameLike' | 'limit'>;
const LS_KEY = 'filter';

function readFilters(): PersistedFilters {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistFilters(f: PersistedFilters) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(f));
  } catch {}
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PetCard, PetsControls, TranslateModule, PotdBanner],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit, OnDestroy {
  private petsService = inject(PetsService);
  private potd = inject(PotdService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  query = signal<PetsQuery>({
    ...(() => {
      const f = readFilters();
      return {
        sortBy: f.sortBy ?? 'name',
        sortOrder: f.sortOrder ?? 'asc',
        kind: f.kind ?? '',
        nameLike: f.nameLike ?? '',
        limit: f.limit ?? 12,
      };
    })(),
    page: 1,
  });

  pets = signal<Pet[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  total = signal(0);
  hasMore = signal(true);

  private inFlight = false;

  @ViewChild('sentinel', { static: false }) sentinelRef?: ElementRef<HTMLDivElement>;
  private observer?: IntersectionObserver;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q') ?? '';
      const prev = this.query();
      if ((prev.nameLike ?? '') !== q) {
        this.pets.set([]);
        this.total.set(0);
        this.hasMore.set(true);
        this.query.set({
          ...prev,
          nameLike: q,
          page: 1,
        });
      }
    });

    effect(() => {
      const q = this.query();
      this.error.set(null);

      persistFilters({
        sortBy: q.sortBy ?? 'name',
        sortOrder: q.sortOrder ?? 'asc',
        kind: q.kind ?? '',
        nameLike: q.nameLike ?? '',
        limit: q.limit ?? 12,
      });

      if (this.inFlight) return;
      this.loading.set(true);
      this.inFlight = true;

      this.petsService.getPetsPage(q).subscribe({
        next: ({ items, total }) => {
          if ((q.page ?? 1) === 1) {
            this.pets.set(items);
          } else {
            this.pets.set([...this.pets(), ...items]);
          }

          this.total.set(total);

          const loaded = this.pets().length;
          const pageSize = q.limit ?? items.length;
          const noMore = loaded >= total || items.length < pageSize;
          this.hasMore.set(!noMore);

          this.loading.set(false);
          this.inFlight = false;
        },
        error: () => {
          this.error.set('Error fetching pets');
          this.loading.set(false);
          this.inFlight = false;
        },
      });
    });
  }

  onControlsChange(next: PetsQuery) {
    this.pets.set([]);
    this.total.set(0);
    this.hasMore.set(true);

    this.query.set({
      sortBy: next.sortBy ?? this.query().sortBy ?? 'name',
      sortOrder: next.sortOrder ?? this.query().sortOrder ?? 'asc',
      kind: next.kind ?? '',
      nameLike: next.nameLike ?? '',
      page: 1,
      limit: next.limit ?? this.query().limit ?? 12,
    });

    const q = next.nameLike ?? '';
    this.router.navigate([], {
      queryParams: { q: q || null },
      queryParamsHandling: 'merge',
    });
  }

  private loadNextPageIfNeeded() {
    if (this.loading() || this.inFlight || !this.hasMore()) return;
    const q = this.query();
    this.query.set({ ...q, page: (q.page ?? 1) + 1 });
  }

  ngAfterViewInit(): void {
    if (!this.sentinelRef) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) this.loadNextPageIfNeeded();
      },
      {
        root: null,
        rootMargin: '0px 0px 300px 0px',
        threshold: 0,
      }
    );

    this.observer.observe(this.sentinelRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
