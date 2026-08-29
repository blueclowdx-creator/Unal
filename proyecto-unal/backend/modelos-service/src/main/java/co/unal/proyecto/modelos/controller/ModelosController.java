package co.unal.proyecto.modelos.controller;

import co.unal.proyecto.modelos.service.ClasificacionService;
import co.unal.proyecto.modelos.service.ClusteringSimulacionService;
import co.unal.proyecto.modelos.service.OptimizacionService;
import co.unal.proyecto.modelos.service.RegresionService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/modelos")
@CrossOrigin(origins = "*")
public class ModelosController {

    private final RegresionService regresionService;
    private final ClasificacionService clasificacionService;
    private final OptimizacionService optimizacionService;
    private final ClusteringSimulacionService clusteringSimulacionService;

    public ModelosController(RegresionService regresionService,
                              ClasificacionService clasificacionService,
                              OptimizacionService optimizacionService,
                              ClusteringSimulacionService clusteringSimulacionService) {
        this.regresionService = regresionService;
        this.clasificacionService = clasificacionService;
        this.optimizacionService = optimizacionService;
        this.clusteringSimulacionService = clusteringSimulacionService;
    }

    // Modelo 1: Regresion lineal - proyeccion de demanda de matricula
    @GetMapping("/regresion/proyeccion")
    public RegresionService.ResultadoRegresion proyeccion(
            @RequestParam(required = false) String sede,
            @RequestParam(defaultValue = "4") int periodosFuturos) {
        return regresionService.proyectar(sede, periodosFuturos);
    }

    // Modelo 2: Clasificacion (regresion logistica agregada) - equidad regional PEAMA
    @GetMapping("/clasificacion/equidad")
    public ClasificacionService.ResultadoClasificacion equidad(
            @RequestParam String estrato,
            @RequestParam String tipoColegio) {
        return clasificacionService.entrenarYPredecir(estrato, tipoColegio);
    }

    // Modelo 3: Optimizacion lineal (Simplex) - asignacion de cupos nuevos
    @GetMapping("/optimizacion/cupos")
    public OptimizacionService.ResultadoOptimizacion cupos(
            @RequestParam(required = false) String sede,
            @RequestParam(defaultValue = "500") int cuposTotales) {
        return optimizacionService.optimizar(sede, cuposTotales);
    }

    // Modelo 4a: Clustering K-Means - segmentacion de perfiles estudiantiles
    @GetMapping("/clustering/perfiles")
    public ClusteringSimulacionService.ResultadoClustering perfiles(
            @RequestParam(defaultValue = "4") int k,
            @RequestParam(defaultValue = "3000") int muestra) {
        return clusteringSimulacionService.segmentar(k, muestra);
    }

    // Modelo 4b: Simulacion Monte Carlo - escenarios futuros de matricula
    @GetMapping("/simulacion/montecarlo")
    public ClusteringSimulacionService.ResultadoSimulacion montecarlo(
            @RequestParam(defaultValue = "10") int periodosFuturos,
            @RequestParam(defaultValue = "5000") int iteraciones) {
        return clusteringSimulacionService.simular(periodosFuturos, iteraciones);
    }
}
