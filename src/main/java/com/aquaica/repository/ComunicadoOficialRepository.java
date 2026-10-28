package com.aquaica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aquaica.entity.ComunicadoOficial;

public interface ComunicadoOficialRepository extends JpaRepository<ComunicadoOficial, Long> {

    List<ComunicadoOficial> findByActivoTrueOrderByFechaPublicacionDesc();

    @Query("""
        SELECT c FROM ComunicadoOficial c
        WHERE c.activo = true
          AND (LOWER(c.distrito) = LOWER(:distrito) OR LOWER(c.distrito) = 'toda la región' OR LOWER(c.distrito) = 'regional')
        ORDER BY c.fechaPublicacion DESC
        """)
    List<ComunicadoOficial> findActivosPorDistrito(@Param("distrito") String distrito);

    List<ComunicadoOficial> findAllByOrderByFechaPublicacionDesc();
}
