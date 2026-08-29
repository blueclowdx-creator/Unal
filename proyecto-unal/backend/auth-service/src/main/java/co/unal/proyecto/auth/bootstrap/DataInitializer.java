package co.unal.proyecto.auth.bootstrap;

import co.unal.proyecto.auth.domain.Usuario;
import co.unal.proyecto.auth.repo.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final UsuarioRepository repo;
    private final PasswordEncoder encoder;

    public DataInitializer(UsuarioRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        crearSiNoExiste("admin", "admin@unal.edu.co", "Administrador UNAL", "ADMIN", "unal2024");
        crearSiNoExiste("analista", "analista@unal.edu.co", "Analista de datos", "ANALISTA", "unal2024");
        crearSiNoExiste("invitado", "invitado@unal.edu.co", "Usuario invitado", "INVITADO", "unal2024");
    }

    private void crearSiNoExiste(String username, String email, String nombre, String rol, String pwd) {
        if (repo.existsByUsername(username)) return;
        Usuario u = new Usuario();
        u.setUsername(username);
        u.setEmail(email);
        u.setNombreCompleto(nombre);
        u.setRol(rol);
        u.setEnabled(true);
        u.setPasswordHash(encoder.encode(pwd));
        repo.save(u);
        log.info("[AUTH] Usuario seed creado: {} ({})", username, rol);
    }
}
