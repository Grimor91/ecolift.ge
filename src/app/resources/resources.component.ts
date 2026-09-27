import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface PdfItem {
  title: string;
  description?: string;
  url: string;
}

interface PdfCategory {
  category: string;
  items: PdfItem[];
}

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, TranslateModule], // 🔥 THIS IS THE FIX
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.css'],
})
export class ResourcesComponent {
  pdfCategories: PdfCategory[] = [
    {
      category: 'categories.elevators',
      items: [
        {
          title: 'categories.titletech',
          description: 'categories.descriptiontech',
          url: 'assets/pdfs/elevators/mpflex.pdf',
        },
        {
          title: 'categories.titledes',
          description: 'categories.descriptiondes',
          url: 'assets/pdfs/elevators/elevatorcatalog.pdf',
        },
      ],
    },
    {
      category: 'categories.escalators',
      items: [
        {
          title: 'categories.escalatorTech',
          url: 'assets/pdfs/escalators/escalator-technical.pdf',
        },
      ],
    },
    {
      category: 'categories.hoists',
      items: [
        {
          title: 'categories.hoistOverview',
          url: 'assets/pdfs/hoists/alimakgeo.pdf',
        },
      ],
    },
    {
      category: 'categories.partners',
      items: [
        {
          title: 'categories.partnerPresentation',
          url: 'assets/pdfs/partners/fisher.pdf',
        },
      ],
    },
  ];
}
