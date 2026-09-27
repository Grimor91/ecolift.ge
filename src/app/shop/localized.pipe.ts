import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// Picks `<field>_<lang>` from an object for the current language, falling back to Georgian.
@Pipe({ name: 'localized', pure: false })
export class LocalizedPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(obj: any, field: string): string {
    if (!obj) return '';
    const lang = this.translate.currentLang || 'ka';
    return obj[`${field}_${lang}`] || obj[`${field}_ka`] || '';
  }
}
