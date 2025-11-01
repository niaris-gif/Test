import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LoadingController, ToastController, ActionSheetController, IonicModule } from '@ionic/angular';
import { BadgeService } from '../../services/badge.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_IMPORTS } from 'src/app/shared/ionic-imports';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-badge-form',
  standalone: true,
  templateUrl: './badge-form.component.html',
  styleUrls: ['./badge-form.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
})
export class BadgeFormComponent  implements OnInit {

 badgeId: number | null = null;
  nom: string = '';
  description: string = '';
  stock: number = 0;
  prix: number = 0;
  selectedFile: File | null = null;
  imagePreview: string = '';
  isEditMode: boolean = false;

  constructor(
    private badgeService: BadgeService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.badgeId = parseInt(id);
      this.isEditMode = true;
      this.loadBadge();
    }
  }

  /**
   * Charger un badge existant pour modification
   */
  async loadBadge() {
    const loading = await this.loadingController.create({
      message: 'Chargement du badge...',
      spinner: 'crescent'
    });
    await loading.present();

    this.badgeService.getBadgeById(this.badgeId!).subscribe({
      next: (badge) => {
        this.nom = badge.nom;
        this.description = badge.description;
        this.stock = badge.stock;
        this.prix = badge.prix;
        if (badge.photo_url) {
          this.imagePreview = `${environment.apiBaseUrl}${badge.photo_url}`;
        }
        loading.dismiss();
      },
      error: (error) => {
        console.error('Erreur chargement', error);
        loading.dismiss();
        this.showToast('Erreur lors du chargement du badge', 'danger');
        this.goBack();
      }
    });
  }

  /**
   * Afficher le menu de sélection de photo
   */
  async selectPhotoSource() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Choisir une photo',
      buttons: [
        {
          text: 'Prendre une photo',
          icon: 'camera',
          handler: () => {
            this.takePicture();
          }
        },
        {
          text: 'Galerie',
          icon: 'images',
          handler: () => {
            this.selectFromGallery();
          }
        },
        {
          text: 'Annuler',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  /**
   * Prendre une photo avec la caméra
   */
  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      this.imagePreview = image.dataUrl!;
      
      // Convertir dataUrl en File
      const response = await fetch(image.dataUrl!);
      const blob = await response.blob();
      this.selectedFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    } catch (error) {
      console.error('Erreur caméra:', error);
      this.showToast('Erreur lors de la capture photo', 'danger');
    }
  }

  /**
   * Sélectionner une photo depuis la galerie
   */
  async selectFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      this.imagePreview = image.dataUrl!;
      
      const response = await fetch(image.dataUrl!);
      const blob = await response.blob();
      this.selectedFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    } catch (error) {
      console.error('Erreur galerie:', error);
      this.showToast('Erreur lors de la sélection de la photo', 'danger');
    }
  }

  /**
   * Gérer la sélection de fichier depuis l'input
   */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        this.showToast('Veuillez sélectionner une image', 'warning');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('La photo ne doit pas dépasser 5MB', 'warning');
        return;
      }

      this.selectedFile = file;
      
      // Créer l'aperçu
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Sauvegarder le badge
   */
  async saveBadge() {
    // Validation
    if (!this.nom || !this.description) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }

    if (this.stock < 0) {
      this.showToast('Le stock ne peut pas être négatif', 'warning');
      return;
    }

    if (this.prix <= 0) {
      this.showToast('Le prix doit être supérieur à 0', 'warning');
      return;
    }

    // Créer le FormData
    const formData = new FormData();
    formData.append('nom', this.nom);
    formData.append('description', this.description);
    formData.append('stock', this.stock.toString());
    formData.append('prix', this.prix.toString());

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    // Afficher le loader
    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Modification...' : 'Création...',
      spinner: 'crescent'
    });
    await loading.present();

    // Appel API
    const request = this.isEditMode
      ? this.badgeService.updateBadge(this.badgeId!, formData)
      : this.badgeService.createBadge(formData);

    request.subscribe({
      next: (badge) => {
        loading.dismiss();
        this.showToast(
          this.isEditMode ? 'Badge modifié avec succès' : 'Badge créé avec succès',
          'success'
        );
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Erreur sauvegarde', error);
        loading.dismiss();
        this.showToast('Erreur lors de l\'enregistrement', 'danger');
      }
    });
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
   * Retourner à la page précédente
   */
  goBack() {
    this.router.navigate(['/home']);
  }
}
