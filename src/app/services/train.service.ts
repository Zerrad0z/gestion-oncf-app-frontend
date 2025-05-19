// src/app/core/services/train.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Train, TrainRequest } from '../core/models/train.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrainService {
  private apiUrl = `${environment.apiUrl}/trains`;

  constructor(private http: HttpClient) { }

  getAllTrains(): Observable<Train[]> {
    return this.http.get<Train[]>(this.apiUrl);
  }

  getTrainById(id: number): Observable<Train> {
    return this.http.get<Train>(`${this.apiUrl}/${id}`);
  }

  createTrain(trainData: TrainRequest): Observable<Train> {
    return this.http.post<Train>(this.apiUrl, trainData);
  }

  updateTrain(id: number, trainData: TrainRequest): Observable<Train> {
    return this.http.put<Train>(`${this.apiUrl}/${id}`, trainData);
  }

  deleteTrain(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}