package co.unal.proyecto.modelos.service;

import co.unal.proyecto.modelos.client.MatriculaClient;
import co.unal.proyecto.modelos.dto.MatriculaStatsDtos.MatriculaPeriodoSedeDTO;
import co.unal.proyecto.modelos.dto.MatriculaStatsDtos.PerfilEstudianteDTO;
import org.apache.commons.math3.ml.clustering.CentroidCluster;
import org.apache.commons.math3.ml.clustering.DoublePoint;
import org.apache.commons.math3.ml.clustering.KMeansPlusPlusClusterer;
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.springframework.stereotype.Service;

import java.util.*;


@Service
public class ClusteringSimulacionService {

    private final MatriculaClient matriculaClient;
    private final Random random = new Random(42);

    public ClusteringSimulacionService(MatriculaClient matriculaClient) {
        this.matriculaClient = matriculaClient;
    }



    public record Cluster(int id, long tamano, double edadPromedio, double estratoPromedio,
                           double pbmPromedio, double proporcionOficial) {}
    public record ResultadoClustering(int k, int muestrasUsadas, List<Cluster> clusters) {}

    private static int estratoANumero(String estrato) {
        if (estrato == null) return 0;
        String digits = estrato.replaceAll("\\D+", "");
        return digits.isEmpty() ? 0 : Integer.parseInt(digits);
    }

    public ResultadoClustering segmentar(int k, int muestra) {
        List<PerfilEstudianteDTO> perfiles = matriculaClient.perfiles(muestra);

        List<DoublePoint> puntos = new ArrayList<>();
        for (PerfilEstudianteDTO p : perfiles) {
            double edad = p.edad();
            double estrato = estratoANumero(p.estrato());
            double pbm = p.pbm() != null ? p.pbm().doubleValue() : 0.0;
            double esOficial = "Oficial".equalsIgnoreCase(p.tipoColegio()) ? 1.0 : 0.0;
            puntos.add(new DoublePoint(new double[]{edad, estrato, pbm, esOficial}));
        }

        if (puntos.isEmpty()) {
            return new ResultadoClustering(k, 0, List.of());
        }

        KMeansPlusPlusClusterer<DoublePoint> clusterer = new KMeansPlusPlusClusterer<>(k, 500);
        List<CentroidCluster<DoublePoint>> resultados = clusterer.cluster(puntos);

        List<Cluster> clusters = new ArrayList<>();
        for (int i = 0; i < resultados.size(); i++) {
            CentroidCluster<DoublePoint> c = resultados.get(i);
            double[] centro = c.getCenter().getPoint();
            clusters.add(new Cluster(i, c.getPoints().size(), centro[0], centro[1], centro[2], centro[3]));
        }
        return new ResultadoClustering(k, puntos.size(), clusters);
    }

    // ---------------------- SIMULACION MONTE CARLO ----------------------

    public record EscenarioPeriodo(int indicePeriodo, double p10, double p50, double p90) {}
    public record ResultadoSimulacion(double tasaCrecimientoMedia, double tasaCrecimientoDesv,
                                       long matriculaBase, int iteraciones, List<EscenarioPeriodo> escenarios) {}

    public ResultadoSimulacion simular(int periodosFuturos, int iteraciones) {
        List<MatriculaPeriodoSedeDTO> datos = matriculaClient.matriculaPorPeriodoSede();

        Map<String, Long> totalPorPeriodo = new TreeMap<>();
        Map<String, int[]> ordenPeriodo = new HashMap<>();
        for (MatriculaPeriodoSedeDTO d : datos) {
            String key = String.format("%04d-%d", d.anio(), d.semestre());
            totalPorPeriodo.merge(key, d.total(), Long::sum);
            ordenPeriodo.put(key, new int[]{d.anio(), d.semestre()});
        }
        List<String> keys = new ArrayList<>(totalPorPeriodo.keySet());
        Collections.sort(keys);

        DescriptiveStatistics tasas = new DescriptiveStatistics();
        for (int i = 1; i < keys.size(); i++) {
            long anterior = totalPorPeriodo.get(keys.get(i - 1));
            long actual = totalPorPeriodo.get(keys.get(i));
            if (anterior > 0) {
                tasas.addValue((actual - anterior) / (double) anterior);
            }
        }

        double media = tasas.getMean();
        double desv = Double.isNaN(tasas.getStandardDeviation()) ? 0.0 : tasas.getStandardDeviation();
        long base = keys.isEmpty() ? 0 : totalPorPeriodo.get(keys.get(keys.size() - 1));

        // Para cada periodo futuro, simular 'iteraciones' trayectorias con shock normal ~ N(media, desv)
        double[][] trayectorias = new double[iteraciones][periodosFuturos];
        for (int it = 0; it < iteraciones; it++) {
            double valor = base;
            for (int t = 0; t < periodosFuturos; t++) {
                double shock = media + desv * random.nextGaussian();
                valor = Math.max(0, valor * (1 + shock));
                trayectorias[it][t] = valor;
            }
        }

        List<EscenarioPeriodo> escenarios = new ArrayList<>();
        for (int t = 0; t < periodosFuturos; t++) {
            double[] valoresPeriodo = new double[iteraciones];
            for (int it = 0; it < iteraciones; it++) valoresPeriodo[it] = trayectorias[it][t];
            Arrays.sort(valoresPeriodo);
            double p10 = percentil(valoresPeriodo, 10);
            double p50 = percentil(valoresPeriodo, 50);
            double p90 = percentil(valoresPeriodo, 90);
            escenarios.add(new EscenarioPeriodo(t + 1, p10, p50, p90));
        }

        return new ResultadoSimulacion(media, desv, base, iteraciones, escenarios);
    }

    private double percentil(double[] ordenado, double p) {
        int idx = (int) Math.ceil(p / 100.0 * ordenado.length) - 1;
        idx = Math.max(0, Math.min(ordenado.length - 1, idx));
        return Math.round(ordenado[idx] * 100.0) / 100.0;
    }
}
