package com.sigecom.model.request.auth;

import com.sigecom.domain.enums.TipoUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

// SCRUM-176: edicao parcial. Campo que nao vem (null) o AuthService.editar nao mexe,
// por isso aqui nao entra @NotNull nem @NotBlank: so valida o que veio preenchido.
@Builder
public record EditUserRequest(

        // @Pattern ignora null, entao ele barra "   " sem barrar o campo ausente
        // (?s) faz o ponto casar quebra de linha, senao nome com \n seria barrado como se fosse vazio
        @Pattern(regexp = "(?s).*\\S.*", message = "O nome não pode ser vazio")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres")
        String nome,

        @Email(message = "O e-mail deve ser válido")
        @Size(max = 255, message = "O e-mail deve ter no máximo 255 caracteres")
        String email,

        // perfil e ativo em null significam "não alterar", quem trata é o AuthService.editar
        TipoUsuario perfil,

        Boolean ativo
) {}
