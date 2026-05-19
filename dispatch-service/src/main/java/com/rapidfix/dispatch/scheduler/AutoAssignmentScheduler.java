package com.rapidfix.dispatch.scheduler;
import com.rapidfix.dispatch.service.DispatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
@Component @RequiredArgsConstructor @Slf4j
public class AutoAssignmentScheduler {
    private final DispatchService dispatchService;
    @Scheduled(fixedDelay = 30000)
    public void runAutoAssignment() {
        log.debug("Auto-assignment scheduler triggered");
        try {
            dispatchService.runAutoAssignment();
        } catch (Exception e) {
            log.error("Auto-assignment scheduler error: {}", e.getMessage(), e);
        }
    }
}
