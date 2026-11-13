import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../shop/api.service';
import { Equipment, Issue } from '../shop/models';

const emptyForm = () => ({
  name: '',
  phone: '',
  address: '',
  equipment: 'passenger' as Equipment,
  issue: 'stopped' as Issue,
  urgent: false,
  comment: '',
});

@Component({
  selector: 'app-service-request',
  templateUrl: './service-request.component.html',
  styleUrls: ['./service-request.component.css'],
})
export class ServiceRequestComponent {
  readonly equipment: Equipment[] = ['passenger', 'freight', 'escalator', 'other'];
  readonly issues: Issue[] = ['stopped', 'stuck', 'doors', 'noise', 'maintenance', 'modernization', 'other'];

  form = emptyForm();
  sending = false;
  error = false;
  requestId: number | null = null;

  constructor(private api: ApiService, private translate: TranslateService) {}

  submit(): void {
    if (this.sending) return;
    this.sending = true;
    this.error = false;
    this.api.sendServiceRequest({ ...this.form, lang: this.translate.currentLang }).subscribe({
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
