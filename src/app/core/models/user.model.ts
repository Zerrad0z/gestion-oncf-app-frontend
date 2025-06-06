export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISEUR = 'SUPERVISEUR',
  ENCADRANT = 'ENCADRANT'
}

export interface User {
  id: number;
  matricule: string;
  nomPrenom: string;
  nomUtilisateur: string;
  email: string;
  role: UserRole;
  derniereConnexion?: Date;
  actif: boolean;
  actId?: number;
  actNomPrenom?: string;
  dateCreation?: Date;
  dateDerniereModification?: Date;
}

export interface UserRequest {
  matricule: string;
  nomPrenom: string;
  nomUtilisateur: string;
  motDePasse: string;
  email: string;
  role: UserRole;
  actif?: boolean;
  actId?: number;
}

export interface UserUpdateRequest {
  matricule?: string;
  nomPrenom?: string;
  nomUtilisateur?: string;
  motDePasse?: string;
  email?: string;
  role?: UserRole;
  actif?: boolean;
  actId?: number;
}