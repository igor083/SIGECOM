package com.sigecom.service;

import com.sigecom.exception.TentativasExcedidasException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Freio de força bruta no login: 5 tentativas falhas em 60 segundos bloqueiam
 * a próxima, que volta 429.
 *
 * Só conta FALHA. Acerto zera o contador, então quem sabe a senha nunca é
 * bloqueado, por mais que use o sistema.
 *
 * A chave é o par (e-mail, IP), e a escolha tem consequência:
 *  - só e-mail deixaria qualquer um trancar a conta de outro de fora, é só
 *    errar a senha cinco vezes de propósito;
 *  - só IP trancaria a loja inteira quando um funcionário erra a senha, já que
 *    todos saem pelo mesmo IP;
 *  - o par bloqueia exatamente a combinação sob ataque.
 * O preço é que um atacante distribuído por vários IPs não é contido por este
 * mecanismo — para isso seria preciso um limite por conta, com o risco de
 * bloqueio de terceiros que ele traz.
 *
 * Em memória e por instância, de propósito: a aplicação roda em um processo só.
 * Com mais de uma instância, cada uma teria a sua contagem e o limite efetivo
 * seria 5 x instâncias — aí o estado precisaria sair daqui (Redis, por exemplo).
 */
@Slf4j
@Component
public class ControleTentativasLogin {

    static final int MAX_FALHAS = 5;
    static final Duration JANELA = Duration.ofSeconds(60);

    /**
     * Teto de chaves distintas guardadas. Sem isto, alguém que varia o e-mail a
     * cada tentativa faz o mapa crescer sem limite - a defesa contra força
     * bruta viraria um vetor de exaustão de memória.
     */
    static final int MAX_CHAVES = 10_000;

    private final Map<String, Deque<Instant>> falhasPorChave = new ConcurrentHashMap<>();
    private final Clock clock;

    public ControleTentativasLogin() {
        this(Clock.systemUTC());
    }

    /** Construtor de teste: permite adiantar o relógio sem esperar 60s de verdade. */
    ControleTentativasLogin(Clock clock) {
        this.clock = clock;
    }

    public String chave(String email, String ip) {
        String normalizado = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        return normalizado + "|" + ip;
    }

    /**
     * Barra a tentativa quando a janela já está cheia. Chamado ANTES de validar
     * a senha: verificar o hash custa caro de propósito (BCrypt), e é justamente
     * esse custo que um ataque em volume tenta explorar.
     */
    public void verificar(String chave) {
        Deque<Instant> janela = falhasPorChave.get(chave);
        if (janela == null) {
            return;
        }

        long recentes;
        Instant maisAntiga;
        synchronized (janela) {
            descartarExpiradas(janela);
            recentes = janela.size();
            maisAntiga = janela.peekFirst();
        }

        if (recentes >= MAX_FALHAS && maisAntiga != null) {
            long liberaEm = JANELA.getSeconds() - Duration.between(maisAntiga, agora()).getSeconds();
            long segundos = Math.max(1, liberaEm);
            log.warn("Login bloqueado por excesso de tentativas: {} (libera em {}s)", chave, segundos);
            throw new TentativasExcedidasException(segundos);
        }
    }

    public void registrarFalha(String chave) {
        if (falhasPorChave.size() >= MAX_CHAVES) {
            limparChavesVazias();
        }

        Deque<Instant> janela = falhasPorChave.computeIfAbsent(chave, k -> new ArrayDeque<>());
        synchronized (janela) {
            descartarExpiradas(janela);
            janela.addLast(agora());
        }
    }

    /** Login correto limpa o histórico: o contador existe para conter ataque, não uso. */
    public void registrarSucesso(String chave) {
        falhasPorChave.remove(chave);
    }

    private void descartarExpiradas(Deque<Instant> janela) {
        Instant limite = agora().minus(JANELA);
        while (!janela.isEmpty() && janela.peekFirst().isBefore(limite)) {
            janela.removeFirst();
        }
    }

    /**
     * Varre o mapa removendo as chaves cuja janela já venceu. Roda só quando o
     * teto é atingido - percorrer o mapa a cada tentativa seria caro à toa.
     */
    private void limparChavesVazias() {
        Iterator<Map.Entry<String, Deque<Instant>>> it = falhasPorChave.entrySet().iterator();
        while (it.hasNext()) {
            Deque<Instant> janela = it.next().getValue();
            boolean vazia;
            synchronized (janela) {
                descartarExpiradas(janela);
                vazia = janela.isEmpty();
            }
            if (vazia) {
                it.remove();
            }
        }
    }

    private Instant agora() {
        return clock.instant();
    }
}
