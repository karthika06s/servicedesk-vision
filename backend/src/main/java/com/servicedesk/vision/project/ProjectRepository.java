package com.servicedesk.vision.project;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByNameIgnoreCase(String name);

    @EntityGraph(attributePaths = "tasks")
    List<Project> findAllByOrderByIdAsc();

    @EntityGraph(attributePaths = "tasks")
    Optional<Project> findWithTasksById(Long id);
}
