import { Component } from '@angular/core';

@Component({
  selector: 'app-patched',
  templateUrl: './patched.component.html',
  styleUrls: ['./patched.component.css']
})
export class PatchedComponent {
  message = 'This is the new patched component.';
}
