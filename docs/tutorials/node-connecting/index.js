const
  path = require('path'),
  fs = require('fs'),
  { Command, Command_error, Error: Rs_error, Utils, Service } = require('@migenius/realityserver-client'),
  WebSocket = require('websocket').w3cwebsocket;

const service = new Service();

require('yargs')
  .demandCommand(7)
  .usage('$0 [--ssl] <host> <port> <scene_file> <width> <height> <max_samples> <filename>',
    'renders an image in RealityServer',
    yargs=>{
      yargs
        .positional('host', {
          describe: 'hostname to connect to',
          type: 'string'
        })
        .positional('port', {
          describe: 'port to connect to',
          type: 'number'
        })
        .positional('scene_file', {
          describe: 'scene filename to render',
          type: 'string'
        })
        .positional('width', {
          describe: 'image width to render',
          type: 'number'
        })
        .positional('height', {
          describe: 'image height to render',
          type: 'number'
        })
        .positional('max_samples', {
          describe: '# of samples to render',
          type: 'number'
        })
        .positional('filename', {
          describe: 'output filename, extension defines the file format',
          type: 'string'
        });
    }, load_and_render)
  .boolean('ssl')
  .default('ssl', false)
  .describe('ssl', 'if true connect using wss, otherwise ws')
  .help('h')
  .alias('h', 'help')
  .argv;

async function load_and_render(argv) {
  const { host, port, ssl, scene_file, width, height, max_samples, filename } = argv;

  const url = `${(ssl ? 'wss://' : 'ws://')}${host}:${port}/service/`;

  console.log(`connecting to: ${url}`);

  try {
    // The default configuration for the WebSocket module has settings unsuitable for use
    // with RealityServer. The RealityServer WebSocket server does not handle fragmented
    // messages well so we need to disable outgoing fragmentation. Additionally, it limits
    // incoming messages to 1MiB by default which can easily be exceeded when rendering
    // large images. Here we up the limit to 10MiB which should cover most situations.
    await service.connect(new WebSocket(url, undefined, undefined, undefined, undefined,
      {
        fragmentOutgoingMessages: false,
        maxReceivedFrameSize: 10485760,
        maxReceivedMessageSize: 10485760
      }
    ));
  } catch (err) {
    console.error(`Web Socket connection failed: ${err.toString()}`);
    return;
  }

  console.log('connected.');

  service.close();
}
