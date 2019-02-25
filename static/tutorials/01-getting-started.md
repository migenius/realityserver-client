These tutorials will take you through the steps of creating a basic RealityServer&reg; application. 

Two streams are provided, {@tutorial browser} and {@tutorial node}. Almost all concepts and API components are applicable across both environments so lessons in either stream are applicable to the other. The only exception to this is the {@link RS.Helpers.html_image_display} function which is typically only applicable in the browser as it depends on the DOM Image element. Additionally, render loops and streams are usually only used in the browser. There is however no technical reasn why they could not also be used in a Node.js script.

### Audience
These tutorials are aimed at developers who are knowlegable of ES6 JavaScript and wish to create a RealityServer&reg; rendering application. No prior knowledge of RealityServer&reg; is assumed although an understanding of how to configure CORS may be required if your RealityServer&reg; instance is running on a different machine to the one you are loading the tutorials on.
### Promise patterns
The API is promise based rather than using callbacks. In most cases these tutorials all use `async/await` patterns to manage promises however the `.then()/catch()` pattern work just as well.

---
|||
|:-|-:|
| |{@tutorial browser} >>>|