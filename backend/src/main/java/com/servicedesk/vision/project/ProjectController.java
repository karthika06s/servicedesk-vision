package com.servicedesk.vision.project;

import com.servicedesk.vision.project.ProjectDtos.ErrorResponse;
import com.servicedesk.vision.project.ProjectDtos.ProjectRequest;
import com.servicedesk.vision.project.ProjectDtos.ProjectResponse;
import com.servicedesk.vision.project.ProjectDtos.TaskCreateRequest;
import com.servicedesk.vision.project.ProjectDtos.TaskRequest;
import com.servicedesk.vision.project.ProjectDtos.TaskResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/projects")
    public List<ProjectResponse> getProjects() {
        return projectService.getProjects().stream().map(ProjectResponse::from).toList();
    }

    @GetMapping("/projects/{id}")
    public ProjectResponse getProject(@PathVariable Long id) {
        return ProjectResponse.from(projectService.getProject(id));
    }

    @PostMapping("/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse createProject(@Valid @RequestBody ProjectRequest request) {
        return ProjectResponse.from(projectService.createProject(request));
    }

    @PutMapping("/projects/{id}")
    public ProjectResponse updateProject(
        @PathVariable Long id,
        @Valid @RequestBody ProjectRequest request
    ) {
        return ProjectResponse.from(projectService.updateProject(id, request));
    }

    @DeleteMapping("/projects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse createTask(@Valid @RequestBody TaskCreateRequest request) {
        return TaskResponse.from(projectService.createTask(request));
    }

    @PutMapping("/tasks/{id}")
    public TaskResponse updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return TaskResponse.from(projectService.updateTask(id, request));
    }

    @DeleteMapping("/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable Long id) {
        projectService.deleteTask(id);
    }

    @ExceptionHandler(ProjectException.class)
    public ResponseEntity<ErrorResponse> handleProjectException(ProjectException exception) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException() {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("Please provide valid project details."));
    }
}
