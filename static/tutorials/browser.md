This tutorial will take you step by steup through the process of creating a simple browser based application when renders a scene and allows simple interaction by dollying the camera back and forth.

The final application is available on GitHub at (http://github.com/migenius/browser-client-demo)

### Steps

1. {@tutorial browser-connecting}
2. {@tutorial browser-scene-loading}
3. {@tutorial browser-rendering}
4. {@tutorial browser-camera-moving}
5. {@tutorial browser-change-color}

### Configuring RealityServer&reg;
All the tutorials require a running RealityServer&reg; instance to connect to. The host and port of this is configured within the HTML of each tutorial and defaults to `localhost:8080`. If you are running RealityServer&reg; at a different location you will need to update these details accordingly. Note that if RealityServer&reg; is running on a different machine you will need to configure CORS on the server to allow access.

---
|||
|:-|-:|
|<<< {@tutorial 01-getting-started}|{@tutorial browser-connecting} >>>|