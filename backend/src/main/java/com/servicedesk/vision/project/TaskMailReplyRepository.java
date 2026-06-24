package com.servicedesk.vision.project;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskMailReplyRepository extends JpaRepository<TaskMailReply, Long> {

    List<TaskMailReply> findByTask_IdOrderByIdDesc(Long taskId);
}
