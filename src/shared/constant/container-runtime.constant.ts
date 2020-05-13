export class ContainerRuntimeConstant {
  static readonly NAME: string = "container-runtime";
  static readonly CONTROLLER_NAME: string = `${ContainerRuntimeConstant.NAME}-controller`;
  static readonly CONTROLLER_NAMESPACE: string = "*";
  static readonly CRD_GROUP_NAME: string = "kubeblocks.io";
  static readonly CRD_GROUP_VERSION: string = "v1";
  static readonly CRD_NAME_PLURAL: string = "containerruntimes";
}
