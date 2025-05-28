import { TennisBallBehavior } from "./TennisBallBehavior";
import { Grabbable } from "./Grabbable";
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import { SIK } from "SpectaclesInteractionKit.lspkg/SIK";
import { Buffer } from "Scripts/Utils/Buffer";
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";
import {
  InteractorInputType,
  Interactor,
} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor";
import { InteractableManipulation } from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation";

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
  private throwCount: number = 0; // Initialize to 0
  private hasHitCupThisThrow: boolean = false;
  private textObject: Text;
  private closeButton: Interactable;
  private closeButtonText: Text;
  private closeButtonObject: SceneObject;

  private readonly cupQuestions = {
    "cup v2": "What reality show do you think I am most likely to watch?",
    "cup v2 1": "What do you think I am most likely to splurge on?",
    "cup v2 2": "Do I seem like a morning person or a night owl?",
    "cup v2 3": "Do I remind you of anyone you know?",
    "cup v2 4":
      "What was something that brought a smile to your face this week?",
    "cup v2 5": "What's one thing you will never say no to?",
    "cup v2 6": "Has a stranger ever changed your life?",
    "cup v2 7": "When was the last time you surprised yourself?",
    "cup v2 8": "What title would you give this chapter of your life?",
    "cup v2 9": "What's the most unexplainable thing that has happened to you?",
    "cup v2 10": "What is the nicest thing a friend has done for you?",
    "cup v2 11": "What are you currently not giving enough time to?",
    "cup v2 12": "Admit something",
    "cup v2 13": "What parts of yourself do you see in me?",
    "cup v2 14": "How does one earn your vulnerability?",
    "cup v2 15": "What are you still trying to prove to yourself?",
    "cup v2 16":
      "What question are you trying to answer most in your life right now?",
    "cup v2 17":
      "What is something you wouldn't want to change about yourself?",
    "cup v2 18":
      "What's one thing you're proud of that you've never told anyone?",
    "cup v2 19": "What's a lesson you had to learn the hard way?",
  };

  private getQuestionForCup(cupName: string): string {
    return this.cupQuestions[cupName] || "Unknown cup!";
  }

  onAwake() {
    super.onAwake();
    print("Initial throw count: " + this.throwCount);

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
    this.originPoint2 = new vec3(-10, 10, -180);
    this.t.setWorldPosition(this.originPoint1);

    // Create a regeneration timer but don't start it yet
    this.regenerationTimer = this.createEvent("DelayedCallbackEvent");
    this.regenerationTimer.bind(this.regenerateBall.bind(this));

    // Create a text object
    const textSceneObject = global.scene.createSceneObject("Text");
    this.textObject = textSceneObject.createComponent("Text");

    // Set basic text properties
    this.textObject.text = ""; // Will be set when a cup is hit

    // Position the text in front of the camera
    const textTransform = textSceneObject.getTransform();
    textTransform.setWorldPosition(new vec3(0, 0, -105));

    // Create close button
    this.closeButtonObject = global.scene.createSceneObject("CloseButton");

    // Add Interactable component
    this.closeButton = this.closeButtonObject.createComponent(
      Interactable.getTypeName()
    );

    // Add text component to the close button
    this.closeButtonText = this.closeButtonObject.createComponent("Text");
    this.closeButtonText.text = "X";

    // Set up pinch detection for close button
    const handInputData = SIK.HandInputData;
    const rightHand = handInputData.getHand("right");

    // Create update event to check pinch state
    this.createEvent("UpdateEvent").bind(() => {
      if (rightHand.isPinching() && this.closeButton.enabled) {
        // Check if pinch is near the close button
        const buttonPos = this.closeButtonObject
          .getTransform()
          .getWorldPosition();
        const pinchPos = rightHand.indexTip.position;
        const distance = buttonPos.distance(pinchPos);

        if (distance < 5) {
          // 5 units threshold
          this.textObject.enabled = false;
          this.closeButton.enabled = false;
          this.closeButtonText.enabled = false;
        }
      }
    });

    // Position close button in top-right corner
    const closeButtonTransform = this.closeButtonObject.getTransform();
    closeButtonTransform.setLocalPosition(new vec3(6.5, 1.5, -50));

    this.textObject.enabled = false;
    this.closeButton.enabled = false;
    this.closeButtonText.enabled = false;
  }

  onUpdate() {
    // Only update buffers for synchronization when being interacted with
    if (this.isBeingInteracted) {
      this.positionBuffer.add(this.t.getWorldPosition());
      this.rotationBuffer.add(this.t.getWorldRotation());
      this.velocityBuffer.add(this.physicsBody.velocity);
    }
  }

  private regenerateBall() {
    // Alternate between origin points based on throw count
    this.physicsBody.enabled = true;
    this.hasHitCupThisThrow = false;

    // Switch origin points every 2 throws
    // Throws 1-2: use originPoint1
    // Throws 3-4: use originPoint2
    // Throws 5-6: use originPoint1
    // And so on...
    const targetOrigin =
      Math.floor(this.throwCount / 2) % 2 === 0
        ? this.originPoint1
        : this.originPoint2;

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
    this.throwCount++;
  }

  onTriggerStart(interactor: Interactor) {
    print("=== Trigger Start ===");
    print("Throw count at start: " + this.throwCount);

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
    this.hasHitCupThisThrow = false;

    // Keep physics enabled when released and apply hand velocity
    if (this.physicsBody) {
      this.physicsBody.dynamic = true;
      this.physicsBody.intangible = false;

      // Calculate the velocity to apply to the ball from the hand movement
      let baseVelocity = this.getHandVelocity();
      baseVelocity = baseVelocity.uniformScale(
        this.HAND_BASE_VELOCITY_MULTIPLIER * 0.5
      ); // Reduced multiplier

      // Set velocity directly instead of using forces
      this.physicsBody.velocity = baseVelocity;

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

  private animateCupRemoval(cupObject: SceneObject) {
    // Animation parameters
    const riseDuration = 1.0; // seconds for rise
    const dashDuration = 0.3; // seconds for dash
    const totalDuration = riseDuration + dashDuration;
    const riseHeight = 50; // units to rise
    const dashDistance = 200; // units to dash right
    const startTime = getTime();
    const startPosition = cupObject.getTransform().getWorldPosition();

    // Create update event for animation
    const animationEvent = this.createEvent("UpdateEvent");
    animationEvent.bind(() => {
      const elapsed = getTime() - startTime;

      if (elapsed < riseDuration) {
        // Phase 1: Rising up
        const riseProgress = elapsed / riseDuration;
        const easedProgress = 1 - Math.pow(1 - riseProgress, 3);

        const newPosition = new vec3(
          startPosition.x,
          startPosition.y + riseHeight * easedProgress,
          startPosition.z
        );
        cupObject.getTransform().setWorldPosition(newPosition);
      } else {
        // Phase 2: Dashing to the right
        const dashProgress = (elapsed - riseDuration) / dashDuration;
        const easedDashProgress = dashProgress * dashProgress; // Accelerating dash

        const newPosition = new vec3(
          startPosition.x + dashDistance * easedDashProgress,
          startPosition.y + riseHeight, // Stay at risen height
          startPosition.z
        );
        cupObject.getTransform().setWorldPosition(newPosition);

        // Check if animation is complete
        if (elapsed >= totalDuration) {
          // Remove the update event
          animationEvent.enabled = false;

          // Disable the cup object
          cupObject.enabled = false;

          // Get and display the question for this cup
          const question = this.getQuestionForCup(cupObject.name);
          this.textObject.text = question;
          this.textObject.enabled = true;
          this.closeButton.enabled = true;
          this.closeButtonText.enabled = true;
        }
      }
    });
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
        if (this.hasHitCupThisThrow) {
          print("Already hit a cup this throw, ignoring additional hits");
          return; // Exit early, don't process this hit
        }

        print("Ping pong ball hit liquid!");

        // Find the parent cup object (the one with the number in its name)
        let parentObject = hitSceneObject;
        while (parentObject && !parentObject.name.match(/cup v2 \d+/)) {
          print("Checking parent: " + parentObject.name);
          parentObject = parentObject.getParent();
        }

        if (parentObject) {
          // Mark that we've hit a cup this throw
          this.hasHitCupThisThrow = true;

          this.animateCupRemoval(parentObject);

          // Optionally disable the ball's physics to prevent further collisions
          if (this.physicsBody) {
            this.physicsBody.enabled = false;
          }

          // Regenerate the ball after a short delay
          this.regenerationTimer.reset(0.5);
          print("Found parent cup: " + parentObject.name);

          // Try all script components and call resetPosition if available
          const scripts = parentObject.getComponents("Component.Script");
          let found = false;
          for (let i = 0; i < scripts.length; i++) {
            print("Trying script component " + i);
            if (typeof scripts[i].resetPosition === "function") {
              print("Calling resetPosition on script component " + i);
              scripts[i].resetPosition();
              found = true;
            }
          }
          if (!found) {
            print(
              "Warning: CupStorageProperty.resetPosition not found on any script component for cup: " +
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
        }
      }
    });

    if (shouldPlayAudio) {
      this.audio.play(1);
    }
  }
}
