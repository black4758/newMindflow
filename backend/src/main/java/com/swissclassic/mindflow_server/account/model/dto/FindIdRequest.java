package com.swissclassic.mindflow_server.account.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FindIdRequest {
    String name;
    String email;
}
