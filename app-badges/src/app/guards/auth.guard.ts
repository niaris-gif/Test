
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Vérifier si l'utilisateur peut accéder à la route
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    
    // Vérifier si l'utilisateur est authentifié
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Rediriger vers la page de connexion
    console.log('⛔ Accès refusé - Redirection vers /login');
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    
    return false;
  }
}