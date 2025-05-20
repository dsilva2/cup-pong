import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import { SIK } from "SpectaclesInteractionKit.lspkg/SIK";
import { Buffer } from "Scripts/Utils/Buffer";
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";
import {
  InteractorInputType,
  Interactor,
} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor";
import { TennisBallBehavior } from "./TennisBallBehavior";
import { Grabbable } from "./Grabbable";

@component
export class PingPongBallBehavior extends TennisBallBehavior {
  protected OBJECT_MASS = 0.02;
  protected HAND_ACCELERATION_MULTIPLIER = 5.08;
  protected HAND_BASE_VELOCITY_MULTIPLIER = 3.6;
  private originPoint1: vec3;
  private originPoint2: vec3;
  private distanceThreshold = 1000; // Distance in units before regeneration
  private regenerationTimer: DelayedCallbackEvent;
  private regenerationDelay = 2.0; // Time in seconds after release before regeneration
  private isBeingInteracted = false;
  private positionBuffer: Buffer = new Buffer(4);
  private rotationBuffer: Buffer = new Buffer(4);
  private velocityBuffer: Buffer = new Buffer(4);
  private throwCount: number = 0; // Track number of throws

  onAwake() {
    super.onAwake();

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

    // Set up interactable component
    this.interactable = this.sceneObject.getComponent(
      Interactable.getTypeName()
    );
    this.interactable.onTriggerStart(this.onTriggerStart.bind(this));
    this.interactable.onTriggerEnd(this.onTriggerEnd.bind(this));
    this.interactable.enabled = true;

    this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));

    this.t = this.getTransform();
    // Initialize origin points for each player
    this.originPoint1 = new vec3(20, 20, -20);
    this.originPoint2 = new vec3(-20, 20, -220);
    this.t.setWorldPosition(this.originPoint1);

    // Create a regeneration timer but don't start it yet
    this.regenerationTimer = this.createEvent("DelayedCallbackEvent");
    this.regenerationTimer.bind(this.regenerateBall.bind(this));
  }

  onUpdate() {
    // Check if ball has strayed too far from origin
    if (!this.isBeingInteracted) {
      const currentPos = this.t.getWorldPosition();
      const currentOrigin =
        Math.floor(this.throwCount / 2) % 2 === 0
          ? this.originPoint1
          : this.originPoint2;
      const distanceFromOrigin = currentPos.distance(currentOrigin);

      if (distanceFromOrigin > this.distanceThreshold) {
        this.regenerateBall();
      }
    }

    // Update buffers for synchronization
    if (this.isBeingInteracted) {
      this.positionBuffer.add(this.t.getWorldPosition());
      this.rotationBuffer.add(this.t.getWorldRotation());
      this.velocityBuffer.add(this.physicsBody.velocity);
    }
  }

  private regenerateBall() {
    // Alternate between origin points based on throw count
    const isEvenThrowSet = Math.floor(this.throwCount / 2) % 2 === 0;
    const targetOrigin = isEvenThrowSet ? this.originPoint1 : this.originPoint2;

    // Reset position to the appropriate origin point
    this.t.setWorldPosition(targetOrigin);

    // Reset physics and temporarily disable physics
    if (this.physicsBody) {
      this.physicsBody.velocity = new vec3(0, 0, 0);
      this.physicsBody.angularVelocity = new vec3(0, 0, 0);
      this.physicsBody.dynamic = false; // Disable physics until grabbed
    }

    // Change color for visual feedback
    this.sceneObject.getComponent(
      "MeshVisual"
    ).mainMaterial.mainPass.mainColor = this.getRandomRainbowColor();

    // Play audio when ball regenerates
    if (this.audio) {
      this.audio.play(1.0);
    }
  }

  onTriggerStart(interactor: Interactor) {
    // Set our interaction flag
    this.isBeingInteracted = true;

    // Reset timer
    this.regenerationTimer.reset(0);

    // Enable physics when grabbed
    if (this.physicsBody) {
      this.physicsBody.dynamic = true;
    }
    super.onTriggerStart(interactor);
  }

  onTriggerEnd() {
    this.isBeingInteracted = false;

    // Keep physics enabled when released and apply hand velocity
    if (this.physicsBody) {
      this.physicsBody.dynamic = true;
      this.physicsBody.intangible = false;

      // Calculate the velocity to apply to the ball from the hand movement
      let baseVelocity = this.getHandVelocity();
      print("Base velocity before scaling: " + baseVelocity.toString());

      baseVelocity = baseVelocity.uniformScale(
        this.HAND_BASE_VELOCITY_MULTIPLIER * 0.5
      ); // Reduced multiplier
      print("Base velocity after scaling: " + baseVelocity.toString());

      // Set velocity directly instead of using forces
      this.physicsBody.velocity = baseVelocity;
      print("Set velocity: " + baseVelocity.toString());

      // Increment throw count
      this.throwCount++;

      // Regenerate the ball after a delay
      this.regenerationTimer.reset(this.regenerationDelay);
    }
    super.onTriggerEnd();
  }

  getRandomRainbowColor(): vec4 {
    // Define rainbow colors as vec4 (RGBA, with alpha = 1.0 for full opacity)
    const rainbowColors = [
      new vec4(0 / 255, 191 / 255, 255 / 255, 1.0), // Blue
    ];

    // Select a random index from the rainbow colors array
    const randomIndex = Math.floor(Math.random() * rainbowColors.length);

    // Return the selected random color
    return rainbowColors[randomIndex];
  }
}
