import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { LivraisonService } from '../../services/livraison.service';
import { Badge, Livraison } from '../../models/badge.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-livraison-form',
  standalone: true,
  templateUrl: './livraison-form.component.html',
  styleUrls: ['./livraison-form.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LivraisonFormComponent implements OnInit {
  badge: Badge | null = null;
  quantite: number = 1;
  
  // Champs du formulaire
  clientNom: string = '';
  clientContact: string = '';
  lieuLivraison: string = '';
  fraisLivraison: number = 0;
  notes: string = '';
  
  prixBadge: number = 0;
  prixTotal: number = 0;

  constructor(
    private livraisonService: LivraisonService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    // Récupérer les données passées depuis la navigation
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.badge = navigation.extras.state['badge'];
      this.quantite = navigation.extras.state['quantite'] || 1;
      
      if (this.badge) {
        this.prixBadge = this.badge.prix;
        this.calculerPrixTotal();
      }
    }
  }

  ngOnInit() {
    // Si pas de badge, retourner à l'accueil
    if (!this.badge) {
      this.showToast('Aucun badge sélectionné', 'warning');
      this.router.navigate(['/home']);
    }
  }

  /**
   * Calculer le prix total
   */
  calculerPrixTotal() {
    this.prixTotal = (this.prixBadge * this.quantite) + this.fraisLivraison;
  }

  /**
   * Mise à jour automatique du prix total
   */
  onFraisChange() {
    this.calculerPrixTotal();
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
   * Sauvegarder la livraison
   */
  async saveLivraison() {
    // Validation
    if (!this.clientNom || !this.clientContact || !this.lieuLivraison) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }

    if (this.fraisLivraison < 0) {
      this.showToast('Les frais de livraison ne peuvent pas être négatifs', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Enregistrement de la livraison...',
      spinner: 'crescent'
    });
    await loading.present();

    const livraison: Livraison = {
      badge_id: this.badge!.id!,
      client_nom: this.clientNom,
      client_contact: this.clientContact,
      lieu_livraison: this.lieuLivraison,
      prix_badge: this.prixBadge,
      frais_livraison: this.fraisLivraison,
      prix_total: this.prixTotal,
      quantite: this.quantite,
      statut: 'en_attente',
      notes: this.notes || undefined
    };

    this.livraisonService.createLivraison(livraison).subscribe({
      next: () => {
        loading.dismiss();
        this.showToast('Livraison enregistrée avec succès', 'success');
        this.router.navigate(['/livraisons']);
      },
      error: (error) => {
        console.error('Erreur création livraison:', error);
        loading.dismiss();
        this.showToast('Erreur lors de l\'enregistrement', 'danger');
      }
    });
  }

  /**
   * Annuler et retourner
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