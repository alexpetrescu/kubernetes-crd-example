import Joi = require("@hapi/joi");
import { Injectable } from "@nestjs/common";
import { DeploymentDefinitionConfig } from "../class/deployment-definition.config";

@Injectable({})
export class DeploymentDefinitionConfigValidator {
  public validate(config: DeploymentDefinitionConfig): Joi.ValidationResult {
    return Joi.object<DeploymentDefinitionConfig>({
      name: Joi.string().required(),
      image: Joi.string().required(),
      replicas: Joi.number().default(1),
      containerPort: Joi.number().default(80),
    }).validate(config);
  }
}
