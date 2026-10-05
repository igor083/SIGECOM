// Mensagem de erro logo abaixo do campo (ISO 9241-17, 7.3).
// O id casa com o aria-describedby que useValidacaoFormulario põe no campo.

import { idErro } from "@/hooks/useValidacaoFormulario";
import styles from "./campoFormulario.module.css";

export default function ErroCampo({ idCampo, mensagem }: { idCampo: string; mensagem: string | null }) {
  if (!mensagem) return null;
  return (
    <span id={idErro(idCampo)} className={styles.erro}>
      {mensagem}
    </span>
  );
}
