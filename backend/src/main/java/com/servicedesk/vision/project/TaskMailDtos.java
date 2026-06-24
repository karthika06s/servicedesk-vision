package com.servicedesk.vision.project;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class TaskMailDtos {

    private TaskMailDtos() {
    }

    public record TaskMailRequest(
        @NotNull Long taskId,
        @NotBlank @Email @Size(max = 160) String recipientEmail,
        @NotBlank @Size(max = 180) String subject,
        @NotBlank @Size(max = 2000) String message
    ) {
    }

    public record TaskMailResponse(
        Long id,
        Long taskId,
        Long projectId,
        String senderEmail,
        String senderUsername,
        String recipientEmail,
        String subject,
        String message,
        String deliveryStatus,
        Instant createdAt
    ) {
        static TaskMailResponse from(TaskMailReply reply) {
            return new TaskMailResponse(
                reply.getId(),
                reply.getTaskId(),
                reply.getProjectId(),
                reply.getSenderEmail(),
                reply.getSenderUsername(),
                reply.getRecipientEmail(),
                reply.getSubject(),
                reply.getMessage(),
                reply.getDeliveryStatus(),
                reply.getCreatedAt()
            );
        }
    }
}
