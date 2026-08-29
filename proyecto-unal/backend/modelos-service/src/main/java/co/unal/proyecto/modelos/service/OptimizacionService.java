package co.unal.proyecto.modelos.service;

import co.unal.proyecto.modelos.client.MatriculaClient;
import co.unal.proyecto.modelos.dto.MatriculaStatsDtos.DemandaFacultadSedeDTO;
import org.apache.commons.math3.optim.MaxIter;
import org.apache.commons.math3.optim.PointValuePair;
import org.apache.commons.math3.optim.linear.*;
import org.apache.commons.math3.optim.nonlinear.scalar.GoalType;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OptimizacionService {

    private final MatriculaClient matriculaClient;

    public OptimizacionService(MatriculaClient matriculaClient) {
        this.matriculaClient = matriculaClient;
    }

    public record AsignacionFacultad(String facultad, double demandaHistoricaPromedio, double pesoEquidad,
                                      double cuposAsignados) {}
    public record ResultadoOptimizacion(String sede, int cuposTotales, double valorObjetivo,
                                         List<AsignacionFacultad> asignaciones) {}

    public ResultadoOptimizacion optimizar(String sede, int cuposTotales) {
        List<DemandaFacultadSedeDTO> datos = matriculaClient.demandaFacultadSede();
        if (sede != null && !sede.isBlank()) {
            String sedeNorm = normalizar(sede);
            datos = datos.stream().filter(d -> normalizar(d.sede()).equals(sedeNorm)).collect(Collectors.toList());
        }

        // Promedio historico de "nuevos" por facultad (demanda estimada) y participacion relativa
        Map<String, List<Long>> nuevosPorFacultad = new LinkedHashMap<>();
        for (DemandaFacultadSedeDTO d : datos) {
            nuevosPorFacultad.computeIfAbsent(d.facultad(), k -> new ArrayList<>()).add(d.nuevos());
        }

        List<String> facultades = new ArrayList<>(nuevosPorFacultad.keySet());
        int n = facultades.size();
        if (n == 0) {
            return new ResultadoOptimizacion(sede, cuposTotales, 0, List.of());
        }

        double[] demandaPromedio = new double[n];
        double totalGeneral = 0;
        for (int i = 0; i < n; i++) {
            List<Long> valores = nuevosPorFacultad.get(facultades.get(i));
            double promedio = valores.stream().mapToLong(Long::longValue).average().orElse(0);
            demandaPromedio[i] = Math.max(promedio, 1); // evitar demanda cero
            totalGeneral += demandaPromedio[i];
        }

        // Peso de equidad: inversamente proporcional a la participacion historica (favorece a
        // facultades con menor cobertura relativa de estudiantes nuevos)
        double[] pesos = new double[n];
        for (int i = 0; i < n; i++) {
            double participacion = demandaPromedio[i] / totalGeneral;
            pesos[i] = 1.0 / (participacion + 0.01);
        }

        // ----- Construir y resolver el problema de programacion lineal -----
        LinearObjectiveFunction objetivo = new LinearObjectiveFunction(pesos, 0);

        List<LinearConstraint> restricciones = new ArrayList<>();
        double[] unos = new double[n];
        Arrays.fill(unos, 1.0);
        restricciones.add(new LinearConstraint(unos, Relationship.LEQ, cuposTotales));

        for (int i = 0; i < n; i++) {
            double[] coef = new double[n];
            coef[i] = 1.0;
            restricciones.add(new LinearConstraint(coef, Relationship.LEQ, demandaPromedio[i]));
        }

        SimplexSolver solver = new SimplexSolver();
        PointValuePair solucion = solver.optimize(
                new MaxIter(1000), objetivo, new LinearConstraintSet(restricciones),
                GoalType.MAXIMIZE, new NonNegativeConstraint(true));

        double[] x = solucion.getPoint();
        List<AsignacionFacultad> asignaciones = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            asignaciones.add(new AsignacionFacultad(facultades.get(i), demandaPromedio[i], pesos[i],
                    Math.round(x[i] * 100.0) / 100.0));
        }
        asignaciones.sort((a, b) -> Double.compare(b.cuposAsignados(), a.cuposAsignados()));

        return new ResultadoOptimizacion(sede, cuposTotales, solucion.getValue(), asignaciones);
    }

    private static String normalizar(String s) {
        if (s == null) return null;
        String sinTildes = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return sinTildes.trim().toLowerCase();
    }
}
