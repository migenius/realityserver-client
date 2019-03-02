const
  path = require('path'),
  fs = require('fs'),
  { Command, Command_error, Error: Rs_error, Utils, Service } = require('realityserver-client');

Service.websocket = require('websocket').w3cwebsocket;

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

function render_scene(scene_info, width, height, max_samples, filename) {
  return new Promise(async (resolve, reject) => {
    const camera = scene_info.camera;
    const options = scene_info.options;
    const user_scope_name = `scope_${Utils.create_random_string(8)}`;

    const [ image ] = await service.queue_commands()
      .queue(new Command('create_scope', { scope_name: user_scope_name, parent_scope: scene_info.scope_name }))
      .queue(new Command('use_scope', { scope_name: user_scope_name }))
      .queue(new Command('localize_element', { element_name: options }))
      .queue(new Command('localize_element', { element_name: camera }))
      .queue(new Command('camera_set_resolution', {
        camera_name: camera,
        resolution: {
          x: width,
          y: height
        }
      }))
      .queue(new Command('camera_set_aspect', {
        camera_name: camera,
        aspect: width / height
      }))
      .queue(new Command('element_set_attribute', {
        element_name: options,
        attribute_name: 'progressive_rendering_max_samples',
        attribute_value: max_samples,
        attribute_type: 'Sint32',
        create: true
      }))
      .queue(new Command('render',
        {
          scene_name: scene_info.scene_name,
          renderer: 'iray',
          format: path.extname(filename).slice(1),
          render_context_options: {
            scheduler_mode: {
              value: 'batch',
              type: 'String'
            }
          }
        }), true)
      .queue(new Command('delete_scope', { scope_name: user_scope_name }))
      .execute().catch(err => [ err ]);

    if (image instanceof Command_error) {
      reject(`render error: ${image.message}`);
      return;
    }
    if (image instanceof Rs_error) {
      reject(`render error: ${image.toString()}`);
      return;
    }

    if (!image.data) {
      reject('no rendered image');
      return;
    }
    fs.writeFile(filename, image.data, (err) => {
      if (err) {
        reject(`error writing file ${err.toString()}`);
      } else {
        resolve(`image saved to ${filename}`);
      }
    });
  });
}

async function load_and_render(argv) {
  const { host, port, ssl, scene_file, width, height, max_samples, filename } = argv;

  const url = `${(ssl ? 'wss://' : 'ws://')}${host}:${port}/service/`;

  console.log(`connecting to: ${url}`);

  try {
    await service.connect(url);
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

  console.log(`rendering at ${width}x${height} for ${max_samples} iterations`);

  try {
    scene_info.scene_name = 'myscene';
    scene_info.scope_name = scene_file;
    await render_scene(scene_info, width, height, max_samples, filename);
    console.log(`image saved to ${filename}`);
  } catch (err) {
    console.error(err);
  }
  service.close();
}
