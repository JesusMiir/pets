import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private translate = inject(TranslateService);
  private router = inject(Router);

  showSearch = signal(true);
  currentSearch = signal('');
  private typingTimer: any;

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((event: any) => {
      this.showSearch.set(!/^\/pets\/\d+$/.test(event.urlAfterRedirects));
      const tree = this.router.parseUrl(event.urlAfterRedirects ?? '/');
      const q = (tree.queryParams?.['q'] ?? '') as string;
      this.currentSearch.set(q);
    });
  }

  currentLang: 'en' | 'es' =
    (localStorage.getItem('lang') as 'en' | 'es') ||
    (this.translate.currentLang as 'en' | 'es') ||
    'en';

  switchLang(lang: 'en' | 'es') {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    this.currentLang = lang;
  }

  onLangChange(event: Event) {
    const select = event.target as HTMLSelectElement | null;
    if (select) this.switchLang(select.value as 'en' | 'es');
  }

  onSearch(term: string) {
    this.currentSearch.set(term);
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.router.navigate([], {
        queryParams: { q: term || null },
        queryParamsHandling: 'merge',
      });
    }, 250);
  }
}
