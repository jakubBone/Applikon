package com.easyapply;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class EasyApplyApplication {

	public static void main(String[] args) {
		SpringApplication.run(EasyApplyApplication.class, args);
	}
}