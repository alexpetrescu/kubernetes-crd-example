export class LogConstant {
  static readonly RunningContainerService = "Controller listening";
  static readonly AttemptToRunContainerService = "Controller is starting";
  static readonly RestartingContainerService = "Restarting controller";
  static readonly AttemptToStopContainerService = "Controller is stopping";
  static readonly StoppedContainerService = "Controller is stopped";
  static readonly ProcessingAddStarted = "Processing ADD event started for ";
  static readonly ProcessingAddEnded = "Processing ADD event ended for ";
  static readonly ProcessingUpdateStarted =
    "Processing UPDATE event started for ";
  static readonly ProcessingUpdateEnded = "Processing UPDATE event ended for ";
  static readonly ProcessingDeleteStarted =
    "Processing DELETE event started for ";
  static readonly ProcessingDeleteEnded = "Processing DELETE event ended for ";
  static readonly ProcessingErrorStarted = "Processing ERROR event started.";
  static readonly ProcessingErrorEnded = "Processing ERROR event ended.";
  static readonly SyncingContainerRuntime = "Syncing container runtime";
  static readonly SyncedContainerRuntime = "Synced container runtime";
  static readonly SyncingDeployment = "Syncing deployment";
  static readonly SyncedDeployment = "Synced deployment";
  static readonly DeletingDeployment = "Deleting deployment";
  static readonly DeletedDeployment = "Deleted deployment";
  static readonly DeletingService = "Deleting service";
  static readonly DeletedService = "Deleted service";
  static readonly CreatingDeployment = "Creating deployment";
  static readonly CreatedDeployment = "Created deployment";
  static readonly SyncingService = "Syncing service";
  static readonly SyncedService = "Synced service";
  static readonly CreatingService = "Creating service";
  static readonly CreatedService = "Created service";
  static readonly ContainerRuntimeNotFound = "Container runtime not found";
  static readonly DoingNothing = "Nothing to do";
  static readonly AlreadySynced = "Already synced";
  static readonly QueueContainerRuntimeForSync =
    "Queued container runtime for sync";
  static readonly DeploymentIsUnchanged = "Deployment is unchanged";
  static readonly ServiceIsUnchanged = "Service is unchanged";
}
