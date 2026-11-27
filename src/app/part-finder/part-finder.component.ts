import { Component } from '@angular/core';
import { Router } from '@angular/router';

/** Home page band under the hero: search parts by code, or jump to a brand. */
export const PART_BRANDS: { label: string; short: string; search: string }[] = [
  { label: 'Kone', short: 'KONE', search: 'Kone' },
  { label: 'Otis', short: 'OTIS', search: 'Otis' },
  { label: 'Mitsubishi', short: 'MITS', search: 'Mitsubishi' },
  { label: 'Schindler', short: 'SCHI', search: 'Schindler' },
  { label: 'Hitachi', short: 'HITA', search: 'Hitachi' },
  { label: 'LG Sigma', short: 'LG', search: 'Sigma' },
  { label: 'Toshiba', short: 'TOSH', search: 'Toshiba' },
  { label: 'Monarch', short: 'MON', search: 'Monarch' },
  { label: 'Fuji', short: 'FUJI', search: 'Fuji' },
  { label: 'Hyundai', short: 'HYUN', search: 'Hyundai' },
];

@Component({
  selector: 'app-part-finder',
  templateUrl: './part-finder.component.html',
  styleUrls: ['./part-finder.component.css'],
})
export class PartFinderComponent {
  brands = PART_BRANDS;
  query = '';
  pressed: string | null = null;

  constructor(private router: Router) {}

  submit(): void {
    const q = this.query.trim();
    this.router.navigate(['/parts'], q ? { queryParams: { search: q } } : {});
  }

  pick(search: string): void {
    // Light the button for a moment, like a pressed call button, then go.
    this.pressed = search;
    setTimeout(() => this.router.navigate(['/parts'], { queryParams: { search } }), 220);
  }
}
