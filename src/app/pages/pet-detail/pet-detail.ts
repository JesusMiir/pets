import { Component, inject, signal, DestroyRef, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PetsService } from '../../services/pets.service';
import { PotdService } from '../../services/potd.service';
import { CommonModule } from '@angular/common';
import { Pet } from '../../models/pet.model';
import { computeHealth } from '../../utils/health';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pet-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './pet-detail.html',
  styleUrls: ['./pet-detail.css'],
})
export class PetDetail {
  pet = signal<Pet | null>(null);
  loading = signal(true);
  error = signal(false);
  isPotd = signal(false);

  readonly URL_IMAGEN_POR_DEFECTO = 'img-default.jpg';

  private route = inject(ActivatedRoute);
  private petsService = inject(PetsService);
  private potd = inject(PotdService);
  private destroyRef = inject(DestroyRef);

  healthTier = computed(() => {
    const p = this.pet();
    return p ? computeHealth(p) : 'healthy';
  });

  healthLabel = computed(() => {
    const t = this.healthTier();
    if (t === 'very-healthy') return 'VERY_HEALTHY';
    if (t === 'unhealthy') return 'UNHEALTHY';
    return 'HEALTHY';
  });

  constructor() {
    const sub = this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam) {
        this.error.set(true);
        this.loading.set(false);
        return;
      }
      const id = Number(idParam);
      if (Number.isNaN(id)) {
        this.error.set(true);
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.error.set(false);
      this.petsService.getPet(id).subscribe({
        next: (data) => {
          this.pet.set(data);
          this.potd.getTodayPetId().subscribe((todayId) => {
            this.isPotd.set(todayId === data.id);
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  manejarErrorDeCarga(evento: Event) {
    const img = evento.target as HTMLImageElement;
    if (img.src.includes(this.URL_IMAGEN_POR_DEFECTO)) return;
    img.src = this.URL_IMAGEN_POR_DEFECTO;
  }
}
