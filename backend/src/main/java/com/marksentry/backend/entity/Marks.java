package com.marksentry.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "marks")
@Data
public class Marks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String enrolmentNo;
    private String studentName;
    private String programmeName;
    private String courseCode;
    private String courseName;
    private String semester;
    private Integer maximumMarks;
    private Integer marks;

    @Enumerated(EnumType.STRING)
    private Status status = Status.Present;

    private LocalDateTime savedAt = LocalDateTime.now();
    private LocalDateTime updatedAt;

    public enum Status {
        Present, Absent, UFM, Withheld
    }
}