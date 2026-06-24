package com.servicedesk.vision.project;

import com.servicedesk.vision.project.ProjectDtos.ProjectRequest;
import com.servicedesk.vision.project.ProjectDtos.TaskCreateRequest;
import com.servicedesk.vision.project.ProjectDtos.TaskRequest;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository taskRepository;

    public ProjectService(ProjectRepository projectRepository, ProjectTaskRepository taskRepository) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<Project> getProjects() {
        return projectRepository.findAllByOrderByIdAsc();
    }

    @Transactional(readOnly = true)
    public Project getProject(Long id) {
        return findProject(id);
    }

    @Transactional
    public Project createProject(ProjectRequest request) {
        Project project = new Project(
            request.name().trim(),
            request.detail().trim(),
            request.status().trim(),
            request.owner().trim()
        );
        return projectRepository.save(project);
    }

    @Transactional
    public Project updateProject(Long id, ProjectRequest request) {
        Project project = findProject(id);
        project.update(
            request.name().trim(),
            request.detail().trim(),
            request.status().trim(),
            request.owner().trim()
        );
        return project;
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = findProject(id);
        projectRepository.delete(project);
    }

    @Transactional
    public ProjectTask createTask(TaskCreateRequest request) {
        Project project = findProject(request.projectId());
        ProjectTask task = new ProjectTask(
            project,
            request.employeeId(),
            request.employeeIds(),
            request.name().trim(),
            request.detail().trim(),
            request.status().trim(),
            request.owner().trim()
        );
        return taskRepository.save(task);
    }

    @Transactional
    public ProjectTask updateTask(Long id, TaskRequest request) {
        ProjectTask task = taskRepository
            .findById(id)
            .orElseThrow(() -> new ProjectException("Task not found."));
        Project project = request.projectId() == null ? findProject(task.getProjectId()) : findProject(request.projectId());
        task.update(
            project,
            request.employeeId(),
            request.employeeIds(),
            request.name().trim(),
            request.detail().trim(),
            request.status().trim(),
            request.owner().trim()
        );
        return task;
    }

    @Transactional
    public void deleteTask(Long id) {
        ProjectTask task = taskRepository
            .findById(id)
            .orElseThrow(() -> new ProjectException("Task not found."));
        taskRepository.delete(task);
    }

    private Project findProject(Long id) {
        return projectRepository
            .findWithTasksById(id)
            .orElseThrow(() -> new ProjectException("Project not found."));
    }
}
