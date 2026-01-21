package com.easyapply.entity;

public enum CVType {
    FILE,   // Plik PDF przesłany do aplikacji
    LINK,   // Link do zewnętrznego serwisu (Google Drive, Dropbox)
    NOTE    // Tylko notatka/nazwa - plik przechowywany lokalnie przez użytkownika
}
