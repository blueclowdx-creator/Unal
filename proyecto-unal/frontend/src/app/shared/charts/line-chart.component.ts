import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { ChartConfigService } from '../../core/charts/chart-config.service';

Chart.register(...registerables, zoomPlugin);

export interface SerieLinea { label: string; value: number; }

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrap">
      <canvas #canvas></canvas>
      <div class="chart-legend-hint" *ngIf="zoomHint">Tip: rueda del mouse para zoom · arrastrar para desplazar · doble click para reset</div>
    </div>
  `,
  styles: [`
    .chart-wrap { position: relative; width: 100%; }
    canvas { width: 100% !important; max-height: 360px; }
    .chart-legend-hint { font-size: 0.7rem; color: var(--color-muted); font-family: var(--font-mono); text-align: right; margin-top: 6px; }
  `]
})
export class LineChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() historico: SerieLinea[] = [];
  @Input() proyeccion: SerieLinea[] = [];
  @Input() titulo = '';
  @Input() zoomHint = true;
  @Input() yLabel = 'Matriculados';
  @Input() showZoom = true;

  private chart?: Chart;

  constructor(private cfg: ChartConfigService) {}

  ngAfterViewInit(): void {
    this.cfg.applyDefaults('Inter, sans-serif');
    this.render();
  }

  ngOnChanges(_: SimpleChanges): void {
    if (this.canvasRef) this.render();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    if (!this.canvasRef) return;
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const histLabels = this.historico.map(p => p.label);
    const histValues = this.historico.map(p => p.value);
    const histSet = new Set(histLabels);
    const allLabels = [...histLabels, ...this.proyeccion.map(p => p.label).filter(l => !histSet.has(l))];

    const histData = allLabels.map(l => {
      const i = histLabels.indexOf(l);
      return i >= 0 ? histValues[i] : null;
    });
    const proyData = allLabels.map(l => {
      const i = this.proyeccion.findIndex(p => p.label === l);
      return i >= 0 ? this.proyeccion[i].value : null;
    });

    // Punto de transición (ultimo historico -> primera proyeccion) para conectar con línea punteada
    const transition = allLabels.length > 0 && histData.length > 0 && proyData.length > 0
      ? histData.length - 1
      : -1;

    const projectedWithBridge = proyData.map((v, i) => {
      if (transition >= 0 && i === transition) return histData[transition];
      return v;
    });

    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, this.cfg.primary + '55');
    gradient.addColorStop(1, this.cfg.primary + '00');

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Histórico',
            data: histData as any,
            borderColor: this.cfg.primary,
            backgroundColor: gradient,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: this.cfg.primary,
            borderWidth: 2.5,
          },
          {
            label: 'Proyección',
            data: projectedWithBridge as any,
            borderColor: this.cfg.accent,
            backgroundColor: 'transparent',
            borderDash: [6, 4],
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: this.cfg.accent,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString('es-CO')}`,
            },
          },
          zoom: this.showZoom ? {
            pan: { enabled: true, mode: 'x' as const },
            zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' as const },
          } : undefined as any,
        },
        scales: {
          x: { grid: { display: false }, title: { display: true, text: 'Periodo académico' } },
          y: { beginAtZero: false, title: { display: true, text: this.yLabel }, grid: { color: this.cfg.gridLine } },
        },
        onClick: () => {},
      },
    };

    this.chart?.destroy();
    this.chart = new Chart(ctx, config);
  }
}
