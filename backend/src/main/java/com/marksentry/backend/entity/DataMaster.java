// ================================================================
// FILE: DataMaster.java
// PATH: src/main/java/com/marksentry/backend/entity/
// CHANGE: unlock_remarks field add kiya
// ================================================================

package com.marksentry.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "data_master")
@Data
public class DataMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String  enrolmentNo;
    private String  studentName;
    private String  programmeName;
    private String  courseCode;
    private String  courseName;
    private String  term;
    private Integer maximumMarks;
    private Float marks;
    private Integer credit;

    @Column(columnDefinition = "varchar(20) default 'Present'")
    private String status;

    @Column(columnDefinition = "varchar(100) default 'system'")
    private String entryBy;

    @Column(columnDefinition = "varchar(10) default 'EXCEL'")
    private String entrySource;

    private LocalDateTime savedAt;
    private LocalDateTime updatedAt;

    // Lock Fields
    @Column(columnDefinition = "tinyint(1) default 0")
    private Boolean isLocked = false;

    private LocalDateTime lockedAt;
    private String        lockedBy;

    private LocalDateTime unlockedAt;
    private String        unlockedBy;

    // unlock summery
    @Column(length = 500)
    private String unlockRemarks;
}