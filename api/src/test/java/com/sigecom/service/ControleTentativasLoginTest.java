package com.sigecom.service;

import com.sigecom.exception.TentativasExcedidasException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

/**
 * O relógio é injetado para os testes andarem no tempo sem dormir: verificar
 * uma janela de 60 segundos com Thread.sleep custaria minutos de suíte e ainda
 * ficaria instável em máquina carregada.
 */
class ControleTentativasLoginTest {

    /** Relógio de mentira que só anda quando o teste manda. */
    private static class RelogioControlado extends Clock {
        private Instant momento = Instant.parse("2026-08-20T10:00:00Z");

        void avancar(Duration d) { momento = momento.plus(d); }
        @Override public Instant instant() { return momento; }
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
    }

    private RelogioControlado relogio;
    private ControleTentativasLogin controle;
    private String chave;

    @BeforeEach
    void setUp() {
        relogio = new RelogioControlado();
        controle = new ControleTentativasLogin(relogio);
        chave = controle.chave("usuario@teste.com", "10.0.0.1");
    }

    private void falhar(int vezes) {
        for (int i = 0; i < vezes; i++) {
            controle.registrarFalha(chave);
        }
    }

    @Nested
    @DisplayName("bloqueio")
    class Bloqueio {

        @Test
        void naoBloqueia_AteAQuintaFalha() {
            for (int i = 0; i < ControleTentativasLogin.MAX_FALHAS; i++) {
                assertDoesNotThrow(() -> controle.verificar(chave),
                        "as 5 primeiras tentativas têm que passar e falhar como 401");
                controle.registrarFalha(chave);
            }
        }

        @Test
        void bloqueia_NaSextaTentativaDentroDaJanela() {
            falhar(5);
            assertThrows(TentativasExcedidasException.class, () -> controle.verificar(chave));
        }

        @Test
        void informaQuantoFaltaParaLiberar() {
            falhar(5);
            relogio.avancar(Duration.ofSeconds(20));

            TentativasExcedidasException e =
                    assertThrows(TentativasExcedidasException.class, () -> controle.verificar(chave));

            // 60 da janela menos os 20 já corridos desde a falha mais antiga.
            assertEquals(40, e.getSegundosParaLiberar());
        }

        @Test
        void nuncaAnunciaZeroSegundos() {
            falhar(5);
            relogio.avancar(Duration.ofSeconds(59));

            TentativasExcedidasException e =
                    assertThrows(TentativasExcedidasException.class, () -> controle.verificar(chave));

            // Retry-After: 0 diria "pode agora", e o cliente voltaria para outro 429.
            assertTrue(e.getSegundosParaLiberar() >= 1);
        }
    }

    @Nested
    @DisplayName("janela deslizante")
    class Janela {

        @Test
        void liberaDepoisQueAJanelaPassa() {
            falhar(5);
            assertThrows(TentativasExcedidasException.class, () -> controle.verificar(chave));

            relogio.avancar(Duration.ofSeconds(61));

            assertDoesNotThrow(() -> controle.verificar(chave));
        }

        @Test
        void naoSomaFalhasQueJaSairamDaJanela() {
            falhar(4);
            relogio.avancar(Duration.ofSeconds(61));
            falhar(4);

            // 8 falhas no total, mas só 4 dentro dos últimos 60 segundos.
            assertDoesNotThrow(() -> controle.verificar(chave));
        }
    }

    @Nested
    @DisplayName("isolamento entre contas e origens")
    class Isolamento {

        @Test
        void bloqueioNaoVazaParaOutroUsuarioNoMesmoIp() {
            falhar(5);

            String outro = controle.chave("outro@teste.com", "10.0.0.1");
            assertDoesNotThrow(() -> controle.verificar(outro),
                    "um funcionário errando a senha não pode travar a loja inteira");
        }

        @Test
        void bloqueioNaoVazaParaOMesmoUsuarioEmOutroIp() {
            falhar(5);

            String deCasa = controle.chave("usuario@teste.com", "200.1.2.3");
            assertDoesNotThrow(() -> controle.verificar(deCasa),
                    "ninguém pode trancar a conta de outro só errando a senha de fora");
        }

        @Test
        void trataEmailComoMesmaChaveIndependenteDeCaixaEEspacos() {
            falhar(5);

            String variacao = controle.chave("  USUARIO@Teste.com ", "10.0.0.1");
            assertThrows(TentativasExcedidasException.class, () -> controle.verificar(variacao),
                    "trocar a caixa do e-mail não pode zerar o contador");
        }
    }

    @Nested
    @DisplayName("acerto de senha")
    class Sucesso {

        @Test
        void zeraOContador() {
            falhar(4);
            controle.registrarSucesso(chave);
            falhar(4);

            assertDoesNotThrow(() -> controle.verificar(chave),
                    "quem sabe a senha não pode ser bloqueado por uso legítimo");
        }
    }
}
