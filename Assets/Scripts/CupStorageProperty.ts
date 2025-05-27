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

  // Local variable for the hidden state
  private isHidden: boolean = false;

  // StorageProperty for syncing isHidden
  private propIsHidden = StorageProperty.autoBool(
    "isHidden",
    () => this.isHidden,
    (newValue) => {
      this.isHidden = newValue;
      this.updateVisibility();
    }
  );

  // StoragePropertySet for SyncEntity
  private storagePropertySet = new StoragePropertySet([this.propIsHidden]);

  // SyncEntity for multiplayer sync - CHANGED: removed auto-own
  private syncEntity: SyncEntity = new SyncEntity(
    this,
    this.storagePropertySet,
    true // Enable auto-ownership
  );

  onAwake(): void {
    // Set initial visibility
    this.updateVisibility();

    // Listen for ready event
    this.syncEntity.notifyOnReady(() => {
      print(
        "CupStorageProperty ready for: " +
          (this.cupObject ? this.cupObject.name : "(no cupObject)")
      );
      // Request ownership when ready
      this.syncEntity.requestOwnership();
    });
  }

  /**
   * Call this to hide or show the cup (will sync across all clients)
   */
  public setHidden(hidden: boolean) {
    print(
      "setHidden called. hidden: " +
        hidden +
        ", cup: " +
        (this.cupObject ? this.cupObject.name : "(no cupObject)")
    );

    // Request ownership before setting the value
    this.syncEntity.requestOwnership();

    // Assign to isHidden, rely on autoBool setter for updateVisibility and sync
    this.isHidden = hidden;
  }

  /**
   * Update the cup's visibility based on isHidden
   */
  private updateVisibility() {
    if (this.cupObject) {
      // Disable the cup object itself
      this.cupObject.enabled = !this.isHidden;

      // Safely disable child objects if they exist
      try {
        let child = this.cupObject.getChild(0);
        if (child) {
          // Only proceed if there's at least one child
          let index = 0;
          while (child) {
            child.enabled = !this.isHidden;
            index++;
            child = this.cupObject.getChild(index);
          }
        }
      } catch (error) {
        // print("No children to update for cup: " + this.cupObject.name);
      }

      print(
        `Updated visibility for cup ${this.cupObject.name}: enabled=${!this
          .isHidden}`
      );
    }
  }

  /**
   * Public getter to check if cup is hidden
   */
  public getIsHidden(): boolean {
    return this.isHidden;
  }
}
