/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * The Command class that wraps the information needed to execute a
 * command. It consists of the command and and object containing it's
 * parameters.
 *
 * Commands are executed either directly on the Service via
 * {@link RS.Service#send_command}, {@link RS.Service#execute_command} or
 * in a {@link RS.CommandQueue} obtained from {@link RS.Service#queue_commands}.
 * @memberof RS
 * @example
 * let c = new Command('import_scene',
 *              {
 *                  scene_name:'meyemii',
 *                  block:true,
 *                  filename: 'scenes/meyemii.mi'
 *              });
 * c = new Command('render',
 *              {
 *                  scene_name:'meyemii',
 *                  renderer:'iray',
 *                  format: 'png',
 *                  render_context_options: {
 *                      scheduler_mode: {
 *                          value: 'batch',
 *                          type: 'String'
 *                      }
 *                  }
 *              });
 */
class Command {
    /**
     * Creates a new Command. Takes a `name` and a set of `parameters`. Typically
     * once constructed commands are not modified.
     * @param {String} name - the command name to execute.
     * @param {Object} parameters - the command parameters.
     */
    constructor(name, parameters) {
        /**
         * The command name
         * @member {String}
         */
        this.name = name;
        /**
         * The command parameters. Object keys are the parameter names
         * and values are their values.
         * @member {Object}
         */
        this.params = parameters;
    }
}

module.exports = Command;
