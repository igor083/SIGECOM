package com.sigecom.seeder.repository;

import com.sigecom.seeder.domain.Venda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface VendaRepository extends JpaRepository<Venda, Long> {

    // Idempotencia das vendas geradas: a tabela nao tem coluna de origem,
    // entao o seeder usa o instante exato como chave. Toda venda gerada cai
    // num horario deterministico (dia + slot fixo) e pertence a um usuario de
    // seed, o que torna a regeracao do mesmo dia um no-op.
    boolean existsByDataHoraAndUsuarioId(LocalDateTime dataHora, Long usuarioId);

    // Marcador mestre da limpeza: tudo que o seeder gera pertence a um
    // usuario de seed. Venda registrada de verdade pelo PDV nunca entra aqui.
    List<Venda> findByUsuarioIdIn(List<Long> usuarioIds);

    boolean existsByUsuarioId(Long usuarioId);

    // Mesma agregacao do FechamentoCaixaService da aplicacao original: o
    // fechamento gerado precisa bater com o que a tela calcularia no dia.
    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venda v " +
           "WHERE v.dataHora >= :inicio AND v.dataHora <= :fim")
    BigDecimal somarTotalPorPeriodo(@Param("inicio") LocalDateTime inicio,
                                    @Param("fim") LocalDateTime fim);
}
