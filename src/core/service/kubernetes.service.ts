import { Injectable } from "@nestjs/common";
import * as k8s from "@kubernetes/client-node";
import { EnvironmentService } from "../../shared/service/environment.service";

@Injectable({})
export class KubernetesService {
  private readonly k8sConfig: k8s.KubeConfig;

  public readonly k8sCustomApi: k8s.CustomObjectsApi;
  public readonly k8sAppsApi: k8s.AppsV1Api;
  public readonly k8sCoreApi: k8s.CoreV1Api;

  constructor(private readonly env: EnvironmentService) {
    this.k8sConfig = new k8s.KubeConfig();
    if (this.env.isDevelopment()) this.k8sConfig.loadFromDefault();
    else this.k8sConfig.loadFromCluster();

    this.k8sCustomApi = this.k8sConfig.makeApiClient(k8s.CustomObjectsApi);
    this.k8sAppsApi = this.k8sConfig.makeApiClient(k8s.AppsV1Api);
    this.k8sCoreApi = this.k8sConfig.makeApiClient(k8s.CoreV1Api);
  }

  makeInformer(path: string, listPromiseFn: k8s.ListPromise<unknown>) {
    return k8s.makeInformer(this.k8sConfig, path, listPromiseFn);
  }
}
