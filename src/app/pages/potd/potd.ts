// src/app/pages/potd/potd.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PetsService } from '../../services/pets.service';
import { PotdService } from '../../services/potd.service';
import { Pet } from '../../models/pet.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-potd',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './potd.html',
  styleUrl: './potd.css',
})
export class PotdPage {
  private potd = inject(PotdService);
  private pets = inject(PetsService);

  pet = signal<Pet | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.potd.getTodayPetId().subscribe({
      next: (id) => {
        this.pets.getPet(String(id)).subscribe({
          next: (p) => {
            this.pet.set(p);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Could not load pet');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('No pet of the day');
        this.loading.set(false);
      },
    });
  }

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = '/img-default.jpg';
  }
}
