import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import { ApiService } from './api.service';

// Turns an article's Markdown into HTML. Photos are written as `uploads/<file>`
// in the text and point to the API's uploads folder. Angular's [innerHTML]
// sanitizer still removes anything unsafe from the result.
@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  constructor(private api: ApiService) {}

  transform(text: string | null | undefined): string {
    if (!text) return '';
    const html = marked.parse(text, { async: false, gfm: true, breaks: false }) as string;
    return html
      .replace(/(src|href)="uploads\/([A-Za-z0-9._-]+)"/g, (_, attr, file) => `${attr}="${this.api.articleImageUrl(file)}"`)
      .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"')
      // A photo on its own line gets its description shown under it.
      .replace(/<p>(<img src="[^"]*" alt="([^"]*)"[^>]*>)<\/p>/g, (_, img, alt) =>
        `<figure>${img}${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`)
      .replace(/<table>/g, '<div class="table-wrap"><table>')
      .replace(/<\/table>/g, '</table></div>');
  }
}
