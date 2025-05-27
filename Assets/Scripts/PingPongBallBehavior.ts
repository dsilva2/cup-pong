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

  // @input displayText: SceneObject;

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
    this.originPoint1 = new vec3(10, 10, -20);
    this.originPoint2 = new vec3(-10, 10, -20);
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
      // print("Base velocity before scaling: " + baseVelocity.toString());

      baseVelocity = baseVelocity.uniformScale(
        this.HAND_BASE_VELOCITY_MULTIPLIER * 0.5
      ); // Reduced multiplier
      // print("Base velocity after scaling: " + baseVelocity.toString());

      // Set velocity directly instead of using forces
      this.physicsBody.velocity = baseVelocity;
      // print("Set velocity: " + baseVelocity.toString());

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

  onCollisionEnter(e) {
    let collision = e.collision;
    let shouldPlayAudio = false;

    // Used to determine the closest collision contact point to the world camera.
    let closestHit = null;
    let wCamera = WorldCameraFinderProvider.getInstance().getWorldPosition();
    let hitObject: SceneObject = null;

    e.collision.contacts.forEach((contact) => {
      // Update closest collision point for reference if none is set,
      // or if this contact is closer to the camera.
      if (closestHit == null) {
        hitObject = collision.collider.getSceneObject();
        closestHit = contact.position;
      } else {
        if (contact.position.distance(wCamera) < closestHit.distance(wCamera)) {
          closestHit = contact.position;
          hitObject = collision.collider.getSceneObject();
        }
      }

      // Print collision with any object
      const hitSceneObject = collision.collider.getSceneObject();
      print("Ping pong ball hit: " + hitSceneObject.name);
      print("hit scene object" + JSON.stringify(hitSceneObject));

      // Check if we hit liquid
      if (
        hitSceneObject.name.toLowerCase().indexOf("liquid") >= 0 ||
        hitSceneObject.name.toLowerCase().indexOf("water") >= 0
      ) {
        print("Ping pong ball hit liquid!");
        print("Hit object name: " + hitSceneObject.name);

        // Find the parent cup object (the one with the number in its name)
        let parentObject = hitSceneObject;
        while (parentObject && !parentObject.name.match(/cup v2 \d+/)) {
          print("Checking parent: " + parentObject.name);
          parentObject = parentObject.getParent();
        }

        if (parentObject) {
          print("Found parent cup: " + parentObject.name);

          // Try all script components and call setHidden if available
          const scripts = parentObject.getComponents("Component.Script");
          let found = false;
          for (let i = 0; i < scripts.length; i++) {
            print("Trying script component " + i);
            if (typeof scripts[i].setHidden === "function") {
              print("Calling setHidden on script component " + i);
              scripts[i].setHidden(true);
              found = true;
            }
          }
          if (!found) {
            print(
              "Warning: CupStorageProperty.setHidden not found on any script component for cup: " +
                parentObject.name +
                ". Please make sure the CupStorageProperty component is attached to the cup in the Inspector."
            );
          }
        } else {
          print("Warning: Could not find parent cup object");
        }
      }

      // If we hit something that isn't another ball and the collision impulse is big enough,
      // we play a sound.
      if (
        collision.collider.getSceneObject().name.indexOf("Ball") < 0 &&
        contact.impulse > 0.1
      ) {
        shouldPlayAudio = true;
      }

      // Handle cylinder/cup collision
      if (hitSceneObject.name.indexOf("cup") >= 0) {
        // Find the parent cup object (the one with the number in its name)
        let parentObject = hitSceneObject;
        while (parentObject && !parentObject.name.match(/cup v2 \d+/)) {
          parentObject = parentObject.getParent();
        }

        if (parentObject) {
          const message = "Hit cup: " + parentObject.name;
          print(message);
          // if (this.displayText) {
          //   const textComponent = this.displayText.getComponent("Text");
          //   if (textComponent) {
          //     textComponent.text = message;
          //     textComponent.enabled = true;

          //     // Hide the text after 2 seconds
          //     const hideEvent = this.createEvent("DelayedCallbackEvent");
          //     hideEvent.bind(() => {
          //       textComponent.enabled = false;
          //     });
          //     hideEvent.reset(2.0);
          //   }
          // }
        }
      }
    });

    if (shouldPlayAudio) {
      this.audio.play(1);
    }
  }
}
