import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConfigConstant } from "../constant/config.constant";
import { EnvConstant } from "../constant/env.constant";

@Injectable()
export class EnvironmentService {
  constructor(private readonly config: ConfigService) {}

  public isDevelopment() {
    return this.config.get(ConfigConstant.NODE_ENV) == EnvConstant.development;
  }

  public isStaging() {
    return this.config.get(ConfigConstant.NODE_ENV) == EnvConstant.staging;
  }

  public isProduction() {
    return this.config.get(ConfigConstant.NODE_ENV) == EnvConstant.production;
  }
}
