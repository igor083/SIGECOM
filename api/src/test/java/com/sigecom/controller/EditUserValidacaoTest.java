package com.sigecom.controller;

import com.sigecom.domain.enums.TipoUsuario;
import com.sigecom.model.request.auth.EditUserRequest;
import com.sigecom.model.response.auth.UsuarioResponse;
import com.sigecom.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// SCRUM-176 - as validacoes do EditUserRequest so aparecem passando pelo @Valid do
// controller, entao o teste bate na rota. O card pedia @NotNull/@NotBlank, mas isso
// mataria a edicao parcial do AuthService.editar, por isso os testes abaixo cobrem
// os dois lados: lixo entra e e barrado, campo ausente continua passando.
@SpringBootTest
@AutoConfigureMockMvc
class EditUserValidacaoTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    private static final String ROTA = "/auth/usuarios/1";

    @Test
    @WithMockUser(roles = "ADMIN")
    void editar_DeveDevolver400_QuandoNomeVierEmBranco() throws Exception {
        mockMvc.perform(put(ROTA)
                        .contentType("application/json")
                        .content("{\"nome\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.usuarioMensagem").value("Dados inválidos"))
                .andExpect(jsonPath("$.erros[0]").value("nome: O nome não pode ser vazio"));

        verify(authService, never()).editar(any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void editar_DeveDevolver400_QuandoNomePassarDe120Caracteres() throws Exception {
        String nomeLongo = "a".repeat(121);

        mockMvc.perform(put(ROTA)
                        .contentType("application/json")
                        .content("{\"nome\":\"" + nomeLongo + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros[0]").value("nome: O nome deve ter no máximo 120 caracteres"));

        verify(authService, never()).editar(any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void editar_DeveDevolver400_QuandoEmailForInvalido() throws Exception {
        mockMvc.perform(put(ROTA)
                        .contentType("application/json")
                        .content("{\"email\":\"nao-e-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros[0]").value("email: O e-mail deve ser válido"));

        verify(authService, never()).editar(any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void editar_DevePassar_QuandoTodosOsCamposViremNulos() throws Exception {
        when(authService.editar(eq(1L), any(EditUserRequest.class))).thenReturn(usuarioResponse());

        // corpo vazio e edicao parcial legitima, nao pode virar 400
        mockMvc.perform(put(ROTA)
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isOk());

        verify(authService).editar(eq(1L), any(EditUserRequest.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void editar_DevePassar_QuandoSoONomeVierPreenchido() throws Exception {
        when(authService.editar(eq(1L), any(EditUserRequest.class))).thenReturn(usuarioResponse());

        mockMvc.perform(put(ROTA)
                        .contentType("application/json")
                        .content("{\"nome\":\"Danilo\"}"))
                .andExpect(status().isOk());

        verify(authService).editar(eq(1L), any(EditUserRequest.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void editar_DevePassar_QuandoNomeTiverQuebraDeLinha() throws Exception {
        when(authService.editar(eq(1L), any(EditUserRequest.class))).thenReturn(usuarioResponse());

        // sem (?s) no @Pattern o ponto nao casa \n e esse nome levava 400 dizendo que estava vazio
        mockMvc.perform(put(ROTA)
                        .contentType("application/json")
                        .content("{\"nome\":\"Danilo\\nSilva\"}"))
                .andExpect(status().isOk());

        verify(authService).editar(eq(1L), any(EditUserRequest.class));
    }

    private UsuarioResponse usuarioResponse() {
        return UsuarioResponse.builder()
                .id(1L)
                .nome("Danilo")
                .email("danilo@sigecom.com")
                .perfil(TipoUsuario.ADMIN)
                .ativo(true)
                .criadoEm(LocalDateTime.now())
                .senhaTemporaria(false)
                .build();
    }
}
