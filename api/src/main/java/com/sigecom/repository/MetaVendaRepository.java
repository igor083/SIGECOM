package com.sigecom.repository;

import com.sigecom.domain.MetaVenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MetaVendaRepository extends JpaRepository<MetaVenda, Long> {
}
