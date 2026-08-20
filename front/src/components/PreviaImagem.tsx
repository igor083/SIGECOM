// =============================================================
// components/PreviaImagem.tsx — Prévia do link de imagem
// =============================================================
// O produto guarda a URL de uma imagem hospedada fora (a decisão
// está comentada em Produto.imagemUrl: upload exigiria uma pasta
// de arquivos na máquina de quem desempacota o projeto).
//
// O problema disso é o silêncio: a URL era salva sem ninguém
// verificar se carrega, e o erro só aparecia depois, na grade do
// PDV, como um "sem foto" que não explica nada. Quem cadastrou já
// tinha saído da tela.
//
// Aqui o navegador tenta carregar na hora e o resultado aparece
// ao lado do campo, com o mesmo enquadramento do card do PDV.
// =============================================================

"use client";

import { useEffect, useState } from "react";
import styles from "./PreviaImagem.module.css";

/** Espera o usuário parar de digitar antes de tentar baixar a imagem. */
const ESPERA_MS = 600;

type Estado = "vazio" | "carregando" | "ok" | "erro";

export default function PreviaImagem({ url }: { url: string }) {
  const limpa = url.trim();

  /** Última URL que o debounce liberou para o navegador tentar baixar. */
  const [urlTestada, setUrlTestada] = useState("");
  /** Desfecho do download, carimbado com a URL a que pertence. */
  const [desfecho, setDesfecho] = useState<{ url: string; status: "ok" | "erro" } | null>(null);

  useEffect(() => {
    // Sem setState no corpo do efeito: o único que existe está dentro do
    // timeout. `estado` abaixo é derivado, não sincronizado — não há
    // necessidade de um efeito para mantê-lo em dia.
    if (!limpa) return;
    const id = setTimeout(() => setUrlTestada(limpa), ESPERA_MS);
    return () => clearTimeout(id);
  }, [limpa]);

  const estado: Estado = !limpa
    ? "vazio"
    // Enquanto o debounce não alcança o que foi digitado, ou o desfecho ainda
    // é de uma URL anterior, o que vale é "carregando".
    : urlTestada !== limpa
      ? "carregando"
      : desfecho?.url === limpa
        ? desfecho.status
        : "carregando";

  if (estado === "vazio") {
    return (
      <div className={styles.previa}>
        <span className={`${styles.aviso} ${styles.avisoNeutro}`}>
          Sem imagem. O produto aparece no PDV com um espaço reservado.
        </span>
      </div>
    );
  }

  return (
    <div className={styles.previa}>
      <div className={styles.moldura}>
        {urlTestada && (
          // key força o remount a cada URL nova: sem isso o <img> reaproveita
          // o estado do carregamento anterior e o onError não dispara de novo.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={urlTestada}
            className={styles.imagem}
            src={urlTestada}
            alt=""
            onLoad={() => setDesfecho({ url: urlTestada, status: "ok" })}
            onError={() => setDesfecho({ url: urlTestada, status: "erro" })}
          />
        )}
      </div>

      {estado === "carregando" && (
        <span className={`${styles.aviso} ${styles.avisoNeutro}`}>Carregando…</span>
      )}

      {estado === "ok" && (
        <span className={`${styles.aviso} ${styles.avisoOk}`}>
          Imagem carregada. É assim que ela vai aparecer no PDV.
        </span>
      )}

      {estado === "erro" && (
        <span className={`${styles.aviso} ${styles.avisoErro}`}>
          Não foi possível carregar. O link precisa apontar direto para o arquivo
          (terminando em .jpg, .png ou .webp), não para a página onde a imagem
          aparece. Alguns sites também bloqueiam o uso da imagem fora deles.
        </span>
      )}
    </div>
  );
}
