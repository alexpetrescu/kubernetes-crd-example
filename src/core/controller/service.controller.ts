import * as k8s from "@kubernetes/client-node";
import { LogConstant } from "../../shared/constant/log.constant";
import { ListPromise, HttpError, V1Service } from "@kubernetes/client-node";
import { InformerConstant } from "../../shared/constant/informer.constant";
import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ContainerRuntimeService } from "../service/container-runtime.service";
import { ServiceConstant } from "../../shared/constant/service.constant";
import { ContextLoggerService } from "../../shared/service/context-logger.service";
import { KubernetesService } from "../service/kubernetes.service";
import { QueueService } from "../service/queue.service";
import { Guid } from "guid-typescript";

@Injectable({})
export class ServiceController implements OnApplicationShutdown {
  private isRunning = false;
  private k8sInformer: k8s.Informer<unknown>;

  private readonly onUpdate = async (obj: any) => {
    try {
      obj.correlationId = Guid.create();
      this.logger.log(
        `${LogConstant.ProcessingUpdateStarted}service/${obj.metadata?.name}.`,
        obj.correlationId,
      );
      const ctr = await this.containerRuntimeService.findByService(obj);

      if (ctr) {
        ctr.correlationId = obj.correlationId;
        await this.queueService.enqueueContainerRuntime(ctr);
      } else {
        this.logger.log(
          `${LogConstant.DoingNothing} for service/${obj.metadata?.name}`,
          obj.correlationId,
        );
      }

      this.logger.log(
        `${LogConstant.ProcessingUpdateEnded}service/${obj.metadata?.name}.`,
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
        `${LogConstant.ProcessingDeleteStarted}service/${obj.metadata?.name}.`,
        obj.correlationId,
      );
      const ctr = await this.containerRuntimeService.findByService(obj);

      if (ctr) {
        ctr.correlationId = obj.correlationId;
        await this.queueService.enqueueContainerRuntime(ctr);
      } else {
        this.logger.log(
          `${LogConstant.DoingNothing} for service/${obj.metadata?.name}.`,
          obj.correlationId,
        );
      }

      this.logger.log(
        `${LogConstant.ProcessingDeleteEnded}service/${obj.metadata?.name}.`,
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
    this.logger.context = ServiceController.name;
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

  public async Stop(): Promise<void> {
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
    const namespace = ServiceConstant.SERVICE_NAMESPACE;
    let namespacePath = "";
    if (namespace && namespace !== "*")
      namespacePath = `/namespaces/${ServiceConstant.SERVICE_NAMESPACE}`;

    return `/api/v1${namespacePath}/${ServiceConstant.SERVICE_NAME_PLURAL}`;
  }

  private getListFn(): ListPromise<V1Service> {
    const namespace = ServiceConstant.SERVICE_NAMESPACE;
    if (namespace && namespace !== "*")
      return () =>
        this.kubernetesService.k8sCoreApi.listNamespacedService(namespace);

    return () =>
      this.kubernetesService.k8sCoreApi.listServiceForAllNamespaces();
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
