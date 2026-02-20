import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private http: HttpClient){}

  // Local mocks kept for non-server data (sessions, signups, products, sources)
  getLocalDashboard(){
    return {
      revenue: 125430,
      users: 8421,
      conversion: 4.2,
      bounce: 36,
      sessions: {
        labels: Array.from({length:30}, (_,i)=>`Day ${i+1}`),
        datasets: [{label:'Sessions', data: Array.from({length:30}, ()=>Math.floor(400+Math.random()*600)), borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,0.08)'}]
      },
      products: {
        labels:['Basic','Pro','Enterprise'],
        datasets:[{label:'Sales', data:[1200,900,450], backgroundColor:['#60a5fa','#3b82f6','#2563eb']}]
      },
      sources: {
        labels:['Organic','Paid','Referral'],
        datasets:[{data:[55,30,15], backgroundColor:['#34d399','#60a5fa','#f59e0b']}]
      },
      signups: [
        {name:'Alice J', email:'alice@example.com', plan:'Pro', date:'2025-12-10'},
        {name:'Ben K', email:'ben@example.com', plan:'Basic', date:'2025-12-11'},
        {name:'Cara S', email:'cara@example.com', plan:'Enterprise', date:'2025-12-12'}
      ]
    };
  }

  // Fetch aggregations from backend (MSSQL). Backend returns object with keys 'os','type','dept','region','os_by_region','servers'
  getAggregations(): Observable<any>{
    return this.http.get('/api/aggregations').pipe(catchError(err=>{
      console.warn('getAggregations failed, falling back to sample', err);
      // fallback: call sample endpoint
      return this.http.get('/api/servers-sample').pipe(catchError(()=> of({ servers: [] })));
    }));
  }

  // Backwards-compat helper used by older dashboard code
  getDashboard(){
    return this.getLocalDashboard();
  }

  // paginated servers list (backend supports ?page & ?pageSize & optional filterKey/filterValue)
  getServers(page = 1, pageSize = 50, filterKey?: string, filterValue?: string){
    const params: any = { page: String(page), pageSize: String(pageSize) };
    if(filterKey) params.filterKey = filterKey;
    if(filterValue) params.filterValue = filterValue;
    return this.http.get('/api/servers', { params }).pipe(catchError(err=>{
      console.warn('getServers failed', err);
      return of({ page:1, pageSize:0, total:0, data:[] });
    }));
  }

  getSessions(page = 1, pageSize = 30){
    const params = { page: String(page), pageSize: String(pageSize) };
    return this.http.get('/api/sessions', { params }).pipe(catchError(err=>{
      console.warn('getSessions failed', err);
      return of({ page:1, pageSize:0, total:0, data:[] });
    }));
  }

  getSignups(page = 1, pageSize = 50){
    const params = { page: String(page), pageSize: String(pageSize) };
    return this.http.get('/api/signups', { params }).pipe(catchError(err=>{
      console.warn('getSignups failed', err);
      return of({ page:1, pageSize:0, total:0, data:[] });
    }));
  }
}
