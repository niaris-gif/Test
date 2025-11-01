import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginComponentModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'badge-form',
    loadChildren: () => import('./pages/badge-form/badge-form.module').then(m => m.BadgeFormModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'badge-form/:id',
    loadChildren: () => import('./pages/badge-form/badge-form.module').then(m => m.BadgeFormModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'notifications',
    loadChildren: () => import('./pages/notifications/notifications.module').then(m => m.NotificationsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'livraison-form',
    loadComponent: () => import('./pages/livraison-form/livraison-form.component').then(m => m.LivraisonFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'livraisons',
    loadComponent: () => import('./pages/livraisons/livraisons.component').then(m => m.LivraisonsComponent),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
