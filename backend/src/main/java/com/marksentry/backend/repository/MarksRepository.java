package com.marksentry.backend.repository;

import com.marksentry.backend.entity.Marks;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MarksRepository extends JpaRepository<Marks, Long> {
    Optional<Marks> findByEnrolmentNoAndCourseCode(String enrolmentNo, String courseCode);
}