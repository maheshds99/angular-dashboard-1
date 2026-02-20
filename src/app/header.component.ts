import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <div class="brand">
        <div class="logo">📊</div>
        <div class="title">Analytics Dashboard</div>
      </div>
      <div class="controls">
        <input class="search" placeholder="Search..." />
        <div class="user">Admin</div>
      </div>
    </header>
  `,
  styles: [
    `
    .header { display:flex; justify-content:space-between; align-items:center; padding:12px 18px; background:#ffffff; border-bottom:1px solid #e6eef7; }
    .brand { display:flex; align-items:center; gap:12px; font-weight:600; color:#0f1724; }
    .logo { font-size:20px; }
    .controls { display:flex; align-items:center; gap:12px; }
    .search { padding:8px 10px; border-radius:8px; border:1px solid #e1e8f0; background:#f8fbff; width:220px; }
    .user { padding:6px 10px; background:#f0f6ff; border-radius:8px; }
    `
  ]
})
export class HeaderComponent {}
