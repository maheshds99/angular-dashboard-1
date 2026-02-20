import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <aside class="sidebar">
      <nav>
        <a class="item" routerLink="/">Overview</a>
        <a class="item">Traffic</a>
        <a class="item">Sales</a>
        <a class="item">Users</a>
        <a class="item">Settings</a>
        <a class="item" routerLink="/patched" routerLinkActive="active">Patching</a>
      </nav>
      <div class="footer">© 2025 Analytics</div>
    </aside>
  `,
  styles: [
    `
    .sidebar { width:220px; background:linear-gradient(180deg,#fbfcff,#f4f7fb); border-right:1px solid #e6eef7; padding:18px; display:flex; flex-direction:column; justify-content:space-between; }
    .item { display:block; padding:10px 12px; margin-bottom:6px; border-radius:8px; color:#0f1724; cursor:pointer; }
    .item.active { background:#e8f2ff; font-weight:600; }
    .footer { color:#94a3b8; font-size:12px; margin-top:12px; }
    `
  ]
})
export class SidebarComponent {}
