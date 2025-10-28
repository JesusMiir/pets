import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PotdService } from '../../services/potd.service';
import { PetsService } from '../../services/pets.service';
import { Pet } from '../../models/pet.model';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, take } from 'rxjs';

@Component({
  selector: 'app-potd-banner',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './potd-banner.html',
  styleUrl: './potd-banner.css',
})
export class PotdBanner implements OnDestroy {
  private potd = inject(PotdService);
  private pets = inject(PetsService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  pet = signal<Pet | null>(null);
  lastId = signal<number | null>(null);

  constructor() {
    this.potd
      .getTodayPetId()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (id) => {
          this.lastId.set(id);
          this.pets
            .getPet(String(id))
            .pipe(take(1), takeUntil(this.destroy$))
            .subscribe({
              next: (p) => this.pet.set(p),
              error: () => this.pet.set(null),
            });
        },
        error: () => {
          this.lastId.set(null);
          this.pet.set(null);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  bgImage() {
    const photo = this.pet()?.photo_url?.trim();
    const url = photo ? photo : 'assets/img-default.jpg';
    return {
      background: `#111 url('${url}') center/cover no-repeat`,
    } as const;
  }

  goToPetOfTheDay() {
    const id = this.lastId();
    if (id != null) this.router.navigate(['/pets', id]);
  }
}
