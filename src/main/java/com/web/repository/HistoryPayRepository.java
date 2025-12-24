package com.web.repository;

import com.web.entity.HistoryPay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface HistoryPayRepository extends JpaRepository<HistoryPay, Long> {

    @Query("select h from HistoryPay h where h.orderId = ?1 and h.requestId = ?2")
    Optional<HistoryPay> findByOrderIdAndRequestId(String orderid, String requestId);

    @Query(value = "select sum(h.total_amount) from history_pay h where month(h.created_date) = ?1 and year(h.created_date) = ?2", nativeQuery = true)
    Double calDt(Integer month, Integer year);
}
