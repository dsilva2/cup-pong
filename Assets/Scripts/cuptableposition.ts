import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";

@component
export class TableCupPositioner extends BaseScriptComponent {

    // Use the exact same origin points as the ball
    private originPoint1: vec3; // Player's end of table  
    private originPoint2: vec3; // Far end of table
    private centerPoint: vec3;  // Center between the two origins

    onAwake() {
        // Initialize origin points exactly like the ball does
        this.originPoint1 = new vec3(0, -20, -40);  // Player's end of table
        this.originPoint2 = new vec3(0, -20, -250); // Far end of table

        // Calculate center point between the two origins
        this.centerPoint = new vec3(
            (this.originPoint1.x + this.originPoint2.x) / 2,
            (this.originPoint1.y + this.originPoint2.y) / 2,
            (this.originPoint1.z + this.originPoint2.z) / 2
        );

        print("Table/Cup center point calculated: " + this.centerPoint.toString());

        // Position everything after the same delay as the ball to ensure PositionInitializer has completed
        const positionEvent = this.createEvent("DelayedCallbackEvent");
        positionEvent.bind(() => {
            this.positionTableAndCups();
            print("Table and cups positioned after world positioning completed");
        });
        positionEvent.reset(0.3); // Same 300ms delay as ball
    }

    private positionTableAndCups() {
        // Position table at center point, but lower on Y axis
        this.positionTable();

        // Position cups around the center point
        this.positionAllCups();
    }

    private positionTable() {
        // Position table at center point with adjusted Y for table height
        const tablePosition = new vec3(this.centerPoint.x, -89, this.centerPoint.z);

        // Find and position table using the same approach as ball
        const table = this.findTableObject();
        if (table) {
            table.getTransform().setWorldPosition(tablePosition);
            print("Table positioned at: " + tablePosition.toString());
        } else {
            print("Could not find table object");
        }
    }

    private findTableObject(): SceneObject | null {
        return this.searchForObjectRecursively(global.scene, "Table");
    }

    private positionAllCups() {
        // Position cups relative to center point, spread around table
        const cupPositions: { [key: string]: vec3 } = {
            // Far side cups (0-9) - positioned closer to originPoint2 
            "cup v2 0": new vec3(this.centerPoint.x, -48, this.originPoint2.z + 60),      // Towards far end
            "cup v2 1": new vec3(this.centerPoint.x, -48, this.originPoint2.z + 50),
            "cup v2 2": new vec3(this.centerPoint.x, -48, this.originPoint2.z + 70),
            "cup v2 3": new vec3(this.centerPoint.x, -48, this.originPoint2.z + 40),
            "cup v2 4": new vec3(this.centerPoint.x, -48, this.originPoint2.z + 80),
            "cup v2 5": new vec3(this.centerPoint.x - 9, -48, this.originPoint2.z + 65),
            "cup v2 6": new vec3(this.centerPoint.x - 9, -48, this.originPoint2.z + 75),
            "cup v2 7": new vec3(this.centerPoint.x - 9, -48, this.originPoint2.z + 55),
            "cup v2 8": new vec3(this.centerPoint.x + 9, -48, this.originPoint2.z + 65),
            "cup v2 9": new vec3(this.centerPoint.x + 9, -48, this.originPoint2.z + 55),

            // Near side cups (10-19) - positioned closer to originPoint1
            "cup v2 10": new vec3(this.centerPoint.x - 15, -25, this.originPoint1.z - 50), // Towards near end
            "cup v2 11": new vec3(this.centerPoint.x + 9, -48, this.originPoint1.z - 60),
            "cup v2 12": new vec3(this.centerPoint.x - 18, -48, this.originPoint1.z - 55),
            "cup v2 13": new vec3(this.centerPoint.x + 9, -48, this.originPoint1.z - 40),
            "cup v2 14": new vec3(this.centerPoint.x - 18, -48, this.originPoint1.z - 65),
            "cup v2 15": new vec3(this.centerPoint.x - 9, -48, this.originPoint1.z - 70),
            "cup v2 16": new vec3(this.centerPoint.x + 18, -48, this.originPoint1.z - 65),
            "cup v2 17": new vec3(this.centerPoint.x + 18, -48, this.originPoint1.z - 55),
            "cup v2 18": new vec3(this.centerPoint.x - 18, -48, this.originPoint1.z - 45),
            "cup v2 19": new vec3(this.centerPoint.x + 18, -48, this.originPoint1.z - 45),
        };

        // Position each cup using direct setWorldPosition like the ball does
        for (const [cupName, cupPos] of Object.entries(cupPositions)) {
            const cup = this.findCupObject(cupName);
            if (cup) {
                cup.getTransform().setWorldPosition(cupPos);
                print("Positioned " + cupName + " at: " + cupPos.toString());
            }
        }
    }

    private findCupObject(cupName: string): SceneObject | null {
        return this.searchForObjectRecursively(global.scene, cupName);
    }

    private searchForObjectRecursively(sceneOrObject: any, objectName: string): SceneObject | null {
        let objectCount: number;

        if (sceneOrObject.getRootObjectsCount) {
            objectCount = sceneOrObject.getRootObjectsCount();
        } else if (sceneOrObject.getChildrenCount) {
            objectCount = sceneOrObject.getChildrenCount();
        } else {
            return null;
        }

        for (let i = 0; i < objectCount; i++) {
            let obj: SceneObject;

            if (sceneOrObject.getRootObject) {
                obj = sceneOrObject.getRootObject(i);
            } else if (sceneOrObject.getChild) {
                obj = sceneOrObject.getChild(i);
            } else {
                continue;
            }

            // Check if this matches what we're looking for
            if (obj.name === objectName || (objectName === "Table" && obj.name.includes("Table"))) {
                return obj;
            }

            // Recursively search children
            const found = this.searchForObjectRecursively(obj, objectName);
            if (found) return found;
        }
        return null;
    }
} 