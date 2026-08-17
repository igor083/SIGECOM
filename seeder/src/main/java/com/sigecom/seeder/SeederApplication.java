package com.sigecom.seeder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * API de geracao de dados de teste do SIGECOM.
 *
 * Sobe separada da aplicacao original e escreve no mesmo banco. Nao roda
 * nada no boot de proposito: toda geracao acontece sob demanda, via HTTP.
 */
@SpringBootApplication
public class SeederApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeederApplication.class, args);
    }
}
