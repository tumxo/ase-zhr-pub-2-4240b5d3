package io.innoq.calvin.booking;

import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * HTTP Basic Authentication ohne Passwort (ADR-003): Der Benutzername identifiziert den
 * Mitarbeiter, das Passwort wird ignoriert. Bei Produktionsreife wird dies durch OAuth2/OIDC (Okta)
 * ersetzt.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http, @Qualifier("corsConfigurationSource") CorsConfigurationSource corsSource)
      throws Exception {
    http.csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsSource))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()
                    .requestMatchers("/api/hello")
                    .permitAll()
                    .requestMatchers("/api/**")
                    .authenticated()
                    .anyRequest()
                    .permitAll())
        .httpBasic(Customizer.withDefaults())
        .authenticationProvider(passwortloserProvider());
    return http.build();
  }

  /** Akzeptiert jeden Benutzernamen; das Passwort wird bewusst nicht geprüft (ADR-003). */
  @Bean
  public AuthenticationProvider passwortloserProvider() {
    return new AuthenticationProvider() {
      @Override
      public Authentication authenticate(Authentication authentication) {
        String benutzer = authentication.getName();
        if (benutzer == null || benutzer.isBlank()) {
          throw new BadCredentialsException("Benutzername fehlt");
        }
        return new UsernamePasswordAuthenticationToken(
            benutzer,
            authentication.getCredentials(),
            List.of(new SimpleGrantedAuthority("ROLE_USER")));
      }

      @Override
      public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
      }
    };
  }
}
