package com.sigecom.model.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetSenhaRequest(

        @NotBlank
        @Size(min = 6)
        String senhaNova
) {}
