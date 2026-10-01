import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../shop/api.service';
import { Building, QuoteProduct } from '../shop/models';

const MAX_DRAWING_MB = 15;

const emptyForm = () => ({
  product: 'passenger' as QuoteProduct,
  building: 'residential' as Building,
  floors: null as number | null,
  shaft_width: null as number | null,
  shaft_depth: null as number | null,
  pit_depth: null as number | null,
  last_floor_height: null as number | null,
  floor_height: null as number | null,
  city: '',
  name: '',
  phone: '',
  email: '',
  company: '',
  comment: '',
});

@Component({
  selector: 'app-quote-request',
  templateUrl: './quote-request.component.html',
  styleUrls: ['../service-request/service-request.component.css', './quote-request.component.css'],
})
export class QuoteRequestComponent {
  readonly products: QuoteProduct[] = ['passenger', 'freight', 'panoramic', 'home', 'escalator', 'other'];
  readonly buildings: Building[] = ['residential', 'house', 'office', 'hotel', 'hospital', 'mall', 'industrial', 'other'];
  /** Shaft and floor sizes, all in millimetres. */
  readonly sizes = ['shaft_width', 'shaft_depth', 'pit_depth', 'last_floor_height', 'floor_height'] as const;
  readonly accept = '.pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf';

  form = emptyForm();
  sending = false;
  error = false;
  drawing: File | null = null;
  drawingError = '';
  requestId: number | null = null;

  constructor(private api: ApiService, private translate: TranslateService) {}

  onDrawing(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.drawingError = '';
    if (file && file.size > MAX_DRAWING_MB * 1024 * 1024) {
      this.drawingError = 'quote.drawingTooBig';
      input.value = '';
      return;
    }
    this.drawing = file;
  }

  removeDrawing(input: HTMLInputElement): void {
    this.drawing = null;
    input.value = '';
  }

  submit(): void {
    if (this.sending) return;
    this.sending = true;
    this.error = false;
    this.api.sendQuoteRequest({ ...this.form, lang: this.translate.currentLang }, this.drawing).subscribe({
      next: (res) => {
        this.requestId = res.id;
        this.form = emptyForm();
        this.drawing = null;
        this.sending = false;
      },
      error: () => {
        this.error = true;
        this.sending = false;
      },
    });
  }
}
