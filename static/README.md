# RealityServer&reg; Client API
The RealityServer Client API is a lightweight, modern JavaScript client library to connect to and render using [migenius's](https://migenius.com "migenius") [RealityServer](https://www.migenius.com/products/realityserver "RealityServer")®.

## Supported Environments
The API supports any JavaScript ES6 environment that provides a [W3C WebSocket API](https://www.w3.org/TR/websockets/ "W3C WebSocket API") implementation. This includes all evergreen desktop browsers, most mobile browsers and Node.js >= 6.5 (with an appropriate WebSocket module like [websocket](https://www.npmjs.com/package/websocket "websocket")). The most notable exclusion is IE 11 which supports WebSockets but not ES6. If you need support for IE 11 it is recommended to transpile the API down to ES5.

RealityServer&reg; 5.2 2272.266 or later is required.

## Installation
For native browser usage download via CDN:
```html
<script src='https://unpkg.com/@migenius/realityserver-client@1.0.10'></script>
```
or unminified
```html
<script src='https://unpkg.com/@migenius/realityserver-client@1.0.10/lib/umd/realityserver.js'></script> 
```
Although for mission critical deployments it is recommended you serve the client API yourself. 

For Node.js and bundlers simply install the modue:
```shell
$ npm install @migenius/realityserver-client
```
## Next steps

See the {@tutorial 01-getting-started} tutorial to get connected and start rendering. API documentations begins with the {@link RS.Service} class which provides the main entry point into the API. The {@tutorial 02-concepts} tutorial covers some basic RealitServer&reg; concepts and {@tutorial 03-migrating} provides information on migrating legacy code to the new API.

Note that this documentation should be read in conjuction with the [RealityServer&reg; documentation](https://rsdoc.migenius.com "RealityServer&reg; documentation").

## GitHub
The RealityServer&reg; Client repository can be found on [GitHub](https://github.com/migenius/realityserver-client "RealityServer Client").

## Sample applications

- [A simple rendering demo with camera dolly and material changing](http://github.com/migenius/realityserver-client-tutorial "Simple demo")

- [React/mobx implementation of the render loop demo](http://github.com/migenius/render-loop-react-mobx "React/MobX demo")

- [Simple Node.js render script](https://github.com/migenius/realityserver-client-node-tutorial "Node render script")

## Extras
A [RealityServer Extras](https://github.com/migenius/realityserver-extras "RealityServer Extras") add-on package is available to assist in manipulating scene elements.
