package co.unal.proyecto.modelos.service;

import co.unal.proyecto.modelos.client.MatriculaClient;
import co.unal.proyecto.modelos.dto.MatriculaStatsDtos.PerfilAdmisionRegionalDTO;
import org.springframework.stereotype.Service;

import java.util.*;


@Service
public class ClasificacionService {

    private final MatriculaClient matriculaClient;

    public ClasificacionService(MatriculaClient matriculaClient) {
        this.matriculaClient = matriculaClient;
    }

    public record Coeficientes(double b0, double bEstrato, double bColegioOficial, int iteraciones, double tasaAprendizaje) {}
    public record ResultadoClasificacion(Coeficientes coeficientes, double probabilidadEstimada,
                                          String estrato, String tipoColegio, int muestrasEntrenamiento) {}

    private static int estratoANumero(String estrato) {
        if (estrato == null) return 0;
        String digits = estrato.replaceAll("\\D+", "");
        return digits.isEmpty() ? 0 : Integer.parseInt(digits);
    }

    private static double sigmoid(double z) {
        return 1.0 / (1.0 + Math.exp(-z));
    }

    public ResultadoClasificacion entrenarYPredecir(String estrato, String tipoColegio) {
        List<PerfilAdmisionRegionalDTO> datos = matriculaClient.perfilAdmisionRegional();

        Map<String, double[]> agregados = new LinkedHashMap<>(); // key -> [estratoNum, esOficial, totalSi, totalNo]
        for (PerfilAdmisionRegionalDTO d : datos) {
            String key = d.estrato() + "|" + d.tipoColegio();
            boolean esPeama = d.peama() != null && !d.peama().equalsIgnoreCase("No aplica");
            double[] acc = agregados.computeIfAbsent(key, k -> new double[]{
                    estratoANumero(d.estrato()),
                    "Oficial".equalsIgnoreCase(d.tipoColegio()) ? 1.0 : 0.0,
                    0.0, 0.0});
            if (esPeama) acc[2] += d.total(); else acc[3] += d.total();
        }

       double b0 = 0, b1 = 0, b2 = 0;
        double lr = 0.01;
        int iteraciones = 2000;
        int muestras = agregados.size();

        double totalObservaciones = agregados.values().stream().mapToDouble(a -> a[2] + a[3]).sum();
        if (totalObservaciones == 0) totalObservaciones = 1;

        for (int it = 0; it < iteraciones; it++) {
            double g0 = 0, g1 = 0, g2 = 0;
            for (double[] acc : agregados.values()) {
                double x1 = acc[0], x2 = acc[1];
                double nSi = acc[2], nNo = acc[3];
                double n = nSi + nNo;
                if (n == 0) continue;
                double z = b0 + b1 * x1 + b2 * x2;
                double p = sigmoid(z);
                double yBarra = nSi / n;              // proporcion empirica observada en el grupo
                double error = (p - yBarra) * n;       // gradiente ponderado por tamano del grupo
                g0 += error;
                g1 += error * x1;
                g2 += error * x2;
            }
            b0 -= lr * g0 / totalObservaciones;
            b1 -= lr * g1 / totalObservaciones;
            b2 -= lr * g2 / totalObservaciones;
        }

        double estratoNum = estratoANumero(estrato);
        double esOficial = "Oficial".equalsIgnoreCase(tipoColegio) ? 1.0 : 0.0;
        double probabilidad = sigmoid(b0 + b1 * estratoNum + b2 * esOficial);

        return new ResultadoClasificacion(
                new Coeficientes(b0, b1, b2, iteraciones, lr),
                probabilidad, estrato, tipoColegio, muestras);
    }
}
