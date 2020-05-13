import { Injectable, LoggerService } from "@nestjs/common";
import * as winston from "winston";
import { WinstonConfigBuilder } from "../builder/winston-config.builder";

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger(WinstonConfigBuilder.getWinstonConfig());
  }

  log(message: string, meta: any = {}) {
    this.logger.log("info", message, meta);
  }

  error(message: string, trace: string, meta: any = {}) {
    meta.trace = trace;
    this.logger.error(message, meta);
  }

  warn(message: string, meta: any = {}) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta: any = {}) {
    this.logger.debug(message, meta);
  }

  verbose(message: string, meta: any = {}) {
    this.logger.verbose(message, meta);
  }
}
