package com.easyapply.entity;

public enum RejectionReason {
    BRAK_ODPOWIEDZI("Brak odpowiedzi"),
    ODMOWA_MAILOWA("Odmowa mailowa"),
    ODRZUCENIE_PO_ROZMOWIE("Odrzucenie po rozmowie"),
    INNE("Inny powód");

    private final String displayName;

    RejectionReason(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
