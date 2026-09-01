import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  nombre = signal('');
  email = signal('');
  password = signal('');
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  async onSubmit() {
    if (!this.nombre() || !this.email() || !this.password()) {
      this.errorMessage.set('Por favor completa todos los campos.');
      return;
    }

    if (this.password().length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.authService.signUp(this.email(), this.password(), this.nombre());
      this.successMessage.set('Registro exitoso. Redirigiendo...');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al registrar usuario.');
    } finally {
      this.loading.set(false);
    }
  }
}
