package co.unal.proyecto.matricula.controller;

import co.unal.proyecto.matricula.dto.StatsDtos.CatalogosDTO;
import co.unal.proyecto.matricula.model.MatriculaDetalle;
import co.unal.proyecto.matricula.repository.MatriculaDetalleRepository;
import co.unal.proyecto.matricula.repository.StatsRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;

@RestController
@RequestMapping("/api/matriculas")
@CrossOrigin(origins = "*")
public class MatriculaController {

    private final MatriculaDetalleRepository repository;
    private final StatsRepository statsRepository;

    public MatriculaController(MatriculaDetalleRepository repository, StatsRepository statsRepository) {
        this.repository = repository;
        this.statsRepository = statsRepository;
    }

    @GetMapping
    public Page<MatriculaDetalle> listar(
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) Integer semestre,
            @RequestParam(required = false) String sede,
            @RequestParam(required = false) String facultad,
            @RequestParam(required = false) String sexo,
            @RequestParam(required = false) String estrato,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return repository.buscar(
                anio,
                semestre,
                normalizar(sede),
                normalizar(facultad),
                normalizar(sexo),
                normalizar(estrato),
                PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public MatriculaDetalle obtener(@PathVariable Long id) {
        return repository.findById(id).orElseThrow();
    }

    @GetMapping("/catalogos")
    public CatalogosDTO catalogos() {
        return statsRepository.catalogos();
    }

    private static String normalizar(String s) {
        if (s == null || s.isBlank()) return null;
        String sinTildes = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return sinTildes.trim().toLowerCase();
    }
}
