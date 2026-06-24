package com.servicedesk.vision.project;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Entity
@Table(name = "project_tasks")
public class ProjectTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column
    private Long employeeId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_task_employees", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "employee_id", nullable = false)
    private List<Long> employeeIds = new ArrayList<>();

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false, length = 160)
    private String detail;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(nullable = false, length = 140)
    private String owner;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected ProjectTask() {
    }

    public ProjectTask(
        Project project,
        Long employeeId,
        List<Long> employeeIds,
        String name,
        String detail,
        String status,
        String owner
    ) {
        this.project = project;
        setAssignedEmployees(employeeId, employeeIds);
        this.name = name;
        this.detail = detail;
        this.status = status;
        this.owner = owner;
    }

    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return project.getId();
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public List<Long> getEmployeeIds() {
        return employeeIds;
    }

    public String getName() {
        return name;
    }

    public String getDetail() {
        return detail;
    }

    public String getStatus() {
        return status;
    }

    public String getOwner() {
        return owner;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void update(
        Project project,
        Long employeeId,
        List<Long> employeeIds,
        String name,
        String detail,
        String status,
        String owner
    ) {
        this.project = project;
        setAssignedEmployees(employeeId, employeeIds);
        this.name = name;
        this.detail = detail;
        this.status = status;
        this.owner = owner;
    }

    private void setAssignedEmployees(Long employeeId, List<Long> employeeIds) {
        LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>();
        if (employeeIds != null) {
            employeeIds.stream()
                .filter(id -> id != null && id > 0)
                .forEach(uniqueIds::add);
        }
        if (employeeId != null && employeeId > 0) {
            uniqueIds.add(employeeId);
        }

        this.employeeIds = new ArrayList<>(uniqueIds);
        this.employeeId = this.employeeIds.isEmpty() ? employeeId : this.employeeIds.get(0);
    }
}
