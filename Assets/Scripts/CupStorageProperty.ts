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
  private isSyncReady = false;
  private isStoreOwner = false;

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

  // StorageProperty for syncing position - LIKE PINGPONGBALL
  private propPosition = StorageProperty.autoVec3(
    "position",
    () => this.t.getWorldPosition(),
    (newValue) => {
      // Only apply sync updates when sync is ready and we're not the owner setting initial position
      if (this.isSyncReady && this.cupObject) {
        this.t.setWorldPosition(newValue);
        print("Cup " + this.cupObject.name + " position synced from remote: " + newValue.toString());
      }
    }
  );

  // StorageProperty for syncing visibility - LIKE PINGPONGBALL INTERACTION STATE
  private propEnabled = StorageProperty.autoBool(
    "enabled",
    () => this.cupObject ? this.cupObject.enabled : true,
    (newValue) => {
      if (this.isSyncReady && this.cupObject) {
        this.cupObject.enabled = newValue;
        print("Cup " + this.cupObject.name + " visibility synced: " + newValue);
      }
    }
  );

  // StoragePropertySet for SyncEntity
  private storagePropertySet = new StoragePropertySet([this.propPosition, this.propEnabled]);

  // SyncEntity for multiplayer sync - AUTHORITY-BASED LIKE PINGPONGBALL
  private syncEntity: SyncEntity = new SyncEntity(
    this,
    this.storagePropertySet,
    true // First client becomes the authority (like ball physics)
  );

  onAwake(): void {
    print("CupStorageProperty onAwake for: " + (this.cupObject ? this.cupObject.name : "(no cupObject)"));

    if (!this.cupObject) {
      print("ERROR: No cup object assigned to CupStorageProperty");
      return;
    }

    // Get the transform component
    this.t = this.cupObject.getTransform();

    // CRITICAL: Wait for sync to be ready BEFORE doing ANYTHING (like PingPongBall)
    this.syncEntity.notifyOnReady(() => {
      this.onSyncReady();
    });
  }

  private onSyncReady(): void {
    this.isSyncReady = true;
    this.isStoreOwner = this.syncEntity.isStoreOwned();

    const cupName = this.cupObject.name;
    print("Cup " + cupName + " sync ready. IsOwner: " + this.isStoreOwner);

    if (this.isStoreOwner) {
      // AUTHORITY: Only the owner sets initial position (like ball owner sets velocity)
      this.setInitialPositionAsOwner(cupName);
    } else {
      // FOLLOWER: Wait for synced position (like ball followers receive physics updates)
      this.waitForSyncedPosition(cupName);
    }
  }

  private setInitialPositionAsOwner(cupName: string): void {
    if (CupStorageProperty.CUP_POSITIONS[cupName]) {
      const initialPos = CupStorageProperty.CUP_POSITIONS[cupName];

      // Set position locally
      this.t.setWorldPosition(initialPos);
      this.cupObject.enabled = true;

      // Broadcast to all other clients (like ball broadcasts velocity)
      this.propPosition.putCurrentValue(this.syncEntity.currentStore);
      this.propEnabled.putCurrentValue(this.syncEntity.currentStore);

      print("OWNER: Cup " + cupName + " positioned at: " + initialPos.toString());
    } else {
      print("ERROR: No predefined position for cup: " + cupName);
    }
  }

  private waitForSyncedPosition(cupName: string): void {
    // Followers do nothing - they receive position via sync automatically
    // This is like how ball followers receive physics updates automatically
    print("FOLLOWER: Cup " + cupName + " waiting for owner's position");
  }

  /**
   * Call this to reset the cup's position (will sync across all clients) - LIKE BALL REGENERATION
   */
  public resetPosition(): void {
    if (!this.isSyncReady) {
      print("Cup sync not ready, cannot reset position");
      return;
    }

    const cupName = this.cupObject ? this.cupObject.name : "unknown";
    print("resetPosition called for cup: " + cupName);

    // Reset to hard-coded position (like ball regeneration)
    if (this.cupObject && CupStorageProperty.CUP_POSITIONS[cupName]) {
      const resetPos = CupStorageProperty.CUP_POSITIONS[cupName];
      this.t.setWorldPosition(resetPos);
      this.cupObject.enabled = true;

      // If we can modify the store, broadcast the reset (like ball broadcasts new position)
      if (this.syncEntity.currentStore && this.syncEntity.canIModifyStore()) {
        this.propPosition.putCurrentValue(this.syncEntity.currentStore);
        this.propEnabled.putCurrentValue(this.syncEntity.currentStore);
      }

      print("Cup " + cupName + " reset to: " + resetPos.toString());
    }
  }

  /**
   * Hide the cup (like ball disabling physics) - SYNCED EVENT
   */
  public hideCup(): void {
    if (!this.isSyncReady) {
      print("Cup sync not ready, cannot hide");
      return;
    }

    if (this.cupObject) {
      this.cupObject.enabled = false;

      // Broadcast the state change (like ball broadcasts physics changes)
      if (this.syncEntity.currentStore && this.syncEntity.canIModifyStore()) {
        this.propEnabled.putCurrentValue(this.syncEntity.currentStore);
      }

      print("Cup " + this.cupObject.name + " hidden");
    }
  }

  /**
   * Show the cup - SYNCED EVENT
   */
  public showCup(): void {
    if (!this.isSyncReady) {
      print("Cup sync not ready, cannot show");
      return;
    }

    if (this.cupObject) {
      this.cupObject.enabled = true;

      // Broadcast the state change
      if (this.syncEntity.currentStore && this.syncEntity.canIModifyStore()) {
        this.propEnabled.putCurrentValue(this.syncEntity.currentStore);
      }

      print("Cup " + this.cupObject.name + " shown");
    }
  }

  /**
   * Check if this cup is the authority (like checking if ball is owned by this client)
   */
  public isAuthority(): boolean {
    return this.isStoreOwner && this.isSyncReady;
  }

  /**
   * Check if sync is ready (like checking if ball physics is ready)
   */
  public isSyncInitialized(): boolean {
    return this.isSyncReady;
  }
}
