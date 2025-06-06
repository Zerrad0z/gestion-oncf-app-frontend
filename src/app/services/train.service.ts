import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthHttpService } from './auth-http.service';
import { Train, TrainRequest } from '../core/models/train.model';

@Injectable({
  providedIn: 'root'
})
export class TrainService {

  constructor(private authHttp: AuthHttpService) {}

  getAllTrains(): Observable<Train[]> {
    return this.authHttp.get<Train[]>('/trains');
  }

  getTrainById(id: number): Observable<Train> {
    return this.authHttp.get<Train>(`/trains/${id}`);
  }

  createTrain(trainData: TrainRequest): Observable<Train> {
    return this.authHttp.post<Train>('/trains', trainData);
  }

  updateTrain(id: number, trainData: TrainRequest): Observable<Train> {
    return this.authHttp.put<Train>(`/trains/${id}`, trainData);
  }

  deleteTrain(id: number): Observable<void> {
    return this.authHttp.delete<void>(`/trains/${id}`);
  }
}