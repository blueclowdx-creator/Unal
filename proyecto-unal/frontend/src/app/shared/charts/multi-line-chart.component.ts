import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ChartConfigService } from '../../core/charts/chart-config.service';

Chart.register(...registerables);

export interface SerieMultiple { nombre: string; valores: number[]; }
export interface MultiLineInput {
  labels: string[];
  series: SerieMultiple[];
  yLabel?: string;
}

@Component({
  selector: 'app-multi-line-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrap">
      <canvas #canvas></canvas>
    </div>
  `,
  styles: [`
    .chart-wrap { position: relative; width: 100%; }
    canvas { width: 100% !important; max-height: 380px; }
  `]
})
export class MultiLineChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() data: MultiLineInput = { labels: [], series: [] };

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

    const datasets = this.data.series.map((s, i) => ({
      label: s.nombre,
      data: s.valores,
      borderColor: this.cfg.getColor(i),
      backgroundColor: this.cfg.getColor(i) + '22',
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2,
      fill: false,
    }));

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: { labels: this.data.labels, datasets },
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
        },
        scales: {
          x: { grid: { display: false }, title: { display: true, text: 'Periodo académico' } },
          y: { beginAtZero: true, title: { display: true, text: this.data.yLabel ?? 'Total' }, grid: { color: this.cfg.gridLine } },
        },
      },
    };

    this.chart?.destroy();
    this.chart = new Chart(ctx, config);
  }
}
