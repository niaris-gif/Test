import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonicModule, LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    // ✅ Nettoyer complètement au chargement de la page
    console.log('🧹 Nettoyage complet du localStorage...');
    localStorage.clear();
    sessionStorage.clear();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (!this.username || !this.password) {
      this.showAlert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Connexion en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        loading.dismiss();
        console.log('✅ Connexion réussie !');
        this.router.navigate(['/home']);
      },
      error: (error) => {
        loading.dismiss();
        console.error('❌ Erreur de connexion:', error);
        
        const errorMessage = error.error?.message || 
                            'Identifiants incorrects. Veuillez réessayer.';
        
        this.showAlert('Erreur de connexion', errorMessage);
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}