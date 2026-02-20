import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { DashboardComponent } from './dashboard.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, HeaderComponent, SidebarComponent, DashboardComponent],
  template: `
    <div class="app-shell">
      <app-header></app-header>
      <div class="main-area">
        <app-sidebar></app-sidebar>
        <main class="content">
          <app-dashboard></app-dashboard>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { height:100vh; display:flex; flex-direction:column; font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial; }
    .main-area { display:flex; flex:1; overflow:hidden; }
    .content { flex:1; padding:18px; overflow:auto; background: linear-gradient(180deg,#fbfdff,#f7f9fc); }
  `]
})
export class AppComponent {}
