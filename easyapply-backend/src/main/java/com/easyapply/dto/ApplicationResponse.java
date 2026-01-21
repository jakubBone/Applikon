package com.easyapply.dto;

import com.easyapply.entity.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

public class ApplicationResponse {

    private Long id;
    private String company;
    private String position;
    private String link;
    private Integer salaryMin;
    private Integer salaryMax;
    private String currency;
    private SalaryType salaryType;
    private ContractType contractType;
    private SalarySource salarySource;
    private String source;
    private ApplicationStatus status;
    private String jobDescription;
    private String agency;
    private LocalDateTime appliedAt;
    private Long cvId;
    private String cvFileName;
    private CVType cvType;
    private String cvExternalUrl;

    // Nowe pola dla elastycznych etapów
    private String currentStage;
    private RejectionReason rejectionReason;
    private String rejectionDetails;
    private List<StageHistoryResponse> stageHistory = new ArrayList<>();

    public ApplicationResponse() {}

    public static ApplicationResponse fromEntity(Application application) {
        ApplicationResponse response = new ApplicationResponse();
        response.setId(application.getId());
        response.setCompany(application.getCompany());
        response.setPosition(application.getPosition());
        response.setLink(application.getLink());
        response.setSalaryMin(application.getSalaryMin());
        response.setSalaryMax(application.getSalaryMax());
        response.setCurrency(application.getCurrency());
        response.setSalaryType(application.getSalaryType());
        response.setContractType(application.getContractType());
        response.setSalarySource(application.getSalarySource());
        response.setSource(application.getSource());
        response.setStatus(application.getStatus());
        response.setJobDescription(application.getJobDescription());
        response.setAgency(application.getAgency());
        response.setAppliedAt(application.getAppliedAt());
        if (application.getCv() != null) {
            response.setCvId(application.getCv().getId());
            response.setCvFileName(application.getCv().getOriginalFileName());
            response.setCvType(application.getCv().getType());
            response.setCvExternalUrl(application.getCv().getExternalUrl());
        }
        // Nowe pola
        response.setCurrentStage(application.getCurrentStage());
        response.setRejectionReason(application.getRejectionReason());
        response.setRejectionDetails(application.getRejectionDetails());
        if (application.getStageHistory() != null) {
            response.setStageHistory(
                application.getStageHistory().stream()
                    .map(StageHistoryResponse::fromEntity)
                    .toList()
            );
        }
        return response;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
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

    public LocalDateTime getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(LocalDateTime appliedAt) {
        this.appliedAt = appliedAt;
    }

    public Long getCvId() {
        return cvId;
    }

    public void setCvId(Long cvId) {
        this.cvId = cvId;
    }

    public String getCvFileName() {
        return cvFileName;
    }

    public void setCvFileName(String cvFileName) {
        this.cvFileName = cvFileName;
    }

    public CVType getCvType() {
        return cvType;
    }

    public void setCvType(CVType cvType) {
        this.cvType = cvType;
    }

    public String getCvExternalUrl() {
        return cvExternalUrl;
    }

    public void setCvExternalUrl(String cvExternalUrl) {
        this.cvExternalUrl = cvExternalUrl;
    }

    public String getCurrentStage() {
        return currentStage;
    }

    public void setCurrentStage(String currentStage) {
        this.currentStage = currentStage;
    }

    public RejectionReason getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(RejectionReason rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getRejectionDetails() {
        return rejectionDetails;
    }

    public void setRejectionDetails(String rejectionDetails) {
        this.rejectionDetails = rejectionDetails;
    }

    public List<StageHistoryResponse> getStageHistory() {
        return stageHistory;
    }

    public void setStageHistory(List<StageHistoryResponse> stageHistory) {
        this.stageHistory = stageHistory;
    }
}
