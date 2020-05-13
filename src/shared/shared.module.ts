import { Module, Global } from "@nestjs/common";
import { AppLoggerService } from "./service/app-logger.service";
import { EnvironmentService } from "./service/environment.service";
import { ContextLoggerService } from "./service/context-logger.service";

@Global()
@Module({
  providers: [AppLoggerService, EnvironmentService, ContextLoggerService],
  exports: [AppLoggerService, EnvironmentService, ContextLoggerService],
})
export class SharedModule {}
