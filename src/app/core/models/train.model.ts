// src/app/core/models/train.model.ts
export interface Train {
  id: number;
  numero: string;
  dateCreation?: Date;
  dateDerniereModification?: Date;
}

export interface TrainRequest {
  numero: string;
}