package com.servicedesk.vision.project;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<ProjectTask> tasks = new ArrayList<>();

    protected Project() {
    }

    public Project(String name, String detail, String status, String owner) {
        this.name = name;
        this.detail = detail;
        this.status = status;
        this.owner = owner;
    }

    public Long getId() {
        return id;
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

    public List<ProjectTask> getTasks() {
        return tasks;
    }

    public void update(String name, String detail, String status, String owner) {
        this.name = name;
        this.detail = detail;
        this.status = status;
        this.owner = owner;
    }
}
