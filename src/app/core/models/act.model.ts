import { Antenne } from './antenne.model';

export interface ACT {
  id: number;
  matricule: string;
  nomPrenom: string;
  antenne: Antenne;
  dateCreation: string;
  dateDerniereModification: string;
}

export interface ACTRequest {
  matricule: string;
  nomPrenom: string;
  antenneId: number;
}