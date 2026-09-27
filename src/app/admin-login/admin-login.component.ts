import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shop/auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
})
export class AdminLoginComponent {
  email = '';
  password = '';
  error = false;
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.loading = true;
    this.error = false;
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }
}
