import { Injectable } from '@angular/core';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  Title,
  TimeScale,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  Title,
  zoomPlugin
);

@Injectable({ providedIn: 'root' })
export class ChartConfigService {
  readonly primary = '#1F4D3D';
  readonly primaryDark = '#133227';
  readonly accent = '#C98A2C';
  readonly accentLight = '#E0B36A';
  readonly info = '#3F7E6E';
  readonly alert = '#A8432A';
  readonly ink = '#14201C';
  readonly muted = '#6B7A73';
  readonly line = '#DDD8CB';
  readonly gridLine = 'rgba(20, 32, 28, 0.08)';

  // Paleta ordenada para series múltiples (armoniza con verde institucional)
  readonly seriesPalette = [
    '#1F4D3D', '#C98A2C', '#3F7E6E', '#A8432A', '#7C5E3C',
    '#5A8F82', '#9C6A1F', '#8A3A26', '#2E6B5A', '#D4A95A',
    '#4F6B66', '#B68A4D', '#386A5A', '#7A2E1F', '#A89060',
  ];

  getColor(index: number): string {
    return this.seriesPalette[index % this.seriesPalette.length];
  }

  applyDefaults(fontFamily: string): void {
    Chart.defaults.font.family = fontFamily;
    Chart.defaults.color = this.ink;
    Chart.defaults.borderColor = this.gridLine;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.tooltip.titleFont = { weight: 600 };
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 6;
  }
}
