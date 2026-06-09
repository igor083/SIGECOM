package com.sigecom.model.response.auth;

import lombok.Builder;

@Builder
public record LoginResponse(
        String token,
        long expiresIn
) {}
