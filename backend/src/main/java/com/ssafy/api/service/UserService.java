package com.REDACTED.api.service;

import com.REDACTED.api.request.UserRegisterPostReq;
import com.REDACTED.db.entity.User;

/**
 *	유저 관련 비즈니스 로직 처리를 위한 서비스 인터페이스 정의.
 */
public interface UserService {
	User createUser(UserRegisterPostReq userRegisterInfo);
	User getUserByUserId(String userId);
}
