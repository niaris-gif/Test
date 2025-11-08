import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoginResponse, User } from '../models/badge.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  /**
   * Connexion utilisateur
   */
  login(username: string, password: string): Observable<LoginResponse> {
    // ✅ Nettoyer AVANT d'envoyer la requête
    console.log('🧹 Nettoyage avant login...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    
    console.log('📡 Envoi requête login pour:', username);
    console.log('🌐 URL API:', this.apiUrl);
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { 
      username, 
      password 
    }).pipe(
      tap(response => {
        console.log('✅ Réponse login reçue:', response);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    console.log('👋 Déconnexion...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  /**
   * Récupérer le token JWT
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Récupérer l'utilisateur courant
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  /**
   * Charger l'utilisateur depuis le localStorage
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Erreur parsing user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }
}