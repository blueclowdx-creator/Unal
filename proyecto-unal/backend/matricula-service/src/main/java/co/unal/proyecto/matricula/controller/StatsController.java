package co.unal.proyecto.matricula.controller;

import co.unal.proyecto.matricula.dto.StatsDtos.*;
import co.unal.proyecto.matricula.repository.StatsRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matriculas/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    private final StatsRepository statsRepository;

    public StatsController(StatsRepository statsRepository) {
        this.statsRepository = statsRepository;
    }

    @GetMapping("/por-periodo-sede")
    public List<MatriculaPeriodoSedeDTO> porPeriodoSede() {
        return statsRepository.matriculaPorPeriodoSede();
    }

    @GetMapping("/perfil-regional")
    public List<PerfilAdmisionRegionalDTO> perfilRegional() {
        return statsRepository.perfilAdmisionRegional();
    }

    @GetMapping("/demanda-facultad-sede")
    public List<DemandaFacultadSedeDTO> demandaFacultadSede() {
        return statsRepository.demandaFacultadSede();
    }

    @GetMapping("/perfiles")
    public List<PerfilEstudianteDTO> perfiles(@RequestParam(defaultValue = "5000") int limite) {
        return statsRepository.perfilesEstudiantes(limite);
    }
}
