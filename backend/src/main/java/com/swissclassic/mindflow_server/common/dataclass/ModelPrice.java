package com.swissclassic.mindflow_server.common.dataclass;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Entity
@Getter
@Setter
@Table(name = "model_price")
public class ModelPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long inputPrice;  // microcents
    private Long outputPrice; // microcents

    // Constructors, getters, setters
}
