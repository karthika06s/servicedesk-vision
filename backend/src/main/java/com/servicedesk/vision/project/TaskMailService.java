package com.servicedesk.vision.project;

import com.servicedesk.vision.auth.JwtService.AuthenticatedUser;
import com.servicedesk.vision.project.TaskMailDtos.TaskMailRequest;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskMailService {

    private final ProjectTaskRepository taskRepository;
    private final TaskMailReplyRepository replyRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean mailEnabled;
    private final String fromAddress;

    public TaskMailService(
        ProjectTaskRepository taskRepository,
        TaskMailReplyRepository replyRepository,
        ObjectProvider<JavaMailSender> mailSenderProvider,
        @Value("${app.mail.enabled:false}") boolean mailEnabled,
        @Value("${app.mail.from:no-reply@servicedesk.local}") String fromAddress
    ) {
        this.taskRepository = taskRepository;
        this.replyRepository = replyRepository;
        this.mailSenderProvider = mailSenderProvider;
        this.mailEnabled = mailEnabled;
        this.fromAddress = fromAddress;
    }

    @Transactional
    public TaskMailReply sendTaskReply(TaskMailRequest request, AuthenticatedUser sender) {
        ProjectTask task = taskRepository
            .findById(request.taskId())
            .orElseThrow(() -> new ProjectException("Task not found."));

        String status = sendMailIfEnabled(request, sender, task);
        TaskMailReply reply = new TaskMailReply(
            task,
            sender.email(),
            sender.username(),
            request.recipientEmail().trim(),
            request.subject().trim(),
            request.message().trim(),
            status
        );
        return replyRepository.save(reply);
    }

    private String sendMailIfEnabled(
        TaskMailRequest request,
        AuthenticatedUser sender,
        ProjectTask task
    ) {
        if (!mailEnabled) {
            return "SAVED";
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new ProjectException("Mail server is not configured.");
        }

        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(fromAddress);
        mailMessage.setReplyTo(sender.email());
        mailMessage.setTo(request.recipientEmail().trim());
        mailMessage.setSubject(request.subject().trim());
        mailMessage.setText(
            "Reply from " + sender.username() + " (" + sender.email() + ")\n\n"
                + "Task: " + task.getName() + "\n"
                + "Project ID: " + task.getProjectId() + "\n\n"
                + request.message().trim()
        );
        mailSender.send(mailMessage);
        return "SENT";
    }
}
