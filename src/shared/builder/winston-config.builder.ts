import { Injectable } from "@nestjs/common";
import { green, yellow, cyan, red } from "colors/safe";
import * as winston from "winston";

@Injectable()
export class WinstonConfigBuilder {
  public static getWinstonConfig(): winston.LoggerOptions {
    const transports: any[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          WinstonConfigBuilder.format(),
        ),
        level: "debug",
      }),
    ];

    return {
      transports,
    };
  }

  private static format() {
    return winston.format.printf(info => {
      const correlationId = info.correlationId || "root";
      const loggerName = info.loggerName || "Application";
      const date = info.timestamp
        ? `${new Date(info.timestamp).toLocaleString()} `
        : "";
      const ctx = info.context ? `${yellow("[" + info.context + "]")} ` : "";
      const lvl = WinstonConfigBuilder.colorLevel(info.level);
      const name = green(`[${loggerName}][${correlationId}]`);

      return `${name} ${lvl} ${green("-")} ${date} ${ctx} ${green(
        info.message,
      )}`;
    });
  }

  private static colorLevel(level: string): string {
    let color = green;
    switch (level) {
      case "info":
        color = cyan;
        break;
      case "warn":
        color = yellow;
        break;
      case "error":
        color = red;
        break;
      case "critical":
        color = red;
        break;
      default:
        color = green;
        break;
    }

    return color(level);
  }
}
