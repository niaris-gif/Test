import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // ✅ Vérifier si c'est une route d'authentification
    const isLoginRequest = req.url.includes('/auth/login');
    const isRegisterRequest = req.url.includes('/auth/register');
    
    // ✅ Si c'est login ou register, NE PAS ajouter de token
    if (isLoginRequest || isRegisterRequest) {
      console.log('🔓 Route publique:', req.url);
      return next.handle(req);
    }

    // ✅ Pour les autres routes, ajouter le token s'il existe
    const token = this.authService.getToken();
    
    if (token) {
      console.log('🔐 Ajout du token pour:', req.url);
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // ✅ Gérer les erreurs
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        
        if (error.status === 401 && !isLoginRequest) {
          console.error('❌ Token invalide - Déconnexion');
          this.authService.logout();
          this.router.navigate(['/login']);
        }

        if (error.status === 403) {
          console.error('❌ Accès refusé');
        }

        if (error.status === 500) {
          console.error('❌ Erreur serveur');
        }

        return throwError(() => error);
      })
    );
  }
}