# ThrowLab

[![SIK](https://img.shields.io/badge/SIK-Light%20Gray?color=D3D3D3)](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-interaction-kit/features/overview?) [![Physics](https://img.shields.io/badge/Physics-Light%20Gray?color=D3D3D3)](https://developers.snap.com/lens-studio/features/physics/physics-overview?) [![Gesture Module](https://img.shields.io/badge/Gesture%20Module-Light%20Gray?color=D3D3D3)](https://developers.snap.com/spectacles/about-spectacles-features/apis/gesture-module?)

<!-- <img src="./README-ref/sample-list-throw-lab-rounded-edges.gif" alt="throw-lab" width="500" /> -->

## Overview

BRUNO combines the physical skill of beer pong with interactive AR technology to create an engaging multiplayer experience. Players stand around a virtual table, taking turns to throw ping pong balls at cups. Rather than pitting players against each other, this game strives to enhance social connection between the players and assist in developing deeper relationships. The game features:

- Realistic physics-based ball throwing mechanics
- Dynamic cup removal animations when hit
- Interactive questions and challenges that appear when cups are hit
- Turn-based gameplay that alternates between players
- Immersive AR experience that works in your physical space

The game uses hand tracking to allow players to naturally grab and throw the ping pong ball, with realistic physics simulation for accurate throws and bounces. Each successful cup hit triggers a satisfying animation and reveals a new question or challenge, keeping the gameplay fresh and engaging.

> **NOTE:**
> This project will only work for the Spectacles platform.

## Design Guidelines

Designing Lenses for Spectacles offers all-new possibilities to rethink user interaction with digital spaces and the physical world.
Get started using our [Design Guidelines](https://developers.snap.com/spectacles/best-practices/design-for-spectacles/introduction-to-spatial-design)

## Prerequisites

- **Lens Studio**: v5.9.0+
- **Spectacles OS Version**: v5.61.371+
- **Spectacles App iOS**: v0.61.1.0+
- **Spectacles App Android**: v0.61.1.1+

To update your Spectacles device and mobile app, refer to this [guide](https://support.spectacles.com/hc/en-us/articles/30214953982740-Updating).

You can download the latest version of Lens Studio from [here](https://ar.snap.com/download?lang=en-US).

## Hand Velocity API

This API gives an easy and reliable way of getting the velocity of hand joints as `vec3`s in world coordinate system.

The API can be used together with SIK:

```
   let handInputData = SIK.HandInputData;
   let hand = this.handInputData.getHand('right');
   let objectSpecificData = this.hand.objectTracking3D.objectSpecificData
   if (objectSpecificData) {
      let handVelocity = objectSpecificData['global'];
      let indexVelocity = objectSpecificData['index-3'];
   }
```

The following joints are available for the velocities: “index-3”, “mid-3”, “ring-3”, “pinky-3”, “thumb-3” and “global”.

## How It Works

1. **Hand Detection & Velocity Calculation**:  
   Lens Studio’s Hand Tracking system detects your hand. As you move, the Hand Velocity API provides the velocity of the relevant joints.

2. **Object Selection & Holding**  
   ThrowLab uses a pinch gesture provided by the Spectacles Interaction Kit (SIK) to allow the user to pinch the objects. When you pinch near an object, it attaches to your hand, simulating a pinched hold.

3. **Throwing Mechanics**:  
   While pinching and moving the object, the system continuously tracks acceleration, accumulating data over the time you hold it. When you release the pinch, the final throw velocity is a combination of:

   - The object’s accumulated acceleration during the hold.
   - The hand’s velocity at the moment of release.

   By blending these factors, you get a smoother, more realistic throwing motion that accounts for the object’s buildup of speed as you swing your hand.

4. **Cleanup**:  
   After the object finishes its flight (for example, when it hits the ground and stay still), it destroys itself after some time buffer to keep the scene clean.
