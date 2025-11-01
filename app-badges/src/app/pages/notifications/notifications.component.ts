import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, LoadingController } from '@ionic/angular';
import { NotificationService } from '../../services/notification.service';
import { Badge } from '../../models/badge.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IONIC_IMPORTS } from 'src/app/shared/ionic-imports';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-notifications',
  standalone: true,
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class NotificationsComponent  implements OnInit {

 lowStockBadges: Badge[] = [];
  loading: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  /**
   * Charger les notifications de stock faible
   */
  async loadNotifications() {
    const loading = await this.loadingController.create({
      message: 'Chargement des notifications...',
      spinner: 'crescent'
    });
    await loading.present();

    this.notificationService.getLowStockBadges().subscribe({
      next: (result) => {
        this.lowStockBadges = result.badges;
        loading.dismiss();
      },
      error: (error) => {
        console.error('Erreur chargement notifications', error);
        loading.dismiss();
      }
    });
  }

  /**
   * Naviguer vers la page d'édition du badge
   */
  goToEditBadge(badge: Badge) {
    this.router.navigate(['/badge-form', badge.id]);
  }

  /**
   * Retourner à la page d'accueil
   */
  goBack() {
    this.router.navigate(['/home']);
  }

  /**
   * Obtenir l'URL de l'image
   */
  getImageUrl(photoUrl: string | undefined): string {
    if (!photoUrl) {
      return 'assets/placeholder.png';
    }
    return `${environment.apiBaseUrl}${photoUrl}`;
  }

  /**
   * Rafraîchir les notifications
   */
  handleRefresh(event: any) {
    this.notificationService.getLowStockBadges().subscribe({
      next: (result) => {
        this.lowStockBadges = result.badges;
        event.target.complete();
      },
      error: (error) => {
        console.error('Erreur refresh', error);
        event.target.complete();
      }
    });
  }
}
