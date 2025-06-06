// src/app/services/section.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthHttpService } from './auth-http.service';
import { Section } from '../core/models/section.model';

@Injectable({
  providedIn: 'root'
})
export class SectionService {

  constructor(private authHttp: AuthHttpService) {}

  getAllSections(): Observable<Section[]> {
    return this.authHttp.get<Section[]>('/sections');
  }

  getSectionById(id: number): Observable<Section> {
    return this.authHttp.get<Section>(`/sections/${id}`);
  }

  createSection(section: Partial<Section>): Observable<Section> {
    return this.authHttp.post<Section>('/sections', section);
  }

  updateSection(id: number, section: Partial<Section>): Observable<Section> {
    return this.authHttp.put<Section>(`/sections/${id}`, section);
  }

  deleteSection(id: number): Observable<void> {
    return this.authHttp.delete<void>(`/sections/${id}`);
  }

  searchSections(query: string, page: number = 0, size: number = 10): Observable<Section[]> {
    return this.authHttp.get<Section[]>('/sections/search', { query, page, size });
  }
}

