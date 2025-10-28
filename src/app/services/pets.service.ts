import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Pet } from '../models/pet.model';
import { PetsQuery } from '../models/pets-query';

export interface PetsPage {
  items: Pet[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class PetsService {
  private http = inject(HttpClient);
  private base = '';

  getPets(q: PetsQuery = {}): Observable<Pet[]> {
    const params = this.buildParams(q);
    return this.http.get<Pet[]>(`${this.base}/pets`, { params });
  }

  getPet(id: string | number): Observable<Pet> {
    return this.http.get<Pet>(`${this.base}/pets/${id}`);
  }

  getPetsPage(q: PetsQuery = {}): Observable<PetsPage> {
    const params = this.buildParams(q);

    return this.http
      .get<Pet[]>(`${this.base}/pets`, {
        params,
        observe: 'response',
      })
      .pipe(
        map((res) => ({
          items: res.body ?? [],
          total: Number(res.headers.get('X-Total-Count') ?? 0),
        }))
      );
  }

  private buildParams(q: PetsQuery): HttpParams {
    let p = new HttpParams();
    if (q.sortBy) p = p.set('_sort', q.sortBy);
    if (q.sortOrder) p = p.set('_order', q.sortOrder);
    if (q.kind) p = p.set('kind', q.kind);
    if (q.nameLike?.trim()) p = p.set('name_like', q.nameLike.trim());
    if (q.page) p = p.set('_page', String(q.page));
    if (q.limit) p = p.set('_limit', String(q.limit));
    return p;
  }
}
