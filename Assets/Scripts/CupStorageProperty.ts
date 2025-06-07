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
    "cup v2 0": new vec3(150.0, -48.087738, -37.163513),
    "cup v2 1": new vec3(150.0, -48.087738, -47.163513),
    "cup v2 2": new vec3(150.0, -48.087738, -27.163513),
    "cup v2 3": new vec3(150.0, -48.087738, -57.163513),
    "cup v2 4": new vec3(150.0, -48.087738, -17.163513),
    "cup v2 5": new vec3(141.0, -48.087738, -32.163513),
    "cup v2 6": new vec3(141.0, -48.087738, -22.163513),
    "cup v2 7": new vec3(141.0, -48.087738, -42.755127),
    "cup v2 8": new vec3(159.0, -48.087738, -32.163513),
    "cup v2 9": new vec3(159.0, -48.087738, -42.163513),
    "cup v2 10": new vec3(135.0, -25.0, 58.867294),
    "cup v2 11": new vec3(159.0, -48.087738, -52.163513),
    "cup v2 12": new vec3(132.0, -48.087738, -37.163513),
    "cup v2 13": new vec3(159.0, -48.087738, -22.163513),
    "cup v2 14": new vec3(132.0, -48.087738, -47.163513),
    "cup v2 15": new vec3(141.0, -48.087738, -52.163513),
    "cup v2 16": new vec3(168.0, -48.087738, -47.163513),
    "cup v2 17": new vec3(168.0, -48.087738, -37.163513),
    "cup v2 18": new vec3(132.0, -48.087738, -27.163513),
    "cup v2 19": new vec3(168.0, -48.087738, -27.163513),
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

  // StoragePropertySet for SyncEntity
  private storagePropertySet = new StoragePropertySet([this.propPosition]);

  // SyncEntity for multiplayer sync - CHANGED: removed auto-own
  private syncEntity: SyncEntity = new SyncEntity(
    this,
    this.storagePropertySet,
    true // Changed to true - enable auto-ownership
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
      const initialPos = CupStorageProperty.CUP_POSITIONS[cupName];
      this.t.setWorldPosition(initialPos);
      // Force write the initial position to the store
      if (this.syncEntity.isStoreOwned()) {
        this.propPosition.putCurrentValue(this.syncEntity.currentStore);
      }
    }

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

    // Reset to hard-coded position
    const cupName = this.cupObject.name;
    if (CupStorageProperty.CUP_POSITIONS[cupName]) {
      const resetPos = CupStorageProperty.CUP_POSITIONS[cupName];
      this.t.setWorldPosition(resetPos);

      // Only sync if we own the store
      if (this.syncEntity.isStoreOwned()) {
        this.propPosition.putCurrentValue(this.syncEntity.currentStore);
      }
    }
  }
}
