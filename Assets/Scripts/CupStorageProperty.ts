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

  // Hard-coded positions for each cup
  private static readonly CUP_POSITIONS: { [key: string]: vec3 } = {
    "cup v2 0": new vec3(0.0, -48.087738, -187.163513),
    "cup v2 1": new vec3(0.0, -48.087738, -197.163513),
    "cup v2 2": new vec3(0.0, -48.087738, -177.163513),
    "cup v2 3": new vec3(0.0, -48.087738, -207.163513),
    "cup v2 5": new vec3(-9.0, -48.087738, -182.163513),
    "cup v2 6": new vec3(-9.0, -48.087738, -172.163513),
    "cup v2 7": new vec3(-9.0, -48.087738, -192.755127),
    "cup v2 8": new vec3(9.0, -48.087738, -182.163513),
    "cup v2 9": new vec3(9.0, -48.087738, -192.163513),
    "cup v2 10": new vec3(-15.0, -25.0, -91.132706),
    "cup v2 11": new vec3(9.0, -48.087738, -202.163513),
    "cup v2 12": new vec3(-18.0, -48.087738, -187.163513),
    "cup v2 15": new vec3(-9.0, -48.087738, -202.163513),
    "cup v2 16": new vec3(18.0, -48.087738, -197.163513),
    "cup v2 17": new vec3(18.0, -48.087738, -187.163513),
    "cup v2 18": new vec3(-18.0, -48.087738, -177.163513),
    "cup v2 19": new vec3(18.0, -48.087738, -177.163513),
  };

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

    // Set initial position from hard-coded positions
    const cupName = this.cupObject.name;
    if (CupStorageProperty.CUP_POSITIONS[cupName]) {
      this.t.setWorldPosition(CupStorageProperty.CUP_POSITIONS[cupName]);
    }

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

      // Ensure cup is visible and in correct position after sync is ready
      if (this.cupObject) {
        this.cupObject.enabled = true;
        const cupName = this.cupObject.name;
        if (CupStorageProperty.CUP_POSITIONS[cupName]) {
          this.t.setWorldPosition(CupStorageProperty.CUP_POSITIONS[cupName]);
        }
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

    // Reset to hard-coded position
    const cupName = this.cupObject.name;
    if (CupStorageProperty.CUP_POSITIONS[cupName]) {
      this.t.setWorldPosition(CupStorageProperty.CUP_POSITIONS[cupName]);
    }
  }
}
