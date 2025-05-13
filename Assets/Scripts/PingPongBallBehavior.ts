import { Interactable } from "SpectaclesSyncKit/SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable";
import WorldCameraFinderProvider from "SpectaclesSyncKit/SpectaclesInteractionKit/Providers/CameraProvider/WorldCameraFinderProvider";
import { SIK } from "SpectaclesSyncKit/SpectaclesInteractionKit/SIK";
import { Buffer } from "Scripts/Utils/Buffer";
import { InteractorEvent } from "SpectaclesSyncKit/SpectaclesInteractionKit/Core/Interactor/InteractorEvent";
import { InteractorInputType } from "SpectaclesSyncKit/SpectaclesInteractionKit/Core/Interactor/Interactor";
import { TennisBallBehavior } from "./TennisBallBehavior";

@component
export class PingPongBallBehavior extends TennisBallBehavior {
  protected OBJECT_MASS = 0.02;
  protected HAND_ACCELERATION_MULTIPLIER = 0.08;
  protected HAND_BASE_VELOCITY_MULTIPLIER = 0.6;
  private originPoint: vec3;
  private distanceThreshold = 150; // Distance in units before regeneration

  onAwake() {
    this.audio.playbackMode = Audio.PlaybackMode.LowLatency;

    this.sceneObject.getComponent("MeshVisual").mainMaterial = this.sceneObject
      .getComponent("MeshVisual")
      .mainMaterial.clone();
    this.sceneObject.getComponent(
      "MeshVisual"
    ).mainMaterial.mainPass.mainColor = this.getRandomRainbowColor();

    this.physicsBody = this.sceneObject.getComponent("Physics.BodyComponent");
    this.physicsBody.mass = this.OBJECT_MASS;
    this.physicsBody.onCollisionEnter.add(this.onCollisionEnter.bind(this));

    this.interactable = this.sceneObject.getComponent(
      Interactable.getTypeName()
    );
    this.interactable.onTriggerStart(this.onTriggerStart.bind(this));
    this.interactable.onTriggerEnd(this.onTriggerEnd.bind(this));

    this.interactable.enabled = true;
    // this.interactableManipulation.enabled = true;

    this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));

    this.t = this.getTransform();
    this.originPoint = this.t.getWorldPosition();
  }

  onUpdate() {
    // Check if ball has strayed too far from origin
    const currentPos = this.t.getWorldPosition();
    const distanceFromOrigin = currentPos.distance(this.originPoint);

    if (distanceFromOrigin > this.distanceThreshold) {
      this.regenerateBall();
    }
  }

  private regenerateBall() {
    // Reset position to origin
    this.t.setWorldPosition(this.originPoint);

    // Reset physics and disable physics
    if (this.physicsBody) {
      this.physicsBody.velocity = new vec3(0, 0, 0);
      this.physicsBody.angularVelocity = new vec3(0, 0, 0);
      this.physicsBody.dynamic = false; // Disable physics
    }

    // Change color for visual feedback
    this.sceneObject.getComponent(
      "MeshVisual"
    ).mainMaterial.mainPass.mainColor = this.getRandomRainbowColor();
  }

  getRandomRainbowColor(): vec4 {
    // Define rainbow colors as vec4 (RGBA, with alpha = 1.0 for full opacity)
    const rainbowColors = [
      // new vec4(148 / 255, 0 / 255, 211 / 255, 1.0), // Violet
      // new vec4(75 / 255, 0 / 255, 130 / 255, 1.0), // Indigo
      new vec4(0 / 255, 191 / 255, 255 / 255, 1.0), // Blue
      // new vec4(0 / 255, 255 / 255, 0 / 255, 1.0), // Green
      // new vec4(255 / 255, 255 / 255, 0 / 255, 1.0), // Yellow
      // new vec4(255 / 255, 127 / 255, 0 / 255, 1.0), // Orange
      // new vec4(255 / 255, 0 / 255, 0 / 255, 1.0), // Red
    ];

    // Select a random index from the rainbow colors array
    const randomIndex = Math.floor(Math.random() * rainbowColors.length);

    // Return the selected random color
    return rainbowColors[randomIndex];
  }

  onTriggerEnd() {
    // Re-enable physics when the ball is released
    if (this.physicsBody) {
      this.physicsBody.dynamic = true; // Re-enable physics
    }
    super.onTriggerEnd();
  }
}
