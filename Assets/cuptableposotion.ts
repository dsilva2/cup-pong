import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";

@component
export class TableCupPositioner extends BaseScriptComponent {

    onAwake() {
        // Position everything after a short delay to ensure proper initialization order
        const positionEvent = this.createEvent("DelayedCallbackEvent");
        positionEvent.bind(() => {
            this.positionTableAndCups();
            print("Table and cups positioned using hardcoded coordinates");
        });
        positionEvent.reset(0.1); // 100ms delay
    }

    private positionTableAndCups() {
        // Position the table at the correct hardcoded location
        this.positionTable();

        // Position all cups using their hardcoded coordinates  
        this.positionAllCups();
    }

    private positionTable() {
        // Find the table object (enabled one)
        const tableObjects = global.scene.getRootObjectsCount();
        for (let i = 0; i < tableObjects; i++) {
            const obj = global.scene.getRootObject(i);
            if (obj.name === "Table" && obj.enabled) {
                // Position table between the ball spawn points
                const tablePosition = new vec3(0, -89.317482, -106.391190);
                obj.getTransform().setWorldPosition(tablePosition);
                print("Table positioned at: " + tablePosition.toString());
                break;
            }
        }
    }

    private positionAllCups() {
        // Hardcoded cup positions (from CupStorageProperty)
        const cupPositions: { [key: string]: vec3 } = {
            "cup v2 0": new vec3(0.0, -48.087738, -187.163513),
            "cup v2 1": new vec3(0.0, -48.087738, -197.163513),
            "cup v2 2": new vec3(0.0, -48.087738, -177.163513),
            "cup v2 3": new vec3(0.0, -48.087738, -207.163513),
            "cup v2 4": new vec3(0.0, -48.087738, -167.163513),
            "cup v2 5": new vec3(-9.0, -48.087738, -182.163513),
            "cup v2 6": new vec3(-9.0, -48.087738, -172.163513),
            "cup v2 7": new vec3(-9.0, -48.087738, -192.755127),
            "cup v2 8": new vec3(9.0, -48.087738, -182.163513),
            "cup v2 9": new vec3(9.0, -48.087738, -192.163513),
            "cup v2 10": new vec3(-15.0, -25.0, -91.132706),
            "cup v2 11": new vec3(9.0, -48.087738, -202.163513),
            "cup v2 12": new vec3(-18.0, -48.087738, -187.163513),
            "cup v2 13": new vec3(9.0, -48.087738, -172.163513),
            "cup v2 14": new vec3(-18.0, -48.087738, -197.163513),
            "cup v2 15": new vec3(-9.0, -48.087738, -202.163513),
            "cup v2 16": new vec3(18.0, -48.087738, -197.163513),
            "cup v2 17": new vec3(18.0, -48.087738, -187.163513),
            "cup v2 18": new vec3(-18.0, -48.087738, -177.163513),
            "cup v2 19": new vec3(18.0, -48.087738, -177.163513),
        };

        // Find and position all cup objects
        this.findAndPositionCupObjects(cupPositions);
    }

    private findAndPositionCupObjects(cupPositions: { [key: string]: vec3 }) {
        // Search through all scene objects to find cups
        this.searchObjectsRecursively(global.scene, cupPositions);
    }

    private searchObjectsRecursively(sceneOrObject: any, cupPositions: { [key: string]: vec3 }) {
        let objectCount: number;

        // Handle Scene vs SceneObject
        if (sceneOrObject.getRootObjectsCount) {
            objectCount = sceneOrObject.getRootObjectsCount();
        } else if (sceneOrObject.getChildrenCount) {
            objectCount = sceneOrObject.getChildrenCount();
        } else {
            return;
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

            // Check if this is a cup we need to position
            if (cupPositions[obj.name]) {
                obj.getTransform().setWorldPosition(cupPositions[obj.name]);
                print("Positioned cup: " + obj.name + " at " + cupPositions[obj.name].toString());
            }

            // Recursively search children
            this.searchObjectsRecursively(obj, cupPositions);
        }
    }
} 