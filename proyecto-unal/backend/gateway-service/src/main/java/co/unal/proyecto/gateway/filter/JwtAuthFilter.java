package co.unal.proyecto.gateway.filter;

import co.unal.proyecto.gateway.security.JwtVerifier;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<Object> {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
    private final JwtVerifier verifier;

    public JwtAuthFilter(JwtVerifier verifier) {
        this.verifier = verifier;
    }

    @Override
    public GatewayFilter apply(Object config) {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getURI().getPath();
            String auth = exchange.getRequest().getHeaders().getFirst("Authorization");
            if (auth == null || !auth.startsWith("Bearer ")) {
                return unauth(exchange, "Falta token de autenticacion");
            }
            try {
                Claims claims = verifier.verify(auth.substring(7));
                if (!"access".equals(claims.get("tipo"))) {
                    return unauth(exchange, "Tipo de token invalido");
                }
                ServerHttpRequest mutated = exchange.getRequest().mutate()
                        .header("X-User", claims.getSubject())
                        .header("X-Rol", String.valueOf(claims.get("rol")))
                        .build();
                return chain.filter(exchange.mutate().request(mutated).build());
            } catch (Exception e) {
                log.warn("[GW] Token invalido: {}", e.getMessage());
                return unauth(exchange, "Token invalido o expirado");
            }
        };
    }

    private Mono<Void> unauth(org.springframework.web.server.ServerWebExchange exchange, String msg) {
        ServerHttpResponse res = exchange.getResponse();
        res.setStatusCode(HttpStatus.UNAUTHORIZED);
        res.getHeaders().add("Content-Type", "application/json");
        String body = "{\"error\":\"UNAUTHORIZED\",\"message\":\"" + msg + "\"}";
        return res.writeWith(Mono.just(res.bufferFactory().wrap(body.getBytes())));
    }
}
