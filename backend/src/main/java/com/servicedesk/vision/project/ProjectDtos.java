package com.servicedesk.vision.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class ProjectDtos {

    private ProjectDtos() {
    }

    public record ProjectRequest(
        @NotBlank @Size(max = 140) String name,
        @NotBlank @Size(max = 160) String detail,
        @NotBlank @Size(max = 40) String status,
        @NotBlank @Size(max = 140) String owner
    ) {
    }

    public record TaskRequest(
        Long projectId,
        Long employeeId,
        List<Long> employeeIds,
        @NotBlank @Size(max = 140) String name,
        @NotBlank @Size(max = 160) String detail,
        @NotBlank @Size(max = 40) String status,
        @NotBlank @Size(max = 140) String owner
    ) {
    }

    public record TaskResponse(
        Long id,
        Long projectId,
        Long employeeId,
        List<Long> employeeIds,
        String name,
        String detail,
        String status,
        String owner
    ) {
        static TaskResponse from(ProjectTask task) {
            return new TaskResponse(
                task.getId(),
                task.getProjectId(),
                task.getEmployeeId(),
                task.getEmployeeIds(),
                task.getName(),
                task.getDetail(),
                task.getStatus(),
                task.getOwner()
            );
        }
    }

    public record ProjectResponse(
        Long id,
        String name,
        String detail,
        String status,
        String owner,
        List<TaskResponse> tasks
    ) {
        static ProjectResponse from(Project project) {
            return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDetail(),
                project.getStatus(),
                project.getOwner(),
                project.getTasks().stream().map(TaskResponse::from).toList()
            );
        }
    }

    public record TaskCreateRequest(
        @NotNull Long projectId,
        Long employeeId,
        List<Long> employeeIds,
        @NotBlank @Size(max = 140) String name,
        @NotBlank @Size(max = 160) String detail,
        @NotBlank @Size(max = 40) String status,
        @NotBlank @Size(max = 140) String owner
    ) {
    }

    public record ErrorResponse(String message) {
    }
}
