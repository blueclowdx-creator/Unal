import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ChartConfigService } from '../../core/charts/chart-config.service';

Chart.register(...registerables);

export interface DatoDona { label: string; value: number; }

@Component({
  selector: 'app-doughnut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrap">
      <canvas #canvas></canvas>
    </div>
  `,
  styles: [`
    .chart-wrap { position: relative; width: 100%; display: flex; justify-content: center; }
    canvas { width: 100% !important; max-height: 320px; }
  `]
})
export class DoughnutChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() datos: DatoDona[] = [];
  @Input() tituloLeyenda = '';

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
    const colors = this.datos.map((_, i) => this.cfg.getColor(i));

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 12,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: { padding: 12, font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const val = (ctx.parsed as number);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return `${ctx.label}: ${val.toLocaleString('es-CO')} (${pct}%)`;
              },
            },
          },
        },
      },
    };

    this.chart?.destroy();
    this.chart = new Chart(ctx, config);
  }
}
