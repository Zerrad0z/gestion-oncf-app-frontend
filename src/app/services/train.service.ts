import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Train,TrainRequest } from '../core/models/train.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrainService {
  // Update this URL to include /v1/ to match your backend
  private apiUrl = `${environment.apiUrl}/trains`;

  constructor(private http: HttpClient) {
    // Log the API URL for debugging
    console.log('TrainService initialized with URL:', this.apiUrl);
  }

  getAllTrains(): Observable<Train[]> {
    return this.http.get<Train[]>(this.apiUrl).pipe(
      tap(trains => console.log(`Fetched ${trains.length} trains`)),
      catchError(error => {
        console.error('Error fetching trains:', error);
        return throwError(() => error);
      })
    );
  }

  getTrainById(id: number): Observable<Train> {
    return this.http.get<Train>(`${this.apiUrl}/${id}`).pipe(
      tap(train => console.log('Fetched train:', train)),
      catchError(error => {
        console.error(`Error fetching train with ID ${id}:`, error);
        return throwError(() => error);
      })
    );
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