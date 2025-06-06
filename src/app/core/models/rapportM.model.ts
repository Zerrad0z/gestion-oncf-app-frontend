import { ACT } from "./act.model";
import { Train } from "./train.model";
import { PieceJointe } from "./PieceJointe.model";
import { CategorieRapportEnum } from "./CategorieRapportEnum.model";

export interface RapportM {
  id?: number;
  references: string; // Références(numéro)
  dateEnvoi: string; // Date d'envoi
  dateReception?: string; // Date de réception
  objet: string; // Objet (texte)
  categorie: CategorieRapportEnum; // Catégorie (liste)
  detail: string; // Détail (texte)
  act: ACT; // ACT information - same as working example
  train: Train; // Train information - same as working example
  dateTrain: string; // Date du train
  utilisateur?: any; // Same as working example
  dateCreationSysteme?: string; // Same as working example
  dateDerniereModification?: string; // Same as working example
  piecesJointes?: PieceJointe[]; // Same as working example
}

export interface RapportMRequest {
  references: string;
  dateEnvoi: string;
  dateReception?: string;
  objet: string;
  categorie: CategorieRapportEnum;
  detail: string;
  actId: number;
  trainId: number;
  dateTrain: string;
}

export interface BulkUpdateStatusRequest {
  ids: number[];
  newStatus: string; 
  commentaire?: string;
}

export { CategorieRapportEnum };