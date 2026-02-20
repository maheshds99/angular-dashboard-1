import { Component, Input, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="chart-header">
        <h4>{{title}}</h4>
        <button class="download" (click)="downloadImage()" title="Download chart">⬇</button>
      </div>
      <canvas></canvas>
    </div>
  `,
  styles: [
    `
    .chart-card { background:#fff; padding:12px; border-radius:10px; border:1px solid #e6eef7; }
    .chart-header { margin-bottom:8px; color:#0f1724; font-weight:600; }
    canvas { width:100% !important; height:240px !important; }
    `
  ]
})
export class ChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() type: 'line'|'bar'|'doughnut'|'pie' = 'line';
    @Input() key?: string;
    @Output() sliceClick = new EventEmitter<{ key?: string, label: string, datasetLabel?: string, value?: number }>();
  @Input() title = '';
  @Input() dataset: any = {};
  @Input() options: any = {};
  private chart?: Chart;
  constructor(private el: ElementRef) {}
  ngAfterViewInit(){
    const ctx = this.el.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };
    const cfg: any = { type: this.type, data: this.dataset, options: { ...baseOpts, ...(this.options || {}) } };
        const self = this;
        cfg.options.onClick = (evt: any, elements: any[]) => {
          if(!elements || elements.length === 0) return;
          const el = elements[0] as any;
          const idx = el.index ?? el._index ?? el.element?.index;
          const dIdx = el.datasetIndex ?? el._datasetIndex ?? el.element?.datasetIndex ?? 0;
          const label = cfg.data.labels ? String(cfg.data.labels[idx]) : '';
          const datasetLabel = cfg.data.datasets && cfg.data.datasets[dIdx] ? String(cfg.data.datasets[dIdx].label || '') : '';
          const value = (cfg.data.datasets && cfg.data.datasets[dIdx]) ? cfg.data.datasets[dIdx].data?.[idx] : undefined;
          self.sliceClick.emit({ key: self.key, label, datasetLabel, value });
        };
    this.chart = new Chart(ctx, cfg);
  }
  ngOnChanges(changes: SimpleChanges){
    if(!this.chart && (changes['dataset'] && !changes['dataset'].firstChange)) return;
    if(this.chart && changes['dataset']){
      // replace data and update chart
      try{
        this.chart.data = JSON.parse(JSON.stringify(this.dataset));
        this.chart.update();
      }catch(e){
        this.chart.update();
      }
    }
    if(this.chart && changes['type'] && !changes['type'].firstChange){
      // rebuild chart if type changed (keep click handler)
      const canvas = this.el.nativeElement.querySelector('canvas') as HTMLCanvasElement;
      this.chart.destroy();
      const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };
      const cfg: any = { type: this.type, data: this.dataset, options: { ...baseOpts, ...(this.options || {}) } };
      const self = this;
      cfg.options.onClick = (evt: any, elements: any[]) => {
        if(!elements || elements.length === 0) return;
        const el = elements[0] as any;
        const idx = el.index ?? el._index ?? el.element?.index;
        const dIdx = el.datasetIndex ?? el._datasetIndex ?? el.element?.datasetIndex ?? 0;
        const label = cfg.data.labels ? String(cfg.data.labels[idx]) : '';
        const datasetLabel = cfg.data.datasets && cfg.data.datasets[dIdx] ? String(cfg.data.datasets[dIdx].label || '') : '';
        const value = (cfg.data.datasets && cfg.data.datasets[dIdx]) ? cfg.data.datasets[dIdx].data?.[idx] : undefined;
        self.sliceClick.emit({ key: self.key, label, datasetLabel, value });
      };
      this.chart = new Chart(canvas, cfg);
    }
  }
  ngOnDestroy(){ this.chart?.destroy(); }

  downloadImage(){
    if(!this.chart) return;
    try{
      const url = this.chart.toBase64Image();
      const a = document.createElement('a');
      a.href = url;
      a.download = (this.title||'chart') + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }catch(e){ console.error('downloadImage error', e); }
  }
}
