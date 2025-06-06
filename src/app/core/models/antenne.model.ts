import { Section } from './section.model';

export interface Antenne {
  id: number;
  nom: string;
  section?: Section;
  sectionId?: number; 
  sectionNom?: string; 
  nombreAgents?: number; 
  dateCreation?: Date;
  dateDerniereModification?: Date;
}