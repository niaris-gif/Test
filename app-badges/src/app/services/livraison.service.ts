import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Livraison, LivraisonStats } from '../models/badge.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LivraisonService {
  private apiUrl = `${environment.apiUrl}/livraisons`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les livraisons
   */
  getAllLivraisons(statut?: string): Observable<Livraison[]> {
    let params = new HttpParams();
    
    if (statut) {
      params = params.set('statut', statut);
    }
    
    return this.http.get<Livraison[]>(this.apiUrl, { params });
  }

  /**
   * Récupérer les statistiques
   */
  getStats(): Observable<LivraisonStats> {
    return this.http.get<LivraisonStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Récupérer une livraison par ID
   */
  getLivraisonById(id: number): Observable<Livraison> {
    return this.http.get<Livraison>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer une nouvelle livraison
   */
  createLivraison(livraison: Livraison): Observable<Livraison> {
    return this.http.post<Livraison>(this.apiUrl, livraison);
  }

  /**
   * Mettre à jour le statut
   */
  updateStatut(id: number, statut: string): Observable<Livraison> {
    return this.http.put<Livraison>(`${this.apiUrl}/${id}/statut`, { statut });
  }

  /**
   * Mettre à jour une livraison
   */
  updateLivraison(id: number, livraison: Partial<Livraison>): Observable<Livraison> {
    return this.http.put<Livraison>(`${this.apiUrl}/${id}`, livraison);
  }

  /**
   * Supprimer une livraison
   */
  deleteLivraison(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}