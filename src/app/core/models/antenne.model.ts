// src/app/core/models/antenne.model.ts
import { Section } from './section.model';

export interface Antenne {
  id: number;
  nom: string;
  section?: Section;
  sectionId?: number; // This is useful for forms
  sectionNom?: string; // Add this for displaying section name in lists
  nombreAgents?: number; // Add this for showing agent count
  dateCreation?: Date;
  dateDerniereModification?: Date;
}