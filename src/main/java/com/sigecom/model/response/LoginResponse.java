package com.sigecom.model.response;

import lombok.Builder;

@Builder
public record LoginResponse(
        String token,
        long expiresIn
) {}
