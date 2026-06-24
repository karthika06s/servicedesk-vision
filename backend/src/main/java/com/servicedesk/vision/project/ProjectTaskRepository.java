package com.servicedesk.vision.project;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Long> {

    List<ProjectTask> findByProject_IdOrderByIdAsc(Long projectId);
}
