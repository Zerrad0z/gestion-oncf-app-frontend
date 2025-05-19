// src/app/core/models/gare.model.ts
export interface Gare {
  id: number;
  nom: string;
  dateCreation?: Date;
  dateDerniereModification?: Date;
}

export interface GareRequest {
  nom: string;
}