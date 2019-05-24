import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TradingService {

  private storageName: string = "trading";

  constructor(private http: HttpClient) {}

  setTradingData(data: any) {
    localStorage.setItem(this.storageName, JSON.stringify(data));
  }

  getTradingData() {
    return JSON.parse(localStorage.getItem(this.storageName));
  }

  clearTradingData() {
    localStorage.removeItem(this.storageName);
  }

  cleanAll() {
    localStorage.clear();
  }

  pullData() {
    return this.http.get(environment.baseUrl);
  }

}
