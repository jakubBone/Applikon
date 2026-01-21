package com.easyapply.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@EntityListeners(AuditingEntityListener.class)
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nazwa firmy nie może być pusta")
    @Column(nullable = false)
    private String company;

    @NotBlank(message = "Nazwa stanowiska nie może być pusta")
    @Column(nullable = false)
    private String position;

    private String link;

    @Min(value = 0, message = "Stawka musi być dodatnia")
    private Integer salaryMin;

    @Min(value = 0, message = "Stawka musi być dodatnia")
    private Integer salaryMax;

    private String currency;

    @Enumerated(EnumType.STRING)
    private SalaryType salaryType;

    @Enumerated(EnumType.STRING)
    private ContractType contractType;

    @Enumerated(EnumType.STRING)
    private SalarySource salarySource;

    private String source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.WYSLANE;

    @Column(columnDefinition = "TEXT")
    private String jobDescription;

    private String agency;

    @ManyToOne
    @JoinColumn(name = "cv_id")
    private CV cv;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime appliedAt;

    // Session ID dla izolacji danych userów (multi-tenant demo)
    @Column(name = "session_id", length = 50)
    private String sessionId;

    // Nowe pola dla elastycznych etapów
    private String currentStage;

    @Enumerated(EnumType.STRING)
    private RejectionReason rejectionReason;

    private String rejectionDetails;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private java.util.List<StageHistory> stageHistory = new java.util.ArrayList<>();

    // Constructors
    public Application() {}

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

    public CV getCv() {
        return cv;
    }

    public void setCv(CV cv) {
        this.cv = cv;
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

    public java.util.List<StageHistory> getStageHistory() {
        return stageHistory;
    }

    public void setStageHistory(java.util.List<StageHistory> stageHistory) {
        this.stageHistory = stageHistory;
    }

    public void addStageHistory(StageHistory stage) {
        stageHistory.add(stage);
        stage.setApplication(this);
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
