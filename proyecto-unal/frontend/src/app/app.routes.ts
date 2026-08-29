import { Routes } from '@angular/router';
import { ShellComponent } from './shell/shell.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MatriculasComponent } from './features/matriculas/matriculas.component';
import { ModeloRegresionComponent } from './features/modelo-regresion/modelo-regresion.component';
import { ModeloClasificacionComponent } from './features/modelo-clasificacion/modelo-clasificacion.component';
import { ModeloOptimizacionComponent } from './features/modelo-optimizacion/modelo-optimizacion.component';
import { ModeloClusteringComponent } from './features/modelo-clustering/modelo-clustering.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'matriculas', component: MatriculasComponent },
      { path: 'modelos/regresion', component: ModeloRegresionComponent },
      { path: 'modelos/clasificacion', component: ModeloClasificacionComponent },
      { path: 'modelos/optimizacion', component: ModeloOptimizacionComponent },
      { path: 'modelos/clustering', component: ModeloClusteringComponent },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];
