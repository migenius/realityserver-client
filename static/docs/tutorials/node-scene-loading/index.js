const
  path = require('path'),
  fs = require('fs'),
  { Command, Command_error, Error: Rs_error, Utils, Service } = require('realityserver-client'),
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
    await service.connect(new WebSocket(url));
  } catch (err) {
    console.error(`Web Socket connection failed: ${err.toString()}`);
    return;
  }
  console.log('connected.');

  console.log(`loading scene: ${scene_file}`);

  const [ scene_info ] = await service.queue_commands()
    .queue(new Command('create_scope', { scope_name: scene_file }))
    .queue(new Command('use_scope', { scope_name: scene_file }))
    .queue(
      new Command('import_scene',
        {
          scene_name: 'myscene',
          block: true,
          filename: scene_file
        }), true)
    .execute().catch(err => [ err ]);

  if (scene_info instanceof Command_error) {
    console.error(`scene load failed: ${scene_info.message}`);
    service.close();
    return;
  }

  if (scene_info instanceof Rs_error) {
    console.error('Service error loading scene: ' + scene_info.toString());
    service.close();
    return;
  }

  console.log('scene loaded.');

  service.close();
}
