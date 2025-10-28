import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PetsQuery } from '../../models/pets-query';

type SortField = PetsQuery['sortBy'];
type SortDir = PetsQuery['sortOrder'];

@Component({
  selector: 'app-pets-controls',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './pets-controls.html',
  styleUrl: './pets-controls.css',
})
export class PetsControls {
  @Input() value: PetsQuery = {
    sortBy: undefined,
    sortOrder: undefined,
    kind: '',
    nameLike: '',
    page: 1,
    limit: 30,
  };
  @Output() valueChange = new EventEmitter<PetsQuery>();

  showSortModal = false;
  draft: { sortBy: SortField; sortOrder: SortDir } = { sortBy: undefined, sortOrder: undefined };

  private fieldKeyMap: Record<Exclude<NonNullable<PetsQuery['sortBy']>, undefined>, string> = {
    weight: 'WEIGHT',
    length: 'LENGTH',
    height: 'HEIGHT',
    name: 'NAME',
    kind: 'KIND',
  };

  onChange<K extends keyof PetsQuery>(key: K, v: PetsQuery[K]) {
    const next = { ...this.value, [key]: v };
    if (key !== 'page' && next.page) next.page = 1;
    this.value = next;
    this.valueChange.emit(this.value);
  }

  openSort() {
    this.draft = { sortBy: this.value.sortBy, sortOrder: this.value.sortOrder };
    this.showSortModal = true;
  }

  closeSort() {
    this.showSortModal = false;
  }

  pickSortBy(field: Exclude<SortField, undefined>) {
    this.draft = { ...this.draft, sortBy: field };
  }

  pickSortNone() {
    this.draft = { ...this.draft, sortBy: undefined };
  }

  pickOrder(dir: Exclude<SortDir, undefined>) {
    this.draft = { ...this.draft, sortOrder: dir };
  }

  pickOrderNone() {
    this.draft = { ...this.draft, sortOrder: undefined };
  }

  applyAndClose() {
    this.onChange('sortBy', this.draft.sortBy as any);
    this.onChange('sortOrder', this.draft.sortOrder as any);
    this.closeSort();
  }

  labelKeyFor(field: PetsQuery['sortBy'] | undefined): string {
    if (!field) return 'SORT_BY';
    return this.fieldKeyMap[field] ?? 'SORT_BY';
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.showSortModal) this.closeSort();
  }
}
