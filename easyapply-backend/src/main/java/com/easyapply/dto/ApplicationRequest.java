package com.easyapply.dto;

import com.easyapply.entity.ContractType;
import com.easyapply.entity.SalarySource;
import com.easyapply.entity.SalaryType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ApplicationRequest(
        @NotBlank(message = "{validation.company.required}") String company,
        @NotBlank(message = "{validation.position.required}") String position,
        String link,
        @Min(value = 0, message = "{validation.salary.positive}") Integer salaryMin,
        @Min(value = 0, message = "{validation.salary.positive}") Integer salaryMax,
        String currency,
        SalaryType salaryType,
        ContractType contractType,
        SalarySource salarySource,
        String source,
        String jobDescription,
        String agency) {}
