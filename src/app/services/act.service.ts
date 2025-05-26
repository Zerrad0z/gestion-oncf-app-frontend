import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ACT, ACTRequest } from '../core/models/act.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActService {
  // This is correctly using the environment variable which already includes "api/v1"
  private apiUrl = `${environment.apiUrl}/acts`;

  constructor(private http: HttpClient) {
    // Log the full base URL on service initialization to verify it's correct
    console.log('ActService initialized with API URL:', this.apiUrl);
  }

  getAllActs(): Observable<ACT[]> {
    return this.http.get<ACT[]>(this.apiUrl);
  }

  getActsByAntenneId(antenneId: number): Observable<ACT[]> {
    return this.http.get<ACT[]>(`${this.apiUrl}/antenne/${antenneId}`);
  }

  getActById(id: number): Observable<ACT> {
    return this.http.get<ACT>(`${this.apiUrl}/${id}`);
  }

  getActByMatricule(matricule: string): Observable<ACT> {
    const url = `${this.apiUrl}/matricule/${matricule}`;
    console.log(`ActService: Calling API to get ACT by matricule: ${matricule}`);
    console.log(`Full API URL: ${url}`);
    
    return this.http.get<ACT>(url).pipe(
      tap(response => console.log('API Response:', response)),
      catchError(error => {
        console.error('API Error:', error);
        // Log more detailed error information
        if (error.status === 0) {
          console.error('Network error - server may be down or CORS issue');
        } else if (error.status === 404) {
          console.error(`ACT with matricule ${matricule} not found`);
        } else {
          console.error(`Status: ${error.status}, Message: ${error.message}`);
          if (error.error) {
            console.error('Error details:', error.error);
          }
        }
        return throwError(() => error);
      })
    );
  }

  createAct(act: ACTRequest): Observable<ACT> {
    return this.http.post<ACT>(this.apiUrl, act);
  }

  updateAct(id: number, act: ACTRequest): Observable<ACT> {
    return this.http.put<ACT>(`${this.apiUrl}/${id}`, act);
  }

  deleteAct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}