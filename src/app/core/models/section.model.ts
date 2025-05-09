import { Antenne } from "./antenne.model";

export interface Section {
    id: number;
    nom: string;
    nombreAntennes?: number;
    dateCreation?: Date;
    dateDerniereModification?: Date;
    antennes?: Antenne[];
  }