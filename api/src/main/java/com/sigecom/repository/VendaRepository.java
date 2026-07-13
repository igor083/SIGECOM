package com.sigecom.repository;

import com.sigecom.domain.Venda;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface VendaRepository extends JpaRepository<Venda, Long> {

    @Query("SELECT v FROM Venda v " +
           "WHERE (:dataInicio IS NULL OR v.dataHora >= :dataInicio) " +
           "  AND (:dataFim IS NULL OR v.dataHora <= :dataFim)")
    Page<Venda> findAllFiltrado(@Param("dataInicio") LocalDateTime dataInicio,
                                @Param("dataFim") LocalDateTime dataFim,
                                Pageable pageable);
}
