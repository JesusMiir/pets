import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  imports: [TranslateModule],
  styleUrl: './footer.css',
})
export class Footer {
  year = new Date().getFullYear();
}
