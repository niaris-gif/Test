import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Badge } from '../models/badge.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BadgeService {
  // IMPORTANT: Changer cette URL pour votre serveur de production
  private apiUrl = `${environment.apiUrl}/badges`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer tous les badges
   */
  getAllBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>(this.apiUrl);
  }

  /**
   * Récupérer un badge par son ID
   */
  getBadgeById(id: number): Observable<Badge> {
    return this.http.get<Badge>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer un nouveau badge
   */
  createBadge(formData: FormData): Observable<Badge> {
    return this.http.post<Badge>(this.apiUrl, formData);
  }

  /**
   * Mettre à jour un badge existant
   */
  updateBadge(id: number, formData: FormData): Observable<Badge> {
    return this.http.put<Badge>(`${this.apiUrl}/${id}`, formData);
  }

  /**
   * Supprimer un badge
   */
  deleteBadge(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Enregistrer une vente (décrémenter le stock)
   */
  enregistrerVente(id: number, quantite: number): Observable<Badge> {
    return this.http.post<Badge>(`${this.apiUrl}/${id}/vente`, { quantite });
  }
}