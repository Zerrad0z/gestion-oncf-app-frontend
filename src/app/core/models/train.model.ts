export interface Train {
  id: number;
  numero: string;
  dateCreation?: Date;
  dateDerniereModification?: Date;
}

export interface TrainRequest {
  numero: string;
}