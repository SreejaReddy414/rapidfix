package com.rapidfix.technician.util;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.stereotype.Component;
import org.springframework.validation.Validator;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.Locale;

@Configuration
public class MessageService {

    private final MessageSource messageSource;

    public MessageService() {

        ResourceBundleMessageSource source =
                new ResourceBundleMessageSource();

        source.setBasename("error-messages");
        source.setDefaultEncoding("UTF-8");

        this.messageSource = source;
    }

    public String get(String key, Object... args) {

        return messageSource.getMessage(
                key,
                args,
                Locale.getDefault()
        );
    }

    @Bean
    public Validator validator() {

        LocalValidatorFactoryBean bean =
                new LocalValidatorFactoryBean();

        bean.setValidationMessageSource(messageSource);

        return bean;
    }
}