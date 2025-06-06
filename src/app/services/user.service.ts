import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthHttpService } from './auth-http.service';
import { User, UserRequest, UserUpdateRequest } from '../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private authHttp: AuthHttpService) {}

  getAllUsers(): Observable<User[]> {
    return this.authHttp.get<User[]>('/utilisateurs');
  }

  getUserById(id: number): Observable<User> {
    return this.authHttp.get<User>(`/utilisateurs/${id}`);
  }

  createUser(userRequest: UserRequest): Observable<User> {
    return this.authHttp.post<User>('/utilisateurs', userRequest);
  }

  updateUser(id: number, userUpdateRequest: UserUpdateRequest): Observable<User> {
    return this.authHttp.put<User>(`/utilisateurs/${id}`, userUpdateRequest);
  }

  deleteUser(id: number): Observable<void> {
    return this.authHttp.delete<void>(`/utilisateurs/${id}`);
  }

  toggleUserStatus(id: number): Observable<User> {
    return this.authHttp.patch<User>(`/utilisateurs/${id}/status`, {});
  }

  updateLastConnection(id: number): Observable<User> {
    return this.authHttp.patch<User>(`/utilisateurs/${id}/connexion`, {});
  }

  searchUsers(searchTerm: string): Observable<User[]> {
    return this.authHttp.get<User[]>('/utilisateurs/search', { search: searchTerm });
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.authHttp.get<User[]>('/utilisateurs/by-role', { role });
  }

  getActiveUsers(): Observable<User[]> {
    return this.authHttp.get<User[]>('/utilisateurs/active', { actif: 'true' });
  }
}