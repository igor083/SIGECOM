package com.sigecom.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Meta diária de vendas — única para todos os funcionários (linha singleton, id fixo).
 */
@Entity
@Table(name = "meta_venda")
@Getter
@Setter
@NoArgsConstructor
public class MetaVenda {

    @Id
    private Long id;

    @Column(nullable = false)
    private BigDecimal valor;
}
