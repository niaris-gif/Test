export interface Badge {
  id?: number;
  nom: string;
  description: string;
  photo_url?: string;
  stock: number;
  prix: number;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'secretaire';
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface NotificationResponse {
  count: number;
  badges: Badge[];
}

export interface Livraison {
  id?: number;
  vente_id?: number;
  badge_id: number;
  user_id?: number;
  client_nom: string;
  client_contact: string;
  lieu_livraison: string;
  prix_badge: number;
  frais_livraison: number;
  prix_total: number;
  quantite: number;
  statut: 'en_attente' | 'en_cours' | 'livree' | 'annulee';
  date_livraison?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Champs joints
  badge_nom?: string;
  badge_photo?: string;
  badge_description?: string;
  user_nom?: string;
}

export interface LivraisonStats {
  total: number;
  en_attente: number;
  en_cours: number;
  livrees: number;
  annulees: number;
  revenu_total: number;
}