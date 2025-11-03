import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { Scene, Object3D } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { saveFile } from '../../helpers/file';

/**
 * Manager for managing event display's export related functionality.
 */
export class ExportManager {
  /**
   * Exports scene to OBJ file format.
   * @param scene The scene to be exported.
   */
  public exportSceneToOBJ(scene: Scene) {
    // Instantiate a exporter
    const exporter = new OBJExporter();
    const result = exporter.parse(scene);
    saveFile(result, 'phoenix-obj.obj', 'text/plain');
  }

  /**
   * Exports scene as phoenix format, allowing to load it later and recover the saved configuration.
   * @param scene The scene to be exported.
   * @param eventData Currently loaded event data.
   * @param geometries Currently loaded geometries.
   */
  public exportPhoenixScene(
    scene: Scene,
    eventData: Object3D,
    geometries: Object3D,
  ) {
    const exporter = new GLTFExporter();

    const sceneConfig = this.saveSceneConfig(eventData, geometries);
    // Parse the input and generate the glTF output
    exporter.parse(
      scene,
      (result) => {
        const jsonResult = { sceneConfiguration: sceneConfig, scene: result };
        const output = JSON.stringify(jsonResult, null, 2);
        saveFile(output, 'phoenix-scene.phnx', 'text/plain');
      },
      null,
    );
  }

  /**
   * Save the configuration of the currently loaded scene including event data and geometries.
   * @param eventData Curently loaded event data.
   * @param geometries Currently loaded geometries.
   */
  private saveSceneConfig(eventData: Object3D, geometries: Object3D) {
    const eventDataConfig = this.saveEventDataConfiguration(eventData);
    const geometriesConfig = this.saveGeometriesConfiguration(geometries);
    const sceneConfig = {
      eventData: eventDataConfig,
      geometries: geometriesConfig,
    };
    return sceneConfig;
  }

  /**
   * Save the configuration of the currently loaded event data.
   * @param eventData Currently loaded event data.
   */
  private saveEventDataConfiguration(eventData: any) {
    const eventDataConfig = {};
    for (const objectType of eventData.children) {
      if (objectType.name) {
        eventDataConfig[objectType.name] = [];
        for (const collection of objectType.children) {
          if (collection.name) {
            eventDataConfig[objectType.name].push(collection.name);
          }
        }
      }
    }
    return eventDataConfig;
  }

  /**
   * Save the configuration of the currently loaded geometries.
   * @param geometries Currently loaded geometries.
   */
  private saveGeometriesConfiguration(geometries: Object3D) {
    const geometriesConfig = [];
    geometries.children.forEach((object) => {
      if (object.name !== 'EventData') {
        geometriesConfig.push(object.name);
      }
    });
    return geometriesConfig;
  }

  public exportGeometriesToGLTF(geometries: Object3D) {
    const exporter = new GLTFExporter();
    // Coverts array buffer to base64 strings
    function arrayBufferToBase64(buffer: ArrayBuffer): string {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    }

    exporter.parse(
      geometries,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const base64String = arrayBufferToBase64(result);
          saveFile(base64String, 'geometries.glb', 'application/octet-stream');
        } else {
          // For JSON GLTF (.gltf)
          const output = JSON.stringify(result, null, 2);
          saveFile(output, 'geometries.gltf', 'text/plain');
        }
      },
      (error: ErrorEvent) => {
        console.error('Error exporting geometries:', error);
      },
      {},
    );
  }
}
