import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../shop/api.service';
import { Building, Capacity, QuoteProduct } from '../shop/models';

const emptyForm = () => ({
  product: 'passenger' as QuoteProduct,
  building: 'residential' as Building,
  floors: null as number | null,
  capacity: '630' as Capacity,
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
  styleUrls: ['../service-request/service-request.component.css'],
})
export class QuoteRequestComponent {
  readonly products: QuoteProduct[] = ['passenger', 'freight', 'panoramic', 'home', 'escalator', 'other'];
  readonly buildings: Building[] = ['residential', 'house', 'office', 'hotel', 'hospital', 'mall', 'industrial', 'other'];
  readonly capacities: Capacity[] = ['400', '630', '1000', '1600', 'unsure'];

  form = emptyForm();
  sending = false;
  error = false;
  requestId: number | null = null;

  constructor(private api: ApiService, private translate: TranslateService) {}

  submit(): void {
    if (this.sending) return;
    this.sending = true;
    this.error = false;
    this.api.sendQuoteRequest({ ...this.form, lang: this.translate.currentLang }).subscribe({
      next: (res) => {
        this.requestId = res.id;
        this.form = emptyForm();
        this.sending = false;
      },
      error: () => {
        this.error = true;
        this.sending = false;
      },
    });
  }
}
