import { Injectable } from "@nestjs/common";
import { DeploymentDefinitionConfig } from "../class/deployment-definition.config";
import { DeploymentDefinitionConfigValidator } from "../validator/deployment-definition-config.validator";
import { ServiceDefinitionConfigValidator } from "../validator/service-definition-config.validator";
import { ServiceDefinitionConfig } from "../class/service-definition.config";

@Injectable({})
export class ResourceService {
  constructor(
    private readonly deploymentValidator: DeploymentDefinitionConfigValidator,
    private readonly serviceValidator: ServiceDefinitionConfigValidator,
  ) {}

  public getDeploymentDefinition(config: DeploymentDefinitionConfig): string {
    const result = this.deploymentValidator.validate(config);
    if (result.error) throw new Error(result.error.message);

    return `
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: ${result.value.name}
      labels:
        app: ${result.value.name}
    spec:
      selector:
        matchLabels:
          app: ${result.value.name}
      replicas: ${result.value.replicas}
      template:
        metadata:
          labels:
            app: ${result.value.name}
        spec:
          containers:
          - name: ${result.value.name}
            image: ${result.value.image}
            ports:
            - containerPort: ${result.value.containerPort}
    `;
  }

  public getServiceDefinition(config: ServiceDefinitionConfig): string {
    const result = this.serviceValidator.validate(config);
    if (result.error) throw new Error(result.error.message);

    return `
    apiVersion: v1
    kind: Service
    metadata:
      name: ${result.value.name}
      labels:
        app: ${result.value.name}
    spec:
      type: ${result.value.type}
      ports:
        - port: ${result.value.containerPort}
          targetPort: ${result.value.containerPort}
          name: default-port
      selector:
        app: ${result.value.name}
    `;
  }
}
