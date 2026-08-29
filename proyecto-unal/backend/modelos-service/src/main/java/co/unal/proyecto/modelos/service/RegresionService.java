package co.unal.proyecto.modelos.service;

import co.unal.proyecto.modelos.client.MatriculaClient;
import co.unal.proyecto.modelos.dto.MatriculaStatsDtos.MatriculaPeriodoSedeDTO;
import org.apache.commons.math3.stat.regression.SimpleRegression;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;


@Service
public class RegresionService {

    private final MatriculaClient matriculaClient;

    public RegresionService(MatriculaClient matriculaClient) {
        this.matriculaClient = matriculaClient;
    }

    public record PuntoSerie(int anio, int semestre, long total, boolean proyectado) {}

    public record ResultadoRegresion(String sedeFiltrada, double pendiente, double intercepto,
                                      double r2, List<PuntoSerie> historico, List<PuntoSerie> proyeccion) {}

    public ResultadoRegresion proyectar(String sede, int periodosFuturos) {
        List<MatriculaPeriodoSedeDTO> datos = matriculaClient.matriculaPorPeriodoSede();
        if (sede != null && !sede.isBlank()) {
            String sedeNorm = normalizar(sede);
            datos = datos.stream().filter(d -> normalizar(d.sede()).equals(sedeNorm)).collect(Collectors.toList());
        }

        Map<String, Long> agregados = new TreeMap<>();
        Map<String, int[]> periodoAnioSem = new HashMap<>();
        for (MatriculaPeriodoSedeDTO d : datos) {
            String key = d.anio() + "-" + d.semestre();
            agregados.merge(key, d.total(), Long::sum);
            periodoAnioSem.put(key, new int[]{d.anio(), d.semestre()});
        }

        List<String> keysOrdenadas = new ArrayList<>(agregados.keySet());
        keysOrdenadas.sort((a, b) -> {
            int[] pa = periodoAnioSem.get(a), pb = periodoAnioSem.get(b);
            int cmpAnio = Integer.compare(pa[0], pb[0]);
            return cmpAnio != 0 ? cmpAnio : Integer.compare(pa[1], pb[1]);
        });

        SimpleRegression regression = new SimpleRegression();
        List<PuntoSerie> historico = new ArrayList<>();
        int t = 0;
        for (String key : keysOrdenadas) {
            long total = agregados.get(key);
            int[] anioSem = periodoAnioSem.get(key);
            regression.addData(t, total);
            historico.add(new PuntoSerie(anioSem[0], anioSem[1], total, false));
            t++;
        }

        double pendiente = regression.getSlope();
        double intercepto = regression.getIntercept();
        double r2 = regression.getRSquare();

        List<PuntoSerie> proyeccion = new ArrayList<>();
        if (!keysOrdenadas.isEmpty()) {
            int[] ultimo = periodoAnioSem.get(keysOrdenadas.get(keysOrdenadas.size() - 1));
            int anio = ultimo[0];
            int semestre = ultimo[1];
            for (int i = 1; i <= periodosFuturos; i++) {
                semestre++;
                if (semestre > 2) { semestre = 1; anio++; }
                double yPred = regression.predict(t);
                proyeccion.add(new PuntoSerie(anio, semestre, Math.round(yPred), true));
                t++;
            }
        }

        return new ResultadoRegresion(sede, pendiente, intercepto, r2, historico, proyeccion);
    }

    private static String normalizar(String s) {
        if (s == null) return null;
        String sinTildes = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return sinTildes.trim().toLowerCase();
    }
}
