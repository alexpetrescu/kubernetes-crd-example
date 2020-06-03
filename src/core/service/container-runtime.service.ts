import { Injectable } from "@nestjs/common";
import { DeploymentDefinitionConfig } from "../class/deployment-definition.config";
import * as k8s from "@kubernetes/client-node";
import { ResourceService } from "./resouce.service";
import { ServiceDefinitionConfig } from "../class/service-definition.config";
import { HttpError, V1Deployment, V1Service } from "@kubernetes/client-node";
import { ContainerRuntimeConstant } from "../../shared/constant/container-runtime.constant";
import { ContextLoggerService } from "../../shared/service/context-logger.service";
import { KubernetesService } from "./kubernetes.service";
import { LogConstant } from "../../shared/constant/log.constant";

@Injectable({})
export class ContainerRuntimeService {
  constructor(
    private readonly logger: ContextLoggerService,
    private readonly resouceService: ResourceService,
    private readonly kubernetesService: KubernetesService,
  ) {
    this.logger.context = ContainerRuntimeService.name;
  }

  public async sync(obj: any): Promise<void> {
    this.logger.log(
      `${LogConstant.SyncingContainerRuntime} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
    const ctr = await this.findByName(
      obj.metadata?.name,
      obj.metadata?.namespace,
    );

    if (!ctr) {
      await this.delete(obj);
    } else {
      await this.syncDeployment(obj);
      await this.syncService(obj);
    }
    this.logger.log(
      `${LogConstant.SyncedContainerRuntime} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
  }

  public async findByService(obj: V1Service): Promise<any> {
    const ctr = await this.kubernetesService.k8sCustomApi
      .getNamespacedCustomObject(
        ContainerRuntimeConstant.CRD_GROUP_NAME,
        ContainerRuntimeConstant.CRD_GROUP_VERSION,
        obj.metadata.namespace,
        ContainerRuntimeConstant.CRD_NAME_PLURAL,
        obj.metadata.name,
      )
      .catch(e => {
        if (e instanceof HttpError) {
          const httpError = e as HttpError;
          if (httpError.statusCode == 404) {
            return null;
          }
        }

        throw new Error(e);
      });

    return ctr?.body;
  }

  public async findByDeployment(obj: V1Deployment): Promise<any> {
    const ctr = await this.kubernetesService.k8sCustomApi
      .getNamespacedCustomObject(
        ContainerRuntimeConstant.CRD_GROUP_NAME,
        ContainerRuntimeConstant.CRD_GROUP_VERSION,
        obj.metadata.namespace,
        ContainerRuntimeConstant.CRD_NAME_PLURAL,
        obj.metadata.name,
      )
      .catch(e => {
        if (e instanceof HttpError) {
          const httpError = e as HttpError;
          if (httpError.statusCode == 404) {
            return null;
          }
        }

        throw new Error(e);
      });

    return ctr?.body;
  }

  private async findByName(name: string, namespace: string): Promise<any> {
    if (!name) throw new Error("Name is required");
    if (!namespace) throw new Error("Namespace is required");

    const ctr = await this.kubernetesService.k8sCustomApi
      .getNamespacedCustomObject(
        ContainerRuntimeConstant.CRD_GROUP_NAME,
        ContainerRuntimeConstant.CRD_GROUP_VERSION,
        namespace,
        ContainerRuntimeConstant.CRD_NAME_PLURAL,
        name,
      )
      .catch(e => {
        if (e instanceof HttpError) {
          const httpError = e as HttpError;
          if (httpError.statusCode == 404) {
            return null;
          }
        }

        throw new Error(e);
      });

    return ctr?.body;
  }

  private async delete(obj: any): Promise<any> {
    await this.deleteDeployment(obj);
    await this.deleteService(obj);
  }

  private async deleteDeployment(obj: any): Promise<any> {
    this.logger.log(
      `${LogConstant.DeletingDeployment} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
    await this.kubernetesService.k8sAppsApi.deleteNamespacedDeployment(
      `${obj.metadata?.name}`,
      obj.metadata?.namespace,
    );
    this.logger.log(
      `${LogConstant.DeletedDeployment} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
  }

  private async deleteService(obj: any): Promise<any> {
    this.logger.log(
      `${LogConstant.DeletingService} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
    await this.kubernetesService.k8sCoreApi.deleteNamespacedService(
      `${obj.metadata?.name}`,
      obj.metadata?.namespace,
    );
    this.logger.log(
      `${LogConstant.DeletedService} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
  }

  private async addService(obj: any): Promise<any> {
    this.logger.log(
      `${LogConstant.CreatingService} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
    const service = this.loadServiceDefinition(obj);
    await this.kubernetesService.k8sCoreApi
      .createNamespacedService(obj.metadata?.namespace, service)
      .catch(err => {
        const body = (err.response as any)?.body;
        if (err instanceof HttpError && body && body.code == 409) {
          this.logger.log(body.message);
        } else {
          throw err;
        }
      });
    this.logger.log(
      `${LogConstant.CreatedService} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
  }

  private async addDeployment(obj: any): Promise<any> {
    this.logger.log(
      `${LogConstant.CreatingDeployment} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
    const deployment = this.loadDeploymentDefinition(obj);
    await this.kubernetesService.k8sAppsApi
      .createNamespacedDeployment(obj.metadata?.namespace, deployment)
      .catch(err => {
        const body = (err.response as any)?.body;
        if (err instanceof HttpError && body && body.code == 409) {
          this.logger.log(body.message);
        } else {
          throw err;
        }
      });
    this.logger.log(
      `${LogConstant.CreatedDeployment} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
  }

  private async findDeployment(obj: any): Promise<V1Deployment> {
    const deployments = await this.kubernetesService.k8sAppsApi.listNamespacedDeployment(
      obj.metadata?.namespace,
      null,
      null,
      null,
      `metadata.name=${obj.metadata?.name}`,
    );
    if (
      deployments.body &&
      deployments.body.items &&
      deployments.body.items.length
    )
      return deployments.body.items[0];
    return null;
  }

  private isDeploymentSynced(obj: any, deployment: V1Deployment) {
    if (
      deployment?.spec?.replicas !== obj.spec.replicas ||
      deployment?.spec?.template?.spec?.containers?.length !== 1 ||
      deployment?.spec?.template?.spec?.containers[0]?.image !==
        obj.spec.image ||
      !deployment?.spec?.template?.spec?.containers[0]?.ports ||
      deployment?.spec?.template?.spec?.containers[0]?.ports?.findIndex(
        f => f.containerPort == obj.spec.containerPort,
      ) === -1
    )
      return false;

    return true;
  }

  private async syncDeployment(obj: any) {
    const deployment = await this.findDeployment(obj);
    if (!deployment) {
      await this.addDeployment(obj);
      return;
    }

    if (!this.isDeploymentSynced(obj, deployment)) {
      await this.deleteDeployment(obj);
      return;
    }
  }

  private async findService(obj: any): Promise<V1Service> {
    const services = await this.kubernetesService.k8sCoreApi.listNamespacedService(
      obj.metadata?.namespace,
      null,
      null,
      null,
      `metadata.name=${obj.metadata?.name}`,
    );
    if (services.body && services.body.items && services.body.items.length)
      return services.body.items[0];
    return null;
  }

  private isServiceSynced(obj: any, service: V1Service) {
    if (
      service?.spec?.type !== "NodePort" ||
      service?.spec?.ports?.length === 0 ||
      service?.spec?.ports.findIndex(
        f =>
          f.port === obj?.spec?.containerPort &&
          f.targetPort === obj?.spec?.containerPort,
      ) === -1 ||
      !service?.spec?.selector ||
      Object.keys(service?.spec?.selector).length !== 1 ||
      Object.keys(service?.spec?.selector).indexOf("app") === -1 ||
      service?.spec?.selector["app"] !== obj.metadata?.name
    )
      return false;

    return true;
  }

  private async syncService(obj: any) {
    const service = await this.findService(obj);
    if (!service) {
      await this.addService(obj);
      return;
    }

    if (!this.isServiceSynced(obj, service)) {
      await this.deleteService(obj);
      return;
    }
  }

  private loadDeploymentDefinition(obj: any) {
    const config = new DeploymentDefinitionConfig();
    config.name = obj.metadata?.name;
    config.image = obj.spec?.image;
    config.replicas = obj.spec?.replicas;
    config.containerPort = obj.spec?.containerPort;

    const data = this.resouceService.getDeploymentDefinition(config);
    return k8s.loadYaml<k8s.V1Deployment>(data);
  }

  private loadServiceDefinition(obj: any) {
    const config = new ServiceDefinitionConfig();
    config.name = obj.metadata?.name;
    config.containerPort = obj.spec?.containerPort;

    const data = this.resouceService.getServiceDefinition(config);
    return k8s.loadYaml<k8s.V1Service>(data);
  }
}
