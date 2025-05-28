@component
export class CupScript extends BaseScriptComponent {
  /**
   * Assign the cup's own SceneObject here in the Inspector.
   * This script expects a SyncEntity component and a Storage Property (Boolean, name: isHidden) on the same object.
   */
  @input
  public cupObject: SceneObject;

  onAwake() {
    // Check visibility every frame (safe for multiplayer sync)
    this.createEvent("UpdateEvent").bind(this.syncVisibility.bind(this));
  }

  syncVisibility() {
    // Use 'as any' to avoid linter/type errors
    const storage = (this.sceneObject.getComponent as any)(
      "Component.Storage"
    ) as any;
    if (!storage || typeof storage.getBool !== "function") {
      return;
    }
    // Read the isHidden property (must match the Storage Property name in Inspector)
    const hidden = storage.getBool("isHidden");
    if (this.cupObject) {
      this.cupObject.enabled = !hidden;
    }
  }
}
