package co.unal.proyecto.matricula.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;


@Entity
@Immutable
@Table(name = "vw_matricula_detalle", schema = "unal")
public class MatriculaDetalle {

    @Id
    private Long matriculaId;

    private Integer anio;
    private Integer semestre;
    private String nombreSede;
    private String nombreFacultad;
    private String nombrePrograma;
    private String tipoNivel;
    private String nivel;
    private Integer edad;
    private String sexo;
    private String estrato;
    private String tipoColegio;
    private BigDecimal pbm;
    private Boolean matriculadoPvez;
    private String departamentoProcedencia;
    private String ciudadProcedencia;
    private String modalidadAdmision;
    private String tipoAdmision;
    private String peama;
    private String convenio;

    // Getters y setters

    public Long getMatriculaId() { return matriculaId; }
    public void setMatriculaId(Long matriculaId) { this.matriculaId = matriculaId; }

    public Integer getAnio() { return anio; }
    public void setAnio(Integer anio) { this.anio = anio; }

    public Integer getSemestre() { return semestre; }
    public void setSemestre(Integer semestre) { this.semestre = semestre; }

    public String getNombreSede() { return nombreSede; }
    public void setNombreSede(String nombreSede) { this.nombreSede = nombreSede; }

    public String getNombreFacultad() { return nombreFacultad; }
    public void setNombreFacultad(String nombreFacultad) { this.nombreFacultad = nombreFacultad; }

    public String getNombrePrograma() { return nombrePrograma; }
    public void setNombrePrograma(String nombrePrograma) { this.nombrePrograma = nombrePrograma; }

    public String getTipoNivel() { return tipoNivel; }
    public void setTipoNivel(String tipoNivel) { this.tipoNivel = tipoNivel; }

    public String getNivel() { return nivel; }
    public void setNivel(String nivel) { this.nivel = nivel; }

    public Integer getEdad() { return edad; }
    public void setEdad(Integer edad) { this.edad = edad; }

    public String getSexo() { return sexo; }
    public void setSexo(String sexo) { this.sexo = sexo; }

    public String getEstrato() { return estrato; }
    public void setEstrato(String estrato) { this.estrato = estrato; }

    public String getTipoColegio() { return tipoColegio; }
    public void setTipoColegio(String tipoColegio) { this.tipoColegio = tipoColegio; }

    public BigDecimal getPbm() { return pbm; }
    public void setPbm(BigDecimal pbm) { this.pbm = pbm; }

    public Boolean getMatriculadoPvez() { return matriculadoPvez; }
    public void setMatriculadoPvez(Boolean matriculadoPvez) { this.matriculadoPvez = matriculadoPvez; }

    public String getDepartamentoProcedencia() { return departamentoProcedencia; }
    public void setDepartamentoProcedencia(String departamentoProcedencia) { this.departamentoProcedencia = departamentoProcedencia; }

    public String getCiudadProcedencia() { return ciudadProcedencia; }
    public void setCiudadProcedencia(String ciudadProcedencia) { this.ciudadProcedencia = ciudadProcedencia; }

    public String getModalidadAdmision() { return modalidadAdmision; }
    public void setModalidadAdmision(String modalidadAdmision) { this.modalidadAdmision = modalidadAdmision; }

    public String getTipoAdmision() { return tipoAdmision; }
    public void setTipoAdmision(String tipoAdmision) { this.tipoAdmision = tipoAdmision; }

    public String getPeama() { return peama; }
    public void setPeama(String peama) { this.peama = peama; }

    public String getConvenio() { return convenio; }
    public void setConvenio(String convenio) { this.convenio = convenio; }
}
