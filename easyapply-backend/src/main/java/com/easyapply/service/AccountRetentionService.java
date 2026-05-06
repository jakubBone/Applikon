package com.easyapply.service;

import com.easyapply.entity.User;
import com.easyapply.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccountRetentionService {

    private static final Logger log = LoggerFactory.getLogger(AccountRetentionService.class);

    private final UserRepository userRepository;
    private final UserService userService;

    @Value("${app.retention.inactive-months:12}")
    private int inactiveMonths;

    public AccountRetentionService(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupInactiveAccounts() {
        LocalDateTime threshold = LocalDateTime.now().minusMonths(inactiveMonths);
        List<User> inactive = userRepository.findInactiveUsers(threshold);

        for (User user : inactive) {
            log.info("Retention job deleting inactive account: userId={}", user.getId());
            userService.deleteAccount(user.getId());
        }

        log.info("Retention job removed {} inactive accounts", inactive.size());
    }
}
