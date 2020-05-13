import Joi = require("@hapi/joi");
import { Injectable } from "@nestjs/common";
import { ServiceDefinitionConfig } from "../class/service-definition.config";

@Injectable({})
export class ServiceDefinitionConfigValidator {
  public validate(config: ServiceDefinitionConfig): Joi.ValidationResult {
    return Joi.object<ServiceDefinitionConfig>({
      name: Joi.string().required(),
      type: Joi.string()
        .valid("NodePort", "LoadBalancer", "ClusterIp", "ExternalService")
        .default("NodePort"),
      containerPort: Joi.number().default(80),
    }).validate(config);
  }
}
