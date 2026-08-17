package com.sigecom.seeder.model;

/** Fotografia do que existe no banco hoje, separando dado de seed de dado real. */
public record SeedStatus(
        String banco,
        long usuariosSeed,
        long usuariosTotal,
        long categoriasProdutoTotal,
        long categoriasFinanceirasTotal,
        long produtosTotal,
        long vendasSeed,
        long vendasTotal,
        long lancamentosSeed,
        long lancamentosTotal,
        long fechamentosSeed,
        long fechamentosTotal
) {}
