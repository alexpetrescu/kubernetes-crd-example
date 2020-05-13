import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppLoggerService } from "./shared/service/app-logger.service";
import { INestApplicationContext } from "@nestjs/common";
import { ContainerRuntimeController } from "./core/controller/container-runtime.controller";
import { DeploymentController } from "./core/controller/deployment.controller";
import { ServiceController } from "./core/controller/service.controller";

async function bootstrap() {
  let app: INestApplicationContext;
  let logger: AppLoggerService;
  let ctrController: ContainerRuntimeController;
  let deploymentController: DeploymentController;
  let serviceController: ServiceController;

  try {
    app = await NestFactory.createApplicationContext(AppModule);
    logger = await app.resolve(AppLoggerService);
    app.useLogger(logger);
    app.enableShutdownHooks();

    ctrController = await app.resolve(ContainerRuntimeController);
    deploymentController = await app.resolve(DeploymentController);
    serviceController = await app.resolve(ServiceController);

    await Promise.all([
      ctrController.Run(),
      deploymentController.Run(),
      serviceController.Run(),
    ]);
  } catch (err) {
    if (logger) logger.error(err, "");
    else console.error(err);
    if (app) await app.close();

    process.exit(1);
  }
}

bootstrap();
