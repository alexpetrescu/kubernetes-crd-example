import { Module } from "@nestjs/common";
import { ContainerRuntimeService } from "./core/service/container-runtime.service";
import { ConfigModule } from "@nestjs/config";
import { ConfigOptionsBuilder } from "./shared/builder/config-options.builder";
import { SharedModule } from "./shared/shared.module";
import { ResourceService } from "./core/service/resouce.service";
import { DeploymentDefinitionConfigValidator } from "./core/validator/deployment-definition-config.validator";
import { ServiceDefinitionConfigValidator } from "./core/validator/service-definition-config.validator";
import { ContainerRuntimeController } from "./core/controller/container-runtime.controller";
import { DeploymentController } from "./core/controller/deployment.controller";
import { ServiceController } from "./core/controller/service.controller";
import { QueueService } from "./core/service/queue.service";
import { KubernetesService } from "./core/service/kubernetes.service";

@Module({
  imports: [
    ConfigModule.forRoot(ConfigOptionsBuilder.getOptions()),
    SharedModule,
  ],
  providers: [
    ContainerRuntimeController,
    DeploymentController,
    ServiceController,
    ContainerRuntimeService,
    ResourceService,
    QueueService,
    KubernetesService,
    DeploymentDefinitionConfigValidator,
    ServiceDefinitionConfigValidator,
  ],
})
export class AppModule {}
