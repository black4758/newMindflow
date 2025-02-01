package com.swissclassic.mindflow_server.account.service;

import com.swissclassic.mindflow_server.account.dataclass.User;
import com.swissclassic.mindflow_server.account.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;

import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Custom implementation of UserDetailsService to load user-specific data.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRepository userRepository;

    /**
     * Loads the user by username.
     *
     * @param username the username identifying the user whose data is required.
     * @return UserDetails object containing user information
     * @throws UsernameNotFoundException if the user could not be found
     */
    @Override
    public UserDetails loadUserByUsername(String accountId) throws UsernameNotFoundException {
        User user = userRepository.findByAccountId(accountId)
                                  .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + accountId));

        // You can add roles and authorities as needed
        return new org.springframework.security.core.userdetails.User(user.getUsername(), user.getPassword(),
                                                                      Collections.emptyList());
    }
}
