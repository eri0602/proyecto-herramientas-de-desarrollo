import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async login() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.login(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(e.message || 'Credenciales incorrectas');
    } finally {
      this.loading.set(false);
    }
  }

  // Modo demo sin Supabase
  loginDemo() {
    this.authService.loginDemo();
    this.router.navigate(['/dashboard']);
  }
}
