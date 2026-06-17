package com.rapidfix.dispatch.scheduler;

import com.rapidfix.dispatch.service.DispatchService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutoAssignmentSchedulerTest {

    @Mock DispatchService dispatchService;
    @InjectMocks AutoAssignmentScheduler scheduler;

    @Test
    void runAutoAssignment_callsService() {
        scheduler.runAutoAssignment();

        verify(dispatchService, times(1)).runAutoAssignment();
    }

    @Test
    void runAutoAssignment_serviceThrowsException_doesNotPropagate() {
        // If the service throws, the scheduler should catch it and NOT crash
        // This matches the try-catch in AutoAssignmentScheduler.runAutoAssignment()
        doThrow(new RuntimeException("DB connection lost"))
                .when(dispatchService).runAutoAssignment();

        // Should not throw — scheduler swallows exceptions
        scheduler.runAutoAssignment();

        verify(dispatchService, times(1)).runAutoAssignment();
    }

    @Test
    void runAutoAssignment_calledTwice_invokesServiceTwice() {
        scheduler.runAutoAssignment();
        scheduler.runAutoAssignment();

        verify(dispatchService, times(2)).runAutoAssignment();
    }
}