package com.barilog.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpiryReminderResponse {
    private int windowDays;
    private List<NoticeResponse> expiringNotices;
    private List<MaintenanceAgreementResponse> expiringAgreements;
}
