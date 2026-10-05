// Legenda do asterisco usado nos rótulos (ISO 9241-17, 5.3.2).
// Fica sempre logo antes do primeiro campo do formulário.

import styles from "./campoFormulario.module.css";

export default function LegendaObrigatorios() {
  return <p className={styles.legenda}>* Campos obrigatórios</p>;
}
