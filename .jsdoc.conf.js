'use strict';

module.exports = {

  "plugins": ["plugins/markdown"],
  "recurseDepth": 10,
  "source": {
    "include": [ "src" ],
    "exclude": [ "src/internal" ],
    "includePattern": ".+\\.js(doc|x)?$",
    "excludePattern": "(^|\\/|\\\\)_"
  },
  "sourceType": "module",
  "tags": {
    "allowUnknownTags": true,
    "dictionaries": [
      "jsdoc",
      "closure"
    ]
  },
  "templates": {
    "applicationName": "RealityServer&reg; Client",
    "cleverLinks": false,
    "monospaceLinks": false,
    "default": {
      "staticFiles": {
        "include": [
            "./static/docs/"
        ]
      }
    }
  },
  "opts": {
    "encoding": "utf8",
    "destination": "./docs/",
    "recurse": true,
    "template": "../pixi-jsdoc-template",
    "tutorials": "static/tutorials/out",
    "readme": "static/README.md"
  }
}
