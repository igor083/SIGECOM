package com.sigecom.seeder.repository;

import com.sigecom.seeder.domain.ItemVenda;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemVendaRepository extends JpaRepository<ItemVenda, Long> {

    // Guarda da limpeza: produto do catalogo so pode ser apagado se nenhuma
    // venda (inclusive venda real, feita pelo PDV) apontar para ele.
    boolean existsByProdutoId(Long produtoId);
}
