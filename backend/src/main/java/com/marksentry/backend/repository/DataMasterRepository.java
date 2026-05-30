// ================================================================
// FILE: DataMasterRepository.java
// PATH: src/main/java/com/marksentry/backend/repository/
// CHANGES: Statistics queries add
// ================================================================

package com.marksentry.backend.repository;

import com.marksentry.backend.entity.DataMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DataMasterRepository extends JpaRepository<DataMaster, Long> {

    // ── Dropdown Queries ─────────────────────────────────────
    @Query("SELECT DISTINCT d.programmeName FROM DataMaster d ORDER BY d.programmeName")
    List<String> findDistinctProgrammes();

    @Query("SELECT DISTINCT d.term FROM DataMaster d WHERE d.programmeName = :p ORDER BY d.term")
    List<String> findTermsByProgramme(@Param("p") String programme);

    @Query("SELECT DISTINCT d.courseCode FROM DataMaster d WHERE d.programmeName = :p AND d.term = :t ORDER BY d.courseCode")
    List<String> findCourseCodes(@Param("p") String programme, @Param("t") String term);

    @Query("SELECT DISTINCT d.courseCode FROM DataMaster d ORDER BY d.courseCode")
    List<String> findAllDistinctCourseCodes();

    // ── Search Queries ───────────────────────────────────────
    List<DataMaster> findByProgrammeNameAndTermAndCourseCode(
            String programmeName, String term, String courseCode);

    List<DataMaster> findByCourseCode(String courseCode);

    Optional<DataMaster> findByEnrolmentNoAndCourseCode(
            String enrolmentNo, String courseCode);

    // Statistics Queries

    // Overview: entry_source filled vs pending count
    @Query(value = """
        SELECT
            entry_source,
            COUNT(CASE WHEN marks IS NOT NULL THEN 1 END) AS filled,
            COUNT(CASE WHEN marks IS NULL     THEN 1 END) AS pending,
            COUNT(CASE WHEN status = 'Absent' THEN 1 END) AS absent_count
        FROM data_master
        GROUP BY entry_source
        """, nativeQuery = true)
    List<Object[]> getOverviewStats();

    // Course-wise: avg marks, total, entered, pending
    @Query(value = """
        SELECT
            course_code,
            course_name,
            COUNT(*)                                          AS total,
            COUNT(CASE WHEN marks IS NOT NULL THEN 1 END)    AS entered,
            COUNT(CASE WHEN marks IS NULL     THEN 1 END)    AS pending,
            AVG(CASE WHEN marks IS NOT NULL THEN marks END)  AS avg_marks,
            MAX(maximum_marks)                               AS max_marks
        FROM data_master
        GROUP BY course_code, course_name
        ORDER BY course_code
        """, nativeQuery = true)
    List<Object[]> getCourseWiseStats();



    // Entry source count - MANUAL vs EXCEL
    @Query(value = """
        SELECT entry_source, COUNT(*) AS cnt
        FROM data_master
        GROUP BY entry_source
        """, nativeQuery = true)
    List<Object[]> getEntrySourceStats();

    // Course-wise entry breakdown with username
    @Query(value = """
    SELECT
        course_code,
        entry_by,
        COUNT(*) AS total_entries,
        COUNT(CASE WHEN marks IS NOT NULL THEN 1 END) AS filled
    FROM data_master
    WHERE marks IS NOT NULL
    GROUP BY course_code, entry_by
    ORDER BY course_code, entry_by
    """, nativeQuery = true)
    List<Object[]> getCourseEntryByUser();

    // Programme-wise course stats (filter)
    @Query(value = """
    SELECT
        d.programme_name,
        d.course_code,
        d.course_name,
        COUNT(*)                                          AS total,
        COUNT(CASE WHEN d.marks IS NOT NULL THEN 1 END)  AS entered,
        COUNT(CASE WHEN d.marks IS NULL     THEN 1 END)  AS pending,
        AVG(CASE WHEN d.marks IS NOT NULL THEN d.marks END) AS avg_marks,
        MAX(d.maximum_marks)                             AS max_marks
    FROM data_master d
    WHERE (:programme = '' OR d.programme_name = :programme)
    GROUP BY d.programme_name, d.course_code, d.course_name
    ORDER BY d.programme_name, d.course_code
    """, nativeQuery = true)
    List<Object[]> getCourseStatsByProgramme(@Param("programme") String programme);

    @Query(value = """
    SELECT
        d.enrolment_no,
        d.course_code,
        d.course_name,
        d.status,
        d.marks,
        t.comp7_marks,
        t.ManualEntryM
    FROM marks_entry_db.data_master d
    LEFT JOIN temp123.temp_raw_excel t
        ON d.enrolment_no = t.enrolment_no COLLATE utf8mb4_unicode_ci
       AND d.course_code  = t.course_code  COLLATE utf8mb4_unicode_ci
    WHERE d.programme_name = :programme
      AND d.term = :semester
    ORDER BY d.enrolment_no, d.course_code
    """, nativeQuery = true)
    List<Object[]> getValidationReport(
            @Param("programme") String programme,
            @Param("semester")  String semester);


}