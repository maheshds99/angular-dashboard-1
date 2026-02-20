import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card.component';
import { ChartComponent } from './chart.component';
import { DataService } from './data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent, ChartComponent],
  providers: [],
  template: `
    <section class="grid">
      <div class="controls-row">
        <div class="stats">
          <app-card title="Revenue" [value]="data.revenue | currency:'USD'"></app-card>
          <app-card title="Users" [value]="data.users"></app-card>
          <app-card title="Conversion" [value]="data.conversion+'%'"></app-card>
          <app-card title="Bounce" [value]="data.bounce+'%'"></app-card>
        </div>
        <div class="range-control">
          <label>Range:
              <select (change)="setRange($any($event.target).value)">
              <option value="7">7d</option>
              <option value="30" selected>30d</option>
              <option value="90">90d</option>
            </select>
          </label>
          <button class="export" (click)="exportCSV()">Export CSV</button>
          <span *ngIf="activeFilterKey" class="filter-badge">Filter: {{activeFilterKey}} = {{activeFilterValue}} <button class="clear" (click)="clearFilter()">✕</button></span>
        </div>
      </div>

      <div class="charts-grid">
        <app-chart type="pie" title="By Operating System" [dataset]="osData" [key]="'os_release'" (sliceClick)="onSliceClick($event)"></app-chart>
        <app-chart type="doughnut" title="By Server Type" [dataset]="typeData" [key]="'server_type'" (sliceClick)="onSliceClick($event)"></app-chart>
        <app-chart type="bar" title="By Department" [dataset]="deptData" [options]="deptOptions" [key]="'department'" (sliceClick)="onSliceClick($event)"></app-chart>
        <app-chart type="pie" title="By Region" [dataset]="regionData" [key]="'region'" (sliceClick)="onSliceClick($event)"></app-chart>
      </div>

      <div class="stacked-chart">
        <app-chart type="bar" title="OS Distribution by Region (stacked)" [dataset]="stackedData" [options]="stackedOptions" [key]="'stacked'" (sliceClick)="onSliceClick($event)"></app-chart>
      </div>

      <div class="table">
        <h3>Recent signups</h3>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Date</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of data.signups">
              <td>{{s.name}}</td><td>{{s.email}}</td><td>{{s.plan}}</td><td>{{s.date}}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [
    `
    .grid { display:grid; gap:16px; grid-template-columns: 1fr; }
    .controls-row { display:flex; justify-content:space-between; align-items:center; gap:12px; }
    .range-control { display:flex; align-items:center; }
    .stats { display:grid; grid-template-columns: repeat(4,1fr); gap:12px; flex:1; }
    .charts { display:grid; grid-template-columns: 2fr 1fr; gap:12px; align-items:start; }
    .side-charts { display:grid; gap:12px; }
    .table { background:#fff; border:1px solid #e6eef7; padding:12px; border-radius:10px; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:8px 10px; text-align:left; border-bottom:1px solid #f1f6fb; }
    @media (max-width:1000px) {
      .stats { grid-template-columns: repeat(2,1fr); }
      .charts { grid-template-columns: 1fr; }
      .controls-row { flex-direction:column; align-items:stretch; }
      .range-control { justify-self:end; }
    }
    @media (max-width:600px) {
      .stats { grid-template-columns: 1fr; }
      .controls-row { gap:8px; }
    }
    .export { margin-left:12px; padding:8px 10px; border-radius:8px; border:1px solid #e6eef7; background:#fff; cursor:pointer; }
    .chart-header { display:flex; justify-content:space-between; align-items:center; }
    .download { background:transparent; border:none; cursor:pointer; font-size:14px; padding:6px; border-radius:6px; }
    .charts-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; }
    .stacked-chart { margin-top:12px; }
    @media (max-width:1000px) { .charts-grid { grid-template-columns: 1fr; } }
    `
  ]
})
export class DashboardComponent {
  private ds = inject(DataService);
  data: any = this.ds.getDashboard();
  selectedRange = 30;
  displayedSessions: any = this.buildSessions(this.selectedRange);
  osData: any = { labels: [], datasets: [] };
  typeData: any = { labels: [], datasets: [] };
  deptData: any = { labels: [], datasets: [] };
  regionData: any = { labels: [], datasets: [] };
  deptOptions = { scales: { y: { beginAtZero: true } } };
  stackedData: any = { labels: [], datasets: [] };
  stackedOptions: any = { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } };
  activeFilterKey?: string | null = null;
  activeFilterValue?: string | null = null;

  constructor(){
    // load initial aggregations from backend
    const local = this.data; // keep local placeholders
    this.data = { ...local };
    // fetch from backend
    const ds = this.ds as any;
    if(ds.getAggregations){
      ds.getAggregations().subscribe((res:any)=>{
        // if backend returned 'servers' with raw rows, compute datasets here
        if(res.servers){ this.data.servers = res.servers; }
        // if res has grouped rows (os/type/dept/region)
        const make = (arr:any, keyLabel:string)=>{
          if(!arr) return { labels:[], datasets:[] };
          const labels = arr.map((r:any)=> r[keyLabel]);
          const values = arr.map((r:any)=> r.cnt || r.CNT || r.count || 0);
          const palette = ['#60a5fa','#3b82f6','#2563eb','#34d399','#f59e0b','#f97316','#a78bfa','#ef4444'];
          const bg = labels.map((_: any, i: number)=> palette[i%palette.length]);
          return { labels, datasets:[{ label: keyLabel, data: values, backgroundColor: bg }] };
        };
        this.osData = make(res.os, 'os_release');
        this.typeData = make(res.type, 'server_type');
        this.deptData = make(res.dept, 'department');
        this.regionData = make(res.region, 'region');
        // stacked: res.os_by_region is rows of { region, os_release, cnt }
        if(res.os_by_region){
          const rows = res.os_by_region;
          const regions = Array.from(new Set(rows.map((r:any)=>r.region))).sort() as string[];
          const oss = Array.from(new Set(rows.map((r:any)=>r.os_release))).sort() as string[];
          const palette = ['#60a5fa','#3b82f6','#2563eb','#34d399','#f59e0b','#f97316','#a78bfa','#ef4444'];
          const datasets = (oss as string[]).map((os: string, idx: number) => ({ label: os, data: (regions as string[]).map((rg: string) => { const rr = rows.find((x:any)=>x.region===rg && x.os_release===os); return rr ? (rr.cnt||0) : 0; }), backgroundColor: palette[idx%palette.length] }));
          this.stackedData = { labels: regions, datasets };
        }else{
          this.computeAggregations();
        }
      }, ()=> this.computeAggregations());
    }else{
      this.computeAggregations();
    }
  }

  setRange(range: number | string){
    this.selectedRange = Number(range);
    this.displayedSessions = this.buildSessions(this.selectedRange);
  }

  buildSessions(range:number){
    const base = this.data.sessions;
    const len = base.labels.length;
    const n = Math.min(range, len);
    const start = Math.max(0, len - n);
    return {
      labels: base.labels.slice(start),
      datasets: base.datasets.map((ds:any)=> ({ ...ds, data: (ds.data||[]).slice(start) }))
    };
  }

  exportCSV(){
    // export signups and sessions as CSV (two sheets merged)
    const lines: string[] = [];
    lines.push('Recent signups');
    lines.push('Name,Email,Plan,Date');
    for(const s of this.data.signups){
      lines.push([s.name, s.email, s.plan, s.date].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
    }
    lines.push('');
    lines.push('Sessions');
    // sessions: labels header then dataset rows
    const sess = this.data.sessions;
    lines.push(["Label", ...sess.labels].join(','));
    for(const ds of sess.datasets){
      lines.push([ds.label, ...(ds.data||[])].join(','));
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-export.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  computeAggregations(){
    const servers = this.getFilteredServers();
    const agg = (key: string) => {
      const map = new Map<string, number>();
      for(const s of servers){
        const v = (s as any)[key] || 'Unknown';
        map.set(v, (map.get(v) || 0) + 1);
      }
      const labels = Array.from(map.keys());
      const values = labels.map(l => map.get(l) || 0);
      const palette = ['#60a5fa','#3b82f6','#2563eb','#34d399','#f59e0b','#f97316','#a78bfa','#ef4444'];
      const bg = labels.map((_: any, i: number)=> palette[i % palette.length]);
      return { labels, datasets: [{ label: key, data: values, backgroundColor: bg }] };
    };

    this.osData = agg('os_release');
    this.typeData = agg('server_type');
    this.deptData = agg('department');
    this.regionData = agg('region');

    // stacked: OS by region
    const allServers = this.data.servers || [];
    const regions = Array.from(new Set(allServers.map((s:any)=>s.region))).sort();
    const oss = Array.from(new Set(allServers.map((s:any)=>s.os_release))).sort();
    const palette = ['#60a5fa','#3b82f6','#2563eb','#34d399','#f59e0b','#f97316','#a78bfa','#ef4444'];
    const datasets = oss.map((os, idx) => {
      const data = regions.map(r => servers.filter((s:any)=>s.region===r && s.os_release===os).length);
      return { label: os, data, backgroundColor: palette[idx % palette.length] };
    });
    this.stackedData = { labels: regions, datasets };
  }

  getFilteredServers(){
    const servers = this.data.servers || [];
    if(!this.activeFilterKey || !this.activeFilterValue) return servers;
    const k = this.activeFilterKey as string;
    return servers.filter((s:any)=> String((s as any)[k]) === String(this.activeFilterValue));
  }

  onSliceClick(evt: any){
    if(!evt) return;
    let filterKey: string | null = null;
    let filterValue: string | null = null;
    if(evt.key === 'stacked'){
      // prefer datasetLabel (OS) if present, otherwise region label
      if(evt.datasetLabel){ filterKey = 'os_release'; filterValue = evt.datasetLabel; }
      else { filterKey = 'region'; filterValue = evt.label; }
    } else {
      filterKey = evt.key || null;
      filterValue = evt.label || null;
    }

    if(filterKey && filterValue){
      if(this.activeFilterKey === filterKey && this.activeFilterValue === filterValue){
        // toggle off
        this.activeFilterKey = null; this.activeFilterValue = null;
      }else{
        this.activeFilterKey = filterKey; this.activeFilterValue = filterValue;
      }
      this.computeAggregations();
    }
  }

  clearFilter(){ this.activeFilterKey = null; this.activeFilterValue = null; this.computeAggregations(); }
}
