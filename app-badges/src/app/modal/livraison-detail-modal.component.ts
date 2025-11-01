import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { Livraison } from '../models/badge.model';

@Component({
  selector: 'app-livraison-detail-modal',
  standalone: true,
  templateUrl: './livraison-detail-modal.component.html',
  styleUrls: ['./livraison-detail-modal.component.scss'],
  imports: [CommonModule, IonicModule]
})
export class LivraisonDetailModalComponent {
  @Input() livraison!: Livraison;

  constructor(private modalController: ModalController) {}

  getImageUrl(photoUrl: string | undefined): string {
    if (!photoUrl) {
      return 'assets/placeholder.png';
    }
    return `${environment.apiBaseUrl}${photoUrl}`;
  }

  getStatutColor(statut: string): string {
    const colors: { [key: string]: string } = {
      'en_attente': 'warning',
      'en_cours': 'primary',
      'livree': 'success',
      'annulee': 'danger'
    };
    return colors[statut] || 'medium';
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'livree': 'Livrée',
      'annulee': 'Annulée'
    };
    return labels[statut] || statut;
  }

  close() {
    this.modalController.dismiss();
  }
}