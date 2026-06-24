package com.servicedesk.vision.project;

import com.servicedesk.vision.auth.JwtService.AuthenticatedUser;
import com.servicedesk.vision.project.ProjectDtos.ErrorResponse;
import com.servicedesk.vision.project.TaskMailDtos.TaskMailRequest;
import com.servicedesk.vision.project.TaskMailDtos.TaskMailResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/task-mails")
public class TaskMailController {

    private final TaskMailService taskMailService;

    public TaskMailController(TaskMailService taskMailService) {
        this.taskMailService = taskMailService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskMailResponse sendTaskReply(
        @AuthenticationPrincipal AuthenticatedUser sender,
        @Valid @RequestBody TaskMailRequest request
    ) {
        return TaskMailResponse.from(taskMailService.sendTaskReply(request, sender));
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
            .body(new ErrorResponse("Please provide valid mail reply details."));
    }
}
