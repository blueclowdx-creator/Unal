package co.unal.proyecto.matricula.repository;

import co.unal.proyecto.matricula.model.MatriculaDetalle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatriculaDetalleRepository
        extends JpaRepository<MatriculaDetalle, Long>, JpaSpecificationExecutor<MatriculaDetalle> {


    @Query(value = "SELECT * FROM unal.vw_matricula_detalle m WHERE " +
            "(CAST(:anio AS integer) IS NULL OR m.anio = CAST(:anio AS integer)) AND " +
            "(CAST(:semestre AS integer) IS NULL OR m.semestre = CAST(:semestre AS integer)) AND " +
            "(CAST(:sede AS text) IS NULL OR public.unaccent(lower(m.nombre_sede::text)) = CAST(:sede AS text)) AND " +
            "(CAST(:facultad AS text) IS NULL OR public.unaccent(lower(m.nombre_facultad::text)) = CAST(:facultad AS text)) AND " +
            "(CAST(:sexo AS text) IS NULL OR lower(m.sexo::text) = CAST(:sexo AS text)) AND " +
            "(CAST(:estrato AS text) IS NULL OR lower(m.estrato::text) = CAST(:estrato AS text))",
           countQuery = "SELECT COUNT(*) FROM unal.vw_matricula_detalle m WHERE " +
            "(CAST(:anio AS integer) IS NULL OR m.anio = CAST(:anio AS integer)) AND " +
            "(CAST(:semestre AS integer) IS NULL OR m.semestre = CAST(:semestre AS integer)) AND " +
            "(CAST(:sede AS text) IS NULL OR public.unaccent(lower(m.nombre_sede::text)) = CAST(:sede AS text)) AND " +
            "(CAST(:facultad AS text) IS NULL OR public.unaccent(lower(m.nombre_facultad::text)) = CAST(:facultad AS text)) AND " +
            "(CAST(:sexo AS text) IS NULL OR lower(m.sexo::text) = CAST(:sexo AS text)) AND " +
            "(CAST(:estrato AS text) IS NULL OR lower(m.estrato::text) = CAST(:estrato AS text))",
           nativeQuery = true)
    Page<MatriculaDetalle> buscar(
            @Param("anio") Integer anio,
            @Param("semestre") Integer semestre,
            @Param("sede") String sede,
            @Param("facultad") String facultad,
            @Param("sexo") String sexo,
            @Param("estrato") String estrato,
            Pageable pageable);
}
