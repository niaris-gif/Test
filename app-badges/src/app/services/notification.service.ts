import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationResponse } from '../models/badge.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/badges`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les badges avec stock faible (< 5)
   */
  getLowStockBadges(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.apiUrl}/low-stock`);
  }
}