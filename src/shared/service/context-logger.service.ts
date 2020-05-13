import { AppLoggerService } from "./app-logger.service";
import { LoggerService, Injectable, Scope } from "@nestjs/common";

@Injectable({ scope: Scope.TRANSIENT })
export class ContextLoggerService implements LoggerService {
  public context = "Application";

  constructor(private readonly logger: AppLoggerService) {}

  log(message: string, correlationId?: string) {
    this.logger.log(message, {
      loggerName: this.context,
      correlationId: correlationId,
    });
  }
  error(message: string, trace: string, correlationId?: string) {
    this.logger.error(message, trace, {
      loggerName: this.context,
      correlationId: correlationId,
    });
  }
  warn(message: string, correlationId?: string) {
    this.logger.warn(message, {
      loggerName: this.context,
      correlationId: correlationId,
    });
  }
  debug(message: string, correlationId?: string) {
    this.logger.debug(message, {
      loggerName: this.context,
      correlationId: correlationId,
    });
  }
  verbose(message: string, correlationId?: string) {
    this.logger.verbose(message, {
      loggerName: this.context,
      correlationId: correlationId,
    });
  }
}
