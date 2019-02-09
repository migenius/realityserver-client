'use strict';

module.exports = {
  "plugins": ["plugins/markdown"],
  "recurseDepth": 10,
  "source": {
    "include": [ "src/index.js", "src/Math" ],
    "exclude": "src/Utils",
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
    "cleverLinks": false,
    "monospaceLinks": false
  },
  "opts": {
    "encoding": "utf8",
    "destination": "./docs/",
    "recurse": true
  }
}