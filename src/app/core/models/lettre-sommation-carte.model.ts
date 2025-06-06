import { Gare } from "./gare.model";
import { Train } from "./train.model";
import { ACT } from "./act.model";
import { PieceJointe } from "./PieceJointe.model";
import { StatutEnum } from "./StatutEnum.model";

export interface LettreSommationCarte {
  id?: number;
  act: ACT;
  train: Train;
  gare: Gare;
  dateCreation: string;
  dateInfraction: string;
  statut: StatutEnum;
  gareReglement?: string;
  numeroPpRegularisation?: string;
  montantAmende: string;
  typeCarte: string;
  numeroCarte: string;
  commentaires?: string;
  dateTraitement?: string;
  utilisateur?: any;
  dateCreationSysteme?: string;
  dateDerniereModification?: string;
  piecesJointes?: PieceJointe[];
}

export interface LettreSommationCarteRequest {
  actId: number;
  trainId: number;
  gareId: number;
  dateCreation: string;
  dateInfraction: string;
  statut: StatutEnum;
  gareReglement?: string;
  numeroPpRegularisation?: string;
  montantAmende: string;
  typeCarte: string;
  numeroCarte: string;
  commentaires?: string;
  dateTraitement?: string;
}

export interface BulkUpdateStatusRequest {
  ids: number[];
  newStatus: StatutEnum;
  commentaire?: string;
}

export { StatutEnum };