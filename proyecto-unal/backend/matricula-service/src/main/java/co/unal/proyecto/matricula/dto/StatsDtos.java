package co.unal.proyecto.matricula.dto;

import java.math.BigDecimal;

public class StatsDtos {

    public record MatriculaPeriodoSedeDTO(int anio, int semestre, String sede, String facultad, long total) {}

    public record PerfilAdmisionRegionalDTO(String departamento, String ciudad, String estrato,
                                             String tipoColegio, String peama, String modalidadAdmision, long total) {}

   public record DemandaFacultadSedeDTO(String sede, String facultad, int anio, int semestre,
                                          long nuevos, long total) {}

   public record PerfilEstudianteDTO(long matriculaId, int anio, int semestre, int edad, String sexo,
                                       String estrato, String tipoColegio, BigDecimal pbm,
                                       boolean matriculadoPvez, String sede, String facultad) {}

    public record CatalogosDTO(java.util.List<Integer> anios, java.util.List<Integer> semestres,
                                java.util.List<String> sedes, java.util.List<String> facultades,
                                java.util.List<String> sexos, java.util.List<String> estratos,
                                java.util.List<String> tiposColegio, java.util.List<String> programas) {}
}
