import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Pet } from '../../models/pet.model';
import { computeHealth } from '../../utils/health';
import { PotdService } from '../../services/potd.service';

@Component({
  selector: 'app-pet-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './pet-card.html',
  styleUrl: './pet-card.css',
})
export class PetCard {
  @Input({ required: true }) pet!: Pet;

  readonly URL_IMAGEN_POR_DEFECTO = 'img-default.jpg';
  isPotd = false;

  private potd = inject(PotdService);

  ngOnInit() {
    this.potd.getTodayPetId().subscribe((id) => {
      this.isPotd = id === this.pet.id;
    });
  }

  manejarErrorDeCarga(evento: Event) {
    const img = evento.target as HTMLImageElement;
    if (img.src.includes(this.URL_IMAGEN_POR_DEFECTO)) return;
    img.src = this.URL_IMAGEN_POR_DEFECTO;
  }

  get healthTier(): 'unhealthy' | 'healthy' | 'very-healthy' {
    return computeHealth(this.pet);
  }

  get healthLabel(): string {
    const t = this.healthTier;
    if (t === 'very-healthy') return 'VERY_HEALTHY';
    if (t === 'unhealthy') return 'UNHEALTHY';
    return 'HEALTHY';
  }
}
