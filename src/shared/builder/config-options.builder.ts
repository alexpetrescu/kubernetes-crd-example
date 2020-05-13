import * as Joi from "@hapi/joi";
import { ConfigConstant } from "../constant/config.constant";
import { EnvConstant } from "../constant/env.constant";
import { ConfigModuleOptions } from "@nestjs/config/dist/interfaces";

export class ConfigOptionsBuilder {
  public static getOptions(): ConfigModuleOptions {
    const validationSchema = {};
    validationSchema[ConfigConstant.NODE_ENV] = Joi.string()
      .valid(
        EnvConstant.development,
        EnvConstant.staging,
        EnvConstant.production,
      )
      .default(EnvConstant.development);

    return {
      isGlobal: true,
      validationSchema: Joi.object(validationSchema),
    };
  }
}
