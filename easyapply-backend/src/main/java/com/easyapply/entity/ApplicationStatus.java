package com.easyapply.entity;

public enum ApplicationStatus {
    WYSLANE,
    W_PROCESIE,
    OFERTA,
    ODMOWA,

    // Stare statusy - do migracji
    @Deprecated ROZMOWA,
    @Deprecated ZADANIE,
    @Deprecated ODRZUCONE
}
