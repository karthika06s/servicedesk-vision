package com.servicedesk.vision.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "task_mail_replies")
public class TaskMailReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private ProjectTask task;

    @Column(nullable = false)
    private Long projectId;

    @Column(nullable = false, length = 160)
    private String senderEmail;

    @Column(nullable = false, length = 80)
    private String senderUsername;

    @Column(nullable = false, length = 160)
    private String recipientEmail;

    @Column(nullable = false, length = 180)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false, length = 40)
    private String deliveryStatus;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected TaskMailReply() {
    }

    public TaskMailReply(
        ProjectTask task,
        String senderEmail,
        String senderUsername,
        String recipientEmail,
        String subject,
        String message,
        String deliveryStatus
    ) {
        this.task = task;
        this.projectId = task.getProjectId();
        this.senderEmail = senderEmail;
        this.senderUsername = senderUsername;
        this.recipientEmail = recipientEmail;
        this.subject = subject;
        this.message = message;
        this.deliveryStatus = deliveryStatus;
    }

    public Long getId() {
        return id;
    }

    public Long getTaskId() {
        return task.getId();
    }

    public Long getProjectId() {
        return projectId;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public String getSenderUsername() {
        return senderUsername;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public String getSubject() {
        return subject;
    }

    public String getMessage() {
        return message;
    }

    public String getDeliveryStatus() {
        return deliveryStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
