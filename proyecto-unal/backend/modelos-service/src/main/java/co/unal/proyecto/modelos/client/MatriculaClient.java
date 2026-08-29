package co.unal.proyecto.modelos.client;

import co.unal.proyecto.modelos.dto.MatriculaStatsDtos.*;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Component
public class MatriculaClient {

    private static final String BASE_URL = "http://MATRICULA-SERVICE";

    private final WebClient webClient;

    public MatriculaClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClient = loadBalancedWebClientBuilder.baseUrl(BASE_URL).build();
    }

    public List<MatriculaPeriodoSedeDTO> matriculaPorPeriodoSede() {
        return webClient.get()
                .uri("/api/matriculas/stats/por-periodo-sede")
                .retrieve()
                .bodyToFlux(MatriculaPeriodoSedeDTO.class)
                .collectList()
                .block();
    }

    public List<PerfilAdmisionRegionalDTO> perfilAdmisionRegional() {
        return webClient.get()
                .uri("/api/matriculas/stats/perfil-regional")
                .retrieve()
                .bodyToFlux(PerfilAdmisionRegionalDTO.class)
                .collectList()
                .block();
    }

    public List<DemandaFacultadSedeDTO> demandaFacultadSede() {
        return webClient.get()
                .uri("/api/matriculas/stats/demanda-facultad-sede")
                .retrieve()
                .bodyToFlux(DemandaFacultadSedeDTO.class)
                .collectList()
                .block();
    }

    public List<PerfilEstudianteDTO> perfiles(int limite) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/matriculas/stats/perfiles")
                        .queryParam("limite", limite).build())
                .retrieve()
                .bodyToFlux(PerfilEstudianteDTO.class)
                .collectList()
                .block();
    }
}
