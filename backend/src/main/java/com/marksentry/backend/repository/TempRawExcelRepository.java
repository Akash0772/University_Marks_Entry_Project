package com.marksentry.backend.repository;

import com.marksentry.backend.entity.TempRawExcel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

// PATH: src/main/java/com/marksentry/backend/repository/
@Repository
public interface TempRawExcelRepository extends JpaRepository<TempRawExcel, Long> {

    @Query(value = """
        SELECT
            t.programme_name,
            t.enrolment_no,
            t.course_code,
            t.comp7_marks,
            t.ManualEntryM
        FROM temp123.temp_raw_excel t
        WHERE t.ManualEntryM IS NOT NULL
          AND t.comp7_marks IS NOT NULL
          AND IFNULL(t.comp7_marks, 0) <> IFNULL(t.ManualEntryM, 0)
          AND (:programme IS NULL OR :programme = '' OR t.programme_name = :programme)
        ORDER BY t.programme_name, t.enrolment_no
        """, nativeQuery = true)
    List<Object[]> findMarksDiff(@Param("programme") String programme);

    @Query(value = "SELECT DISTINCT programme_name FROM temp123.temp_raw_excel ORDER BY programme_name",
            nativeQuery = true)
    List<String> findDistinctProgrammes();
}
