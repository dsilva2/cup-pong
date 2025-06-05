// import { StorageProperty } from "Core/StorageProperty";
// import { StoragePropertySet } from "Core/StoragePropertySet";
// import { SyncEntity } from "Core/SyncEntity";
import { StorageProperty } from "SpectaclesSyncKit.lspkg/SpectaclesSyncKit.lspkg/Core/StorageProperty";
import { StoragePropertySet } from "SpectaclesSyncKit.lspkg/SpectaclesSyncKit.lspkg/Core/StoragePropertySet";
import { SyncEntity } from "SpectaclesSyncKit.lspkg/SpectaclesSyncKit.lspkg/Core/SyncEntity";

@component
export class CupStorageProperty extends BaseScriptComponent {
  /**
   * Assign the cup's own SceneObject here in the Inspector.
   */
  @input
  public cupObject: SceneObject;

  private t: Transform;

  // StorageProperty for syncing position
  private propPosition = StorageProperty.autoVec3(
    "position",
    () => this.t.getWorldPosition(),
    (newValue) => {
      if (this.cupObject) {
        this.t.setWorldPosition(newValue);
      }
    }
  );

  // StorageProperty for syncing visibility
  private propEnabled = StorageProperty.autoBool(
    "enabled",
    () => this.cupObject.enabled,
    (newValue) => {
      if (this.cupObject) {
        this.cupObject.enabled = newValue;
      }
    }
  );

  // StoragePropertySet for SyncEntity
  private storagePropertySet = new StoragePropertySet([
    this.propPosition,
    this.propEnabled,
  ]);

  // SyncEntity for multiplayer sync - with auto-ownership
  private syncEntity: SyncEntity = new SyncEntity(
    this,
    this.storagePropertySet,
    true // Enable auto-ownership to ensure proper initialization
  );

  onAwake(): void {
    print(
      "CupStorageProperty onAwake for: " +
        (this.cupObject ? this.cupObject.name : "(no cupObject)")
    );

    // Get the transform component
    this.t = this.cupObject.getTransform();

    // Ensure cup is visible initially
    if (this.cupObject) {
      this.cupObject.enabled = true;
    }

    // Listen for ready event
    this.syncEntity.notifyOnReady(() => {
      print(
        "CupStorageProperty ready for: " +
          (this.cupObject ? this.cupObject.name : "(no cupObject)")
      );

      // Ensure cup is visible after sync is ready
      if (this.cupObject) {
        this.cupObject.enabled = true;
      }
    });
  }

  /**
   * Call this to reset the cup's position (will sync across all clients)
   */
  public resetPosition() {
    print(
      "resetPosition called for cup: " +
        (this.cupObject ? this.cupObject.name : "(no cupObject)")
    );

    // Set position directly
    const newPosition = new vec3(0, 5000, 0);
    this.t.setWorldPosition(newPosition);
  }
}
