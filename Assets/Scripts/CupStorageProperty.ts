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

  // StoragePropertySet for SyncEntity
  private storagePropertySet = new StoragePropertySet([this.propPosition]);

  // SyncEntity for multiplayer sync - CHANGED: removed auto-own
  private syncEntity: SyncEntity = new SyncEntity(
    this,
    this.storagePropertySet,
    false // Changed to false - no auto-ownership
  );

  onAwake(): void {
    print(
      "CupStorageProperty onAwake for: " +
        (this.cupObject ? this.cupObject.name : "(no cupObject)")
    );

    // Get the transform component
    this.t = this.cupObject.getTransform();

    // Listen for ready event
    this.syncEntity.notifyOnReady(() => {
      print(
        "CupStorageProperty ready for: " +
          (this.cupObject ? this.cupObject.name : "(no cupObject)")
      );
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

    // Set position directly - no ownership needed
    const newPosition = new vec3(0, 5000, 0);
    this.t.setWorldPosition(newPosition);
  }
}
