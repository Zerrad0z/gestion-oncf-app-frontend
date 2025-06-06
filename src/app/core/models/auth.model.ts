import { UserRole } from "./user.model";

export interface LoginRequest {
  nomUtilisateur: string;
  motDePasse: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  matricule: string;
  nomPrenom: string;
  nomUtilisateur: string;
  email: string;
  role: UserRole;
  actif: boolean;
  actId?: number;
  actNomPrenom?: string;
}

export interface ChangePasswordRequest {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

export interface MessageResponse {
  message: string;
}