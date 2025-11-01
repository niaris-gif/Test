import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { BadgeService } from '../../services/badge.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Badge } from '../../models/badge.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_IMPORTS } from 'src/app/shared/ionic-imports';
import { environment } from 'src/environments/environment';
import { LivraisonService } from 'src/app/services/livraison.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
})
export class HomePage implements OnInit {
  badges: Badge[] = [];
  lowStockCount: number = 0;
  isAdmin: boolean = false;
  username: string = '';

  constructor(
    private badgeService: BadgeService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private livraisonService: LivraisonService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.username = user.username;
      this.isAdmin = user.role === 'admin';
    }
    this.loadBadges();
    this.checkLowStock();
  }

  /**
   * Charger tous les badges
   */
  async loadBadges() {
    const loading = await this.loadingController.create({
      message: 'Chargement des badges...',
      spinner: 'crescent'
    });
    await loading.present();

    this.badgeService.getAllBadges().subscribe({
      next: (badges) => {
        this.badges = badges;
        loading.dismiss();
      },
      error: (error) => {
        console.error('Erreur de chargement', error);
        loading.dismiss();
        this.showToast('Erreur lors du chargement des badges', 'danger');
      }
    });
  }

  /**
   * Vérifier les badges avec stock faible
   */
  checkLowStock() {
    this.notificationService.getLowStockBadges().subscribe({
      next: (result) => {
        this.lowStockCount = result.count;
      },
      error: (error) => {
        console.error('Erreur notifications', error);
      }
    });
  }

  /**
   * Naviguer vers le formulaire d'ajout
   */
  goToAddBadge() {
    this.router.navigate(['/badge-form']);
  }

  /**
   * Naviguer vers le formulaire d'édition
   */
  goToEditBadge(badge: Badge) {
    this.router.navigate(['/badge-form', badge.id]);
  }

  /**
   * Naviguer vers les notifications
   */
  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  /**
 * Naviguer vers les livraisons
 */
goToLivraisons() {
  this.router.navigate(['/livraisons']);
}

   /**
   * Enregistrer une vente avec option de livraison
   */
  async enregistrerVente(badge: Badge) {
    const alert = await this.alertController.create({
      header: 'Enregistrer une vente',
      message: `Stock actuel: ${badge.stock} unité(s)`,
      inputs: [
        {
          name: 'quantite',
          type: 'number',
          placeholder: 'Quantité vendue',
          min: 1,
          max: badge.stock,
          value: 1
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: async (data) => {
            const quantite = parseInt(data.quantite);
            
            if (isNaN(quantite) || quantite <= 0) {
              this.showToast('Quantité invalide', 'warning');
              return false;
            }
            
            if (quantite > badge.stock) {
              this.showToast('Stock insuffisant', 'warning');
              return false;
            }

            // ✅ Enregistrer la vente d'abord
            this.badgeService.enregistrerVente(badge.id!, quantite).subscribe({
              next: () => {
                this.showToast(`Vente de ${quantite} unité(s) enregistrée`, 'success');
                this.loadBadges();
                this.checkLowStock();
                
                // ✅ Demander si livraison nécessaire
                this.demanderLivraison(badge, quantite);
              },
              error: (error) => {
                console.error('Erreur vente', error);
                this.showToast('Erreur lors de l\'enregistrement', 'danger');
              }
            });
            
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Demander si une livraison est nécessaire
   */
  async demanderLivraison(badge: Badge, quantite: number) {
    const alert = await this.alertController.create({
      header: 'Livraison',
      message: 'Cette vente nécessite-t-elle une livraison ?',
      buttons: [
        {
          text: 'Non',
          role: 'cancel'
        },
        {
          text: 'Oui, organiser la livraison',
          handler: () => {
            // ✅ Naviguer vers le formulaire de livraison
            this.router.navigate(['/livraison-form'], {
              state: {
                badge: badge,
                quantite: quantite
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Supprimer un badge
   */
  async deleteBadge(badge: Badge) {
    const alert = await this.alertController.create({
      header: 'Confirmer la suppression',
      message: `Voulez-vous vraiment supprimer le badge "${badge.nom}" ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.badgeService.deleteBadge(badge.id!).subscribe({
              next: () => {
                this.showToast('Badge supprimé avec succès', 'success');
                this.loadBadges();
                this.checkLowStock();
              },
              error: (error) => {
                console.error('Erreur suppression', error);
                this.showToast('Erreur lors de la suppression', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Afficher un toast
   */
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  /**
   * Déconnexion
   */
  async logout() {
    const alert = await this.alertController.create({
      header: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Déconnexion',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Obtenir l'URL complète de l'image
   */
  getImageUrl(photoUrl: string | undefined): string {
    if (!photoUrl) {
      return 'assets/placeholder.png';
    }
    return `${environment.apiBaseUrl}${photoUrl}`;
  }

  /**
   * Rafraîchir les données (pull to refresh)
   */
  handleRefresh(event: any) {
    this.badgeService.getAllBadges().subscribe({
      next: (badges) => {
        this.badges = badges;
        this.checkLowStock();
        event.target.complete();
      },
      error: (error) => {
        console.error('Erreur refresh', error);
        event.target.complete();
      }
    });
  }
}