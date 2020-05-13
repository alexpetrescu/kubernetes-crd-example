import * as k8s from "@kubernetes/client-node";
import { LogConstant } from "../../shared/constant/log.constant";
import * as http from "http";
import { ListPromise, HttpError } from "@kubernetes/client-node";
import { InformerConstant } from "../../shared/constant/informer.constant";
import { ContainerRuntimeConstant } from "../../shared/constant/container-runtime.constant";
import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ContextLoggerService } from "../../shared/service/context-logger.service";
import { KubernetesService } from "../service/kubernetes.service";
import { QueueService } from "../service/queue.service";
import { Guid } from "guid-typescript";

@Injectable({})
export class ContainerRuntimeController implements OnApplicationShutdown {
  private isRunning = false;
  private k8sInformer: k8s.Informer<unknown>;

  private readonly onAdd = async (obj: any) => {
    try {
      obj.correlationId = Guid.create();
      this.logger.log(
        `${LogConstant.ProcessingAddStarted}ctr/${obj.metadata?.name}.`,
        obj.correlationId,
      );
      await this.queueService.enqueueContainerRuntime(obj);
      this.logger.log(
        `${LogConstant.ProcessingAddEnded}ctr/${obj.metadata?.name}.`,
        obj.correlationId,
      );
    } catch (err) {
      this.handleError(err);
    }
  };

  private readonly onUpdate = async (obj: any) => {
    try {
      obj.correlationId = Guid.create();
      this.logger.log(
        `${LogConstant.ProcessingUpdateStarted}ctr/${obj.metadata?.name}.`,
        obj.correlationId,
      );
      await this.queueService.enqueueContainerRuntime(obj);
      this.logger.log(
        `${LogConstant.ProcessingUpdateEnded}ctr/${obj.metadata?.name}.`,
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
        `${LogConstant.ProcessingDeleteStarted}ctr/${obj.metadata?.name}.`,
        obj.correlationId,
      );
      await this.queueService.enqueueContainerRuntime(obj);
      this.logger.log(
        `${LogConstant.ProcessingDeleteEnded}ctr/${obj.metadata?.name}.`,
        obj.correlationId,
      );
    } catch (err) {
      this.handleError(err);
    }
  };

  private readonly onError = (err: any) => {
    try {
      err.correlationId = Guid.create();
      this.logger.log(`${LogConstant.ProcessingErrorStarted}.`);
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
    private readonly queueService: QueueService,
    private readonly logger: ContextLoggerService,
    private readonly kubernetesService: KubernetesService,
  ) {
    this.logger.context = ContainerRuntimeController.name;
  }

  public onApplicationShutdown() {
    this.Stop();
  }

  public async Run(): Promise<void> {
    try {
      if (this.isRunning) return;

      const listFn = await this.getListFn();
      const path = this.getPath();

      const informer = this.kubernetesService.makeInformer(path, listFn);

      informer.on(InformerConstant.ADD, this.onAdd);
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

  private getPath(): string {
    const namespace = ContainerRuntimeConstant.CONTROLLER_NAMESPACE;
    let namespacePath = "";
    if (namespace && namespace !== "*")
      namespacePath = `/namespaces/${ContainerRuntimeConstant.CONTROLLER_NAMESPACE}`;

    return `/apis/${ContainerRuntimeConstant.CRD_GROUP_NAME}/${ContainerRuntimeConstant.CRD_GROUP_VERSION}${namespacePath}/${ContainerRuntimeConstant.CRD_NAME_PLURAL}`;
  }

  private async getListFn(): Promise<ListPromise<unknown>> {
    const promise = new Promise<{
      response: http.IncomingMessage;
      body: k8s.KubernetesListObject<any>;
    }>((resolve, reject) => {
      const namespace = ContainerRuntimeConstant.CONTROLLER_NAMESPACE;
      let listPromise = null;
      if (namespace && namespace !== "*") {
        listPromise = this.kubernetesService.k8sCustomApi.listNamespacedCustomObject(
          ContainerRuntimeConstant.CRD_GROUP_NAME,
          ContainerRuntimeConstant.CRD_GROUP_VERSION,
          namespace,
          ContainerRuntimeConstant.CRD_NAME_PLURAL,
        );
      } else {
        listPromise = this.kubernetesService.k8sCustomApi.listClusterCustomObject(
          ContainerRuntimeConstant.CRD_GROUP_NAME,
          ContainerRuntimeConstant.CRD_GROUP_VERSION,
          ContainerRuntimeConstant.CRD_NAME_PLURAL,
        );
      }

      listPromise
        .then(data => {
          resolve({
            response: data.response,
            body: data.body as any,
          });
        })
        .catch(err => reject(err));
    });

    return () => promise;
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

  private Stop() {
    try {
      if (!this.isRunning) return;

      this.logger.log(`${LogConstant.AttemptToStopContainerService}.`);
      this.k8sInformer.off(InformerConstant.ADD, this.onAdd);
      this.k8sInformer.off(InformerConstant.UPDATE, this.onUpdate);
      this.k8sInformer.off(InformerConstant.DELETE, this.onDelete);
      this.k8sInformer.off(InformerConstant.ERROR, this.onError);
      this.k8sInformer = null;
      this.isRunning = false;
      this.logger.log(`${LogConstant.StoppedContainerService}.`);
    } catch (err) {
      this.logger.error(err, "");
    }
  }
}
