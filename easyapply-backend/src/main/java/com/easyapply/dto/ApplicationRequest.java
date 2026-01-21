package com.easyapply.dto;

import com.easyapply.entity.ContractType;
import com.easyapply.entity.SalarySource;
import com.easyapply.entity.SalaryType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class ApplicationRequest {

    @NotBlank(message = "Nazwa firmy nie może być pusta")
    private String company;

    @NotBlank(message = "Nazwa stanowiska nie może być pusta")
    private String position;

    private String link;

    @Min(value = 0, message = "Stawka musi być dodatnia")
    private Integer salaryMin;

    @Min(value = 0, message = "Stawka musi być dodatnia")
    private Integer salaryMax;

    private String currency;

    private SalaryType salaryType;

    private ContractType contractType;

    private SalarySource salarySource;

    private String source;

    private String jobDescription;

    private String agency;

    // Getters and Setters
    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public Integer getSalaryMin() {
        return salaryMin;
    }

    public void setSalaryMin(Integer salaryMin) {
        this.salaryMin = salaryMin;
    }

    public Integer getSalaryMax() {
        return salaryMax;
    }

    public void setSalaryMax(Integer salaryMax) {
        this.salaryMax = salaryMax;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public SalaryType getSalaryType() {
        return salaryType;
    }

    public void setSalaryType(SalaryType salaryType) {
        this.salaryType = salaryType;
    }

    public ContractType getContractType() {
        return contractType;
    }

    public void setContractType(ContractType contractType) {
        this.contractType = contractType;
    }

    public SalarySource getSalarySource() {
        return salarySource;
    }

    public void setSalarySource(SalarySource salarySource) {
        this.salarySource = salarySource;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public String getAgency() {
        return agency;
    }

    public void setAgency(String agency) {
        this.agency = agency;
    }
}
