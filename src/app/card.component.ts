import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="card">
      <div class="title">{{title}}</div>
      <div class="value">{{value}}</div>
    </div>
  `,
  styles: [
    `
    .card { background:#fff; padding:14px; border-radius:10px; border:1px solid #e8f2ff; box-shadow: 0 1px 4px rgba(16,24,40,0.02); }
    .title { color:#64748b; font-size:13px; margin-bottom:8px; }
    .value { font-size:20px; font-weight:700; color:#06283d; }
    `
  ]
})
export class CardComponent {
  @Input() title = '';
  @Input() value: any = '';
}
