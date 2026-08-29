package co.unal.proyecto.matricula.repository;

import co.unal.proyecto.matricula.dto.StatsDtos.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class StatsRepository {

    private final JdbcTemplate jdbcTemplate;

    public StatsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MatriculaPeriodoSedeDTO> matriculaPorPeriodoSede() {
        String sql = "SELECT anio, semestre, nombre_sede, nombre_facultad, total_matriculados " +
                "FROM unal.vw_matricula_periodo_sede ORDER BY anio, semestre";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new MatriculaPeriodoSedeDTO(
                rs.getInt("anio"), rs.getInt("semestre"), rs.getString("nombre_sede"),
                rs.getString("nombre_facultad"), rs.getLong("total_matriculados")));
    }

    public List<PerfilAdmisionRegionalDTO> perfilAdmisionRegional() {
        String sql = "SELECT departamento, ciudad, estrato, tipo_colegio, peama, modalidad_admision, total " +
                "FROM unal.vw_perfil_admision_regional";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new PerfilAdmisionRegionalDTO(
                rs.getString("departamento"), rs.getString("ciudad"), rs.getString("estrato"),
                rs.getString("tipo_colegio"), rs.getString("peama"), rs.getString("modalidad_admision"),
                rs.getLong("total")));
    }

    public List<DemandaFacultadSedeDTO> demandaFacultadSede() {
        String sql = "SELECT nombre_sede, nombre_facultad, anio, semestre, nuevos, total " +
                "FROM unal.vw_demanda_facultad_sede";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new DemandaFacultadSedeDTO(
                rs.getString("nombre_sede"), rs.getString("nombre_facultad"), rs.getInt("anio"),
                rs.getInt("semestre"), rs.getLong("nuevos"), rs.getLong("total")));
    }

    public List<PerfilEstudianteDTO> perfilesEstudiantes(int limite) {
        String sql = "SELECT matricula_id, anio, semestre, edad, sexo, estrato, tipo_colegio, pbm, " +
                "matriculado_pvez, nombre_sede, nombre_facultad " +
                "FROM unal.vw_perfiles_estudiantes ORDER BY matricula_id LIMIT ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new PerfilEstudianteDTO(
                rs.getLong("matricula_id"), rs.getInt("anio"), rs.getInt("semestre"), rs.getInt("edad"),
                rs.getString("sexo"), rs.getString("estrato"), rs.getString("tipo_colegio"),
                rs.getBigDecimal("pbm"), rs.getBoolean("matriculado_pvez"), rs.getString("nombre_sede"),
                rs.getString("nombre_facultad")), limite);
    }

    public CatalogosDTO catalogos() {
        // Excluir el sentinel '__NULL__' del ETL
        String nullSentinel = "'__NULL__'";
        List<Integer> anios = jdbcTemplate.query(
                "SELECT DISTINCT anio FROM unal.vw_matricula_detalle WHERE anio IS NOT NULL ORDER BY anio",
                (rs, n) -> rs.getInt(1));
        List<Integer> semestres = jdbcTemplate.query(
                "SELECT DISTINCT semestre FROM unal.vw_matricula_detalle WHERE semestre IS NOT NULL ORDER BY semestre",
                (rs, n) -> rs.getInt(1));
        List<String> sedes = jdbcTemplate.query(
                "SELECT DISTINCT nombre_sede FROM unal.vw_matricula_detalle " +
                "WHERE nombre_sede IS NOT NULL AND nombre_sede <> " + nullSentinel + " ORDER BY nombre_sede",
                (rs, n) -> rs.getString(1));
        List<String> facultades = jdbcTemplate.query(
                "SELECT DISTINCT nombre_facultad FROM unal.vw_matricula_detalle " +
                "WHERE nombre_facultad IS NOT NULL AND nombre_facultad <> " + nullSentinel + " ORDER BY nombre_facultad",
                (rs, n) -> rs.getString(1));
        List<String> sexos = jdbcTemplate.query(
                "SELECT DISTINCT sexo FROM unal.vw_matricula_detalle " +
                "WHERE sexo IS NOT NULL AND sexo <> " + nullSentinel + " ORDER BY sexo",
                (rs, n) -> rs.getString(1));
        List<String> estratos = jdbcTemplate.query(
                "SELECT DISTINCT estrato FROM unal.vw_matricula_detalle " +
                "WHERE estrato IS NOT NULL AND estrato <> " + nullSentinel + " ORDER BY estrato",
                (rs, n) -> rs.getString(1));
        List<String> tiposColegio = jdbcTemplate.query(
                "SELECT DISTINCT tipo_colegio FROM unal.vw_matricula_detalle " +
                "WHERE tipo_colegio IS NOT NULL AND tipo_colegio <> " + nullSentinel + " ORDER BY tipo_colegio",
                (rs, n) -> rs.getString(1));
        List<String> programas = jdbcTemplate.query(
                "SELECT DISTINCT nombre_programa FROM unal.vw_matricula_detalle " +
                "WHERE nombre_programa IS NOT NULL AND nombre_programa <> " + nullSentinel + " ORDER BY nombre_programa",
                (rs, n) -> rs.getString(1));
        return new CatalogosDTO(anios, semestres, sedes, facultades, sexos, estratos, tiposColegio, programas);
    }
}
