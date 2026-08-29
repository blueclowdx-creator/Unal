package co.unal.proyecto.matricula.repository;

import co.unal.proyecto.matricula.model.MatriculaDetalle;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.text.Normalizer;

public class MatriculaSpecifications {

    public static Specification<MatriculaDetalle> filtrar(Integer anio, Integer semestre, String sede,
                                                            String facultad, String sexo, String estrato) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();
            if (anio != null) {
                predicate = cb.and(predicate, cb.equal(root.get("anio"), anio));
            }
            if (semestre != null) {
                predicate = cb.and(predicate, cb.equal(root.get("semestre"), semestre));
            }
            if (sede != null && !sede.isBlank()) {
                predicate = cb.and(predicate, cb.equal(unaccentLower(cb, root.get("nombreSede")),
                        normalizar(sede)));
            }
            if (facultad != null && !facultad.isBlank()) {
                predicate = cb.and(predicate, cb.equal(unaccentLower(cb, root.get("nombreFacultad")),
                        normalizar(facultad)));
            }
            if (sexo != null && !sexo.isBlank()) {
                predicate = cb.and(predicate, cb.equal(cb.lower(root.get("sexo")), normalizar(sexo)));
            }
            if (estrato != null && !estrato.isBlank()) {
                predicate = cb.and(predicate, cb.equal(cb.lower(root.get("estrato")), normalizar(estrato)));
            }
            return predicate;
        };
    }

    private static Expression<String> unaccentLower(
            jakarta.persistence.criteria.CriteriaBuilder cb,
            jakarta.persistence.criteria.Expression<String> exp) {
        return cb.function("unaccent", String.class, cb.lower(exp)).as(String.class);
    }

    private static String normalizar(String s) {
        if (s == null) return null;
        String sinTildes = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return sinTildes.trim().toLowerCase();
    }
}
