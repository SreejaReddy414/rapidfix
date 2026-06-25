package com.rapidfix.dispatch.entity;

public enum RequestStatus {
    PENDING,        // Created, visible to all matching technicians
    QUOTED,         // A technician submitted a quote, waiting for user approval
    APPROVED,       // User approved the quote — technician will now visit
    IN_PROGRESS,    // Technician on site, working
    COMPLETED,      // Job fully done
    PAID,           // User paid the final amount via Razorpay
    CANCELLED       // Cancelled by user or system
}