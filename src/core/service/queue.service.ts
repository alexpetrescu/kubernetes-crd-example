import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import * as PQueue from "p-queue";
import { ContainerRuntimeService } from "./container-runtime.service";
import { ContextLoggerService } from "../../shared/service/context-logger.service";
import { LogConstant } from "../../shared/constant/log.constant";

@Injectable({})
export class QueueService implements OnApplicationShutdown {
  private readonly queue: any;

  constructor(
    private readonly containerRuntimeService: ContainerRuntimeService,
    private readonly logger: ContextLoggerService,
  ) {
    this.queue = new PQueue.default({ concurrency: 1 });
    this.logger.context = QueueService.name;
  }

  public onApplicationShutdown() {
    this.queue.pause();
    this.queue.clear();
  }

  public async enqueueContainerRuntime(obj: any) {
    if (!obj) return;

    this.logger.log(
      `${LogConstant.QueueContainerRuntimeForSync} - ${obj.metadata?.name}.`,
      obj.correlationId,
    );
    await this.queue.add(() => this.containerRuntimeService.sync(obj));
  }
}
