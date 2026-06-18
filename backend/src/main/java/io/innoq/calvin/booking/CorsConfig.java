package io.innoq.calvin.booking;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * CORS für die API. Als {@link CorsConfigurationSource}-Bean bereitgestellt, damit Spring Security
 * (siehe {@link SecurityConfig}) sie für seine CORS-Behandlung verwendet.
 *
 * <p>Hinter dem Crucible-Proxy laufen Frontend und Backend auf demselben Origin (nur
 * unterschiedliche Pfade), sodass dort gar kein CORS greift. Relevant ist die Konfiguration v. a.
 * lokal (localhost:5173 → localhost:8081).
 */
@Configuration
public class CorsConfig {

  @Value("${cors.allowed-origins:http://localhost:5173}")
  private String allowedOrigins;

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(
        Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList());
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setExposedHeaders(List.of("Location"));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
  }
}
