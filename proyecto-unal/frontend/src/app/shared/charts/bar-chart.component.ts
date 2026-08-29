import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ChartConfigService } from '../../core/charts/chart-config.service';

Chart.register(...registerables);

export interface BarraDato { label: string; value: number; }

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrap">
      <canvas #canvas></canvas>
    </div>
  `,
  styles: [`
    .chart-wrap { position: relative; width: 100%; }
    canvas { width: 100% !important; max-height: 360px; }
  `]
})
export class BarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() datos: BarraDato[] = [];
  @Input() horizontal = true;
  @Input() yLabel = '';

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

    const labels = this.datos.map(d => d.label);
    const values = this.datos.map(d => d.value);
    const max = Math.max(...values, 1);
    const colors = values.map(v => v / max < 0.3 ? this.cfg.accentLight : this.cfg.primary);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: yLabelText(this.yLabel, this.datos),
          data: values,
          backgroundColor: colors,
          borderRadius: 4,
          maxBarThickness: 26,
        }],
      },
      options: {
        indexAxis: this.horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = (ctx.parsed as any)?.[this.horizontal ? 'x' : 'y'] ?? 0;
                return v.toLocaleString('es-CO');
              },
            },
          },
        },
        scales: {
          x: { beginAtZero: true, grid: { color: this.cfg.gridLine } },
          y: { grid: { display: false } },
        },
      },
    };

    this.chart?.destroy();
    this.chart = new Chart(ctx, config);
  }
}

function yLabelText(yLabel: string, datos: BarraDato[]): string {
  if (yLabel) return yLabel;
  if (datos.length === 0) return 'Valor';
  return 'Valor';
}
