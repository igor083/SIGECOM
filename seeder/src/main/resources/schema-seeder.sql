-- Livro-caixa do seeder: registra exatamente quais linhas ELE criou.
--
-- Sem isto, a limpeza teria que adivinhar a origem de um registro pelo nome,
-- e apagaria cadastro pre-existente que o seeder apenas reaproveitou.
--
-- E a unica tabela que o seeder cria, e ela nao pertence ao dominio da
-- aplicacao original: nenhuma entidade de la a referencia, e apagar a tabela
-- inteira nao afeta o sistema (so faz o seeder esquecer o que gerou).
CREATE TABLE IF NOT EXISTS seed_registro (
    id          BIGSERIAL    PRIMARY KEY,
    recurso     VARCHAR(40)  NOT NULL,
    registro_id BIGINT       NOT NULL,
    criado_em   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_seed_registro_recurso_id UNIQUE (recurso, registro_id)
);
