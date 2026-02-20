import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { PatchedComponent } from './patched.component';

const routes: Routes = [
    { path: '', component: AppComponent },
  { path: 'patched', component: PatchedComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    PatchedComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
