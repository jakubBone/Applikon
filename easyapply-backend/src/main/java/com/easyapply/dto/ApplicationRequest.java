package com.easyapply.dto;

import com.easyapply.entity.ContractType;
import com.easyapply.entity.SalarySource;
import com.easyapply.entity.SalaryType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ApplicationRequest(
        @NotBlank(message = "Nazwa firmy nie może być pusta") String company,
        @NotBlank(message = "Nazwa stanowiska nie może być pusta") String position,
        String link,
        @Min(value = 0, message = "Stawka musi być dodatnia") Integer salaryMin,
        @Min(value = 0, message = "Stawka musi być dodatnia") Integer salaryMax,
        String currency,
        SalaryType salaryType,
        ContractType contractType,
        SalarySource salarySource,
        String source,
        String jobDescription,
        String agency) {}
