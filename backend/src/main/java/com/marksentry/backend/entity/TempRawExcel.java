package com.marksentry.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

// PATH: src/main/java/com/marksentry/backend/entity/
@Entity
@Table(name = "temp_raw_excel", schema = "temp123")
@Data
public class TempRawExcel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String programmeName;
    private String enrolmentNo;
    private String courseCode;
    private Float comp7Marks;
    @Column(name = "ManualEntryM")
    private Float manualEntryM;
}
