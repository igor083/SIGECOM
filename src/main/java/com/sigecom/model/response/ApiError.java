package com.sigecom.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String usuarioMensagem,
        String devMensagem,
        String path,
        LocalDateTime timestamp,
        List<String> erros
) {}
