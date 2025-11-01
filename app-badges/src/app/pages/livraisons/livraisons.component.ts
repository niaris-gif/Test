import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { LivraisonService } from '../../services/livraison.service';
import { Livraison, LivraisonStats } from '../../models/badge.model';
import { environment } from 'src/environments/environment';
import { LivraisonDetailModalComponent } from 'src/app/modal/livraison-detail-modal.component';

@Component({
  selector: 'app-livraisons',
  standalone: true,
  templateUrl: './livraisons.component.html',
  styleUrls: ['./livraisons.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LivraisonsComponent implements OnInit {
  livraisons: Livraison[] = [];
  livraisonsFiltrees: Livraison[] = [];
  stats: LivraisonStats | null = null;
  filtreStatut: string = 'tous';

  constructor(
    private livraisonService: LivraisonService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.loadLivraisons();
    this.loadStats();
  }

  /**
   * Charger toutes les livraisons
   */
  async loadLivraisons() {
    const loading = await this.loadingController.create({
      message: 'Chargement des livraisons...',
      spinner: 'crescent'
    });
    await loading.present();

    this.livraisonService.getAllLivraisons().subscribe({
      next: (livraisons) => {
        this.livraisons = livraisons;
        this.appliquerFiltre();
        loading.dismiss();
      },
      error: (error) => {
        console.error('Erreur chargement livraisons:', error);
        loading.dismiss();
        this.showToast('Erreur lors du chargement', 'danger');
      }
    });
  }

  /**
   * Charger les statistiques
   */
  loadStats() {
    this.livraisonService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Erreur stats:', error);
      }
    });
  }

  /**
   * Appliquer le filtre de statut
   */
  appliquerFiltre() {
    if (this.filtreStatut === 'tous') {
      this.livraisonsFiltrees = this.livraisons;
    } else {
      this.livraisonsFiltrees = this.livraisons.filter(
        l => l.statut === this.filtreStatut
      );
    }
  }

  /**
   * Changer le filtre
   */
  onFiltreChange(event: any) {
    this.filtreStatut = event.detail.value;
    this.appliquerFiltre();
  }

  /**
   * Obtenir la couleur du statut
   */
  getStatutColor(statut: string): string {
    const colors: { [key: string]: string } = {
      'en_attente': 'warning',
      'en_cours': 'primary',
      'livree': 'success',
      'annulee': 'danger'
    };
    return colors[statut] || 'medium';
  }

  /**
   * Obtenir le libellé du statut
   */
  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'livree': 'Livrée',
      'annulee': 'Annulée'
    };
    return labels[statut] || statut;
  }

  /**
   * Obtenir l'icône du statut
   */
  getStatutIcon(statut: string): string {
    const icons: { [key: string]: string } = {
      'en_attente': 'time',
      'en_cours': 'bicycle',
      'livree': 'checkmark-circle',
      'annulee': 'close-circle'
    };
    return icons[statut] || 'help-circle';
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
   * Changer le statut d'une livraison
   */
  async changerStatut(livraison: Livraison) {
    const alert = await this.alertController.create({
      header: 'Changer le statut',
      message: `Livraison pour ${livraison.client_nom}`,
      inputs: [
        {
          label: 'En attente',
          type: 'radio',
          value: 'en_attente',
          checked: livraison.statut === 'en_attente'
        },
        {
          label: 'En cours',
          type: 'radio',
          value: 'en_cours',
          checked: livraison.statut === 'en_cours'
        },
        {
          label: 'Livrée',
          type: 'radio',
          value: 'livree',
          checked: livraison.statut === 'livree'
        },
        {
          label: 'Annulée',
          type: 'radio',
          value: 'annulee',
          checked: livraison.statut === 'annulee'
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: (statut) => {
            if (statut !== livraison.statut) {
              this.updateStatut(livraison.id!, statut);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Mettre à jour le statut
   */
  updateStatut(id: number, statut: string) {
    this.livraisonService.updateStatut(id, statut).subscribe({
      next: () => {
        this.showToast('Statut mis à jour', 'success');
        this.loadLivraisons();
        this.loadStats();
      },
      error: (error) => {
        console.error('Erreur mise à jour:', error);
        this.showToast('Erreur lors de la mise à jour', 'danger');
      }
    });
  }

   /**
   * Voir les détails avec modal
   */
  async voirDetails(livraison: Livraison) {
    const modal = await this.modalController.create({
      component: LivraisonDetailModalComponent,
      componentProps: {
        livraison: livraison
      }
    });

    await modal.present();
  }

  /**
   * Supprimer une livraison
   */
  async deleteLivraison(livraison: Livraison) {
    const alert = await this.alertController.create({
      header: 'Confirmer la suppression',
      message: `Voulez-vous vraiment supprimer cette livraison pour ${livraison.client_nom} ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.livraisonService.deleteLivraison(livraison.id!).subscribe({
              next: () => {
                this.showToast('Livraison supprimée', 'success');
                this.loadLivraisons();
                this.loadStats();
              },
              error: (error) => {
                console.error('Erreur suppression:', error);
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
   * Rafraîchir
   */
  handleRefresh(event: any) {
    this.livraisonService.getAllLivraisons().subscribe({
      next: (livraisons) => {
        this.livraisons = livraisons;
        this.appliquerFiltre();
        this.loadStats();
        event.target.complete();
      },
      error: (error) => {
        console.error('Erreur refresh:', error);
        event.target.complete();
      }
    });
  }

  /**
   * Retourner à l'accueil
   */
  goBack() {
    this.router.navigate(['/home']);
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
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }
}