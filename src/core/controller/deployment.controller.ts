import * as k8s from "@kubernetes/client-node";
import { LogConstant } from "../../shared/constant/log.constant";
import { ListPromise, HttpError, V1Deployment } from "@kubernetes/client-node";
import { InformerConstant } from "../../shared/constant/informer.constant";
import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { DeploymentConstant } from "../../shared/constant/deployment.constant";
import { ContainerRuntimeService } from "../service/container-runtime.service";
import { ContextLoggerService } from "../../shared/service/context-logger.service";
import { KubernetesService } from "../service/kubernetes.service";
import { QueueService } from "../service/queue.service";
import { Guid } from "guid-typescript";

@Injectable({})
export class DeploymentController implements OnApplicationShutdown {
  private isRunning = false;
  private k8sInformer: k8s.Informer<unknown>;

  private readonly onUpdate = async (obj: any) => {
    try {
      obj.correlationId = Guid.create();
      this.logger.log(
        `${LogConstant.ProcessingUpdateStarted}deployment/${obj.metadata?.name}.`,
        obj.correlationId,
      );
      const ctr = await this.containerRuntimeService.findByDeployment(obj);

      if (ctr) {
        ctr.correlationId = obj.correlationId;
        await this.queueService.enqueueContainerRuntime(ctr);
      } else {
        this.logger.log(
          `${LogConstant.DoingNothing} for deployment/${obj.metadata?.name}.`,
          obj.correlationId,
        );
      }

      this.logger.log(
        `${LogConstant.ProcessingUpdateEnded}deployment/${obj.metadata?.name}.`,
        obj.correlationId,
      );
    } catch (err) {
      this.handleError(err);
    }
  };

  private readonly onDelete = async (obj: any) => {
    try {
      obj.correlationId = Guid.create();
      this.logger.log(
        `${LogConstant.ProcessingDeleteStarted}deployment/${obj.metadata?.name}.`,
        obj.correlationId,
      );
      const ctr = await this.containerRuntimeService.findByDeployment(obj);

      if (ctr) {
        ctr.correlationId = obj.correlationId;
        await this.queueService.enqueueContainerRuntime(ctr);
      } else {
        this.logger.log(
          `${LogConstant.DoingNothing} for deployment/${obj.metadata?.name}.`,
          obj.correlationId,
        );
      }

      this.logger.log(
        `${LogConstant.ProcessingDeleteEnded}deployment/${obj.metadata?.name}.`,
        obj.correlationId,
      );
    } catch (err) {
      this.handleError(err);
    }
  };

  private readonly onError = (err: any) => {
    try {
      err.correlationId = Guid.create();
      this.logger.log(
        `${LogConstant.ProcessingErrorStarted}.`,
        err.correlationId,
      );
      this.logger.error(err, "", err.correlationId);
      this.logger.log(
        LogConstant.RestartingContainerService,
        err.correlationId,
      );
      setTimeout(() => {
        if (!this.isRunning) return;
        this.logger.log(
          `${LogConstant.AttemptToRunContainerService}.`,
          err.correlationId,
        );
        this.k8sInformer.start();
        this.logger.log(
          `${LogConstant.RunningContainerService}.`,
          err.correlationId,
        );
      }, 3000);
      this.logger.log(LogConstant.ProcessingErrorEnded, err.correlationId);
    } catch (err) {
      this.handleError(err);
    }
  };

  constructor(
    private readonly containerRuntimeService: ContainerRuntimeService,
    private readonly queueService: QueueService,
    private readonly logger: ContextLoggerService,
    private readonly kubernetesService: KubernetesService,
  ) {
    this.logger.context = DeploymentController.name;
  }

  public onApplicationShutdown() {
    this.Stop();
  }

  public async Run(): Promise<void> {
    try {
      if (this.isRunning) return;

      const listFn = this.getListFn();
      const path = this.getPath();

      const informer = this.kubernetesService.makeInformer(path, listFn);

      informer.on(InformerConstant.UPDATE, this.onUpdate);
      informer.on(InformerConstant.DELETE, this.onDelete);
      informer.on(InformerConstant.ERROR, this.onError);

      this.logger.log(`${LogConstant.AttemptToRunContainerService}.`);
      await informer.start();
      this.k8sInformer = informer;
      this.isRunning = true;
      this.logger.log(`${LogConstant.RunningContainerService}.`);
    } catch (err) {
      this.logger.error(err, "");
      this.Stop();
    }
  }

  private Stop() {
    try {
      if (!this.isRunning) return;

      this.logger.log(`${LogConstant.AttemptToStopContainerService}.`);
      this.k8sInformer.off(InformerConstant.UPDATE, this.onUpdate);
      this.k8sInformer.off(InformerConstant.DELETE, this.onDelete);
      this.k8sInformer.off(InformerConstant.ERROR, this.onError);
      this.k8sInformer = null;
      this.isRunning = false;
      this.logger.log(`${LogConstant.StoppedContainerService}.`);
      return Promise.resolve();
    } catch (err) {
      this.logger.error(err, "");
    }
  }

  private getPath(): string {
    const namespace = DeploymentConstant.DEPLOYMENT_NAMESPACE;
    let namespacePath = "";
    if (namespace && namespace !== "*")
      namespacePath = `/namespaces/${DeploymentConstant.DEPLOYMENT_NAMESPACE}`;

    return `/apis/apps/v1${namespacePath}/${DeploymentConstant.DEPLOYMENT_NAME_PLURAL}`;
  }

  private getListFn(): ListPromise<V1Deployment> {
    const namespace = DeploymentConstant.DEPLOYMENT_NAMESPACE;
    if (namespace && namespace !== "*")
      return () =>
        this.kubernetesService.k8sAppsApi.listNamespacedDeployment(namespace);

    return () =>
      this.kubernetesService.k8sAppsApi.listDeploymentForAllNamespaces();
  }

  private handleError(err) {
    if (err instanceof HttpError && (err.response as any)?.body) {
      const body = (err.response as any).body;
      this.logger.error(
        `${body.code} - ${body.message}`,
        "",
        (err as any).correlationId,
      );
    } else {
      this.logger.error(err, "", err.correlationId);
    }
  }
}
