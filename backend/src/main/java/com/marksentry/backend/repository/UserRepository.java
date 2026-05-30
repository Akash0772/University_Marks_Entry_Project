// ================================================================
// FILE: UserRepository.java
// PATH: src/main/java/com/marksentry/backend/repository/
// ================================================================

package com.marksentry.backend.repository;

import com.marksentry.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    // Admin panel - sab users list
    List<User> findAllByOrderByCreatedAtDesc();
}