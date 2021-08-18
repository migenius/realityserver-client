/******************************************************************************
 * Copyright 2010-2021 migenius pty ltd, Australia. All rights reserved.
 *****************************************************************************/

/**
 * The Command class that wraps the information needed to execute a
 * command. It consists of the command and and object containing it's
 * parameters.
 *
 * Commands are executed either directly on the Service via
 * {@link RS.Service#send_command}, {@link RS.Service#execute_command} or
 * in a {@link RS.CommandQueue} obtained from {@link RS.Service#queue_commands}.
 *
 * @memberof RS
 * @example
 * let c = new Command('import_scene',
 *              {
 *                  scene_name:'meyemii',
 *                  block:true,
 *                  filename: 'scenes/meyemII.mi'
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
 *
 */
class Command {
    /**
     * Creates a new Command. Takes a `name` and a set of `parameters`. Typically
     * once constructed commands are not modified.
     *
     * <b>Note</b>: Command parameters should consist of the following JavaScript types only:
     * <ul>
     * <li>String</li>
     * <li>Number</li>
     * <li>Boolean</li>
     * <li>Null</li>
     * <li>Array</li>
     * <li>ArrayBuffer</li>
     * </ul>
     *
     * Any other type provided will be interpreted as an Object and have it's
     * enumerable properties sent in a Map using <code>Object.keys(value).forEach()</code>.
     *
     * The provided parameter Object will be copied internally and any properties whose
     * values is `undefined` will be removed.
     *
     * This means if you are using some form of framework that modifies or extends core
     * JavaScript types, EG: MobX or Immutable.js, you need to ensure you convert these
     * to native JavaScript types before passing them as command parameters.
     *
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
        this.params = Object.assign({}, parameters);
        Object.keys(this.params).forEach(k => this.params[k] === undefined && delete this.params[k]);
    }
}

export default Command;
