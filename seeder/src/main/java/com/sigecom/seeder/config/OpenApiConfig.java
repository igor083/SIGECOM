package com.sigecom.seeder.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI seederOpenApi() {
        return new OpenAPI().info(new Info()
                .title("SIGECOM Seeder")
                .version("v1")
                .description("""
                        API de geracao de dados de teste do SIGECOM.

                        Ferramenta de desenvolvimento: escreve direto no banco da aplicacao
                        original, sem autenticacao, escutando so em loopback.

                        Toda geracao e idempotente - rodar duas vezes seguidas nao duplica
                        nada (a segunda execucao volta criados=0). A limpeza remove apenas
                        o que foi gerado aqui, identificado pelos usuarios de teste
                        (@seed.sigecom.local); dado real da aplicacao nunca e tocado.
                        """));
    }
}
