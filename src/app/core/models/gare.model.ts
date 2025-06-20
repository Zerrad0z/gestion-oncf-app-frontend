export interface Gare {
  id: number;
  nom: string;
  dateCreation?: Date;
  dateDerniereModification?: Date;
}

export interface GareRequest {
  nom: string;
}