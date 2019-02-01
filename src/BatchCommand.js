/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

/**
 * @file BatchCommand.js
 * This file defines the com.mi.rs.BatchCommand class.
 */

/**
 * @class BatchCommand
 * A batch command is a special
 * command that can have any number of sub-commands. The batch command 
 * is processed as a single command and gets only a single reply
 * from the server. The sub-commands can't have individual response 
 * handlers, but the Response class has helper methods that 
 * makes it easier to process the sub-command results of a batch 
 * command.
 * 
 * Batch commands can be nested, meaning that a batch command can
 * have sub-commands that are in turn batch commands and so on. 
 * Batch commands can not contain commands that return binary data 
 * such as the "render" command.
 */
   
/**
 * @ctor
 * Creates a %BatchCommand object.
 * @param continueOnError Controls error handling when an error occurs. 
 *   If true then sub-commands will continue to be processed, if false 
 *   processing will end at the first error and any subsequent commands 
 *   will be aborted and get error resposes. Defaults to false.
 */
class BatchCommand {
    constructor(continueOnError)
    {
    	this.name = "batch";
        this.isCancelled = false;
        this.continueOnError = continueOnError;
        if(this.continueOnError === null || this.continueOnError === undefined)
            this.continueOnError = true;

        this.params = {continue_on_error:this.continueOnError, commands:[]};
        
        this.commands = new Array();
    }

    /**
     * @public String
     * [read-only] The name of the RealityServer BatchCommand.
     */
    //name;

    /**
     * @public Object
     * [read-only] BatchCommand parameters specified as an associative array.
     */
    //params;

    /**
     * @public Boolean
     * [read-only] This property is set to true if the
     * BatchCommand has been cancelled, in which case it will simply be 
     * skipped by the service.
     * <p>
     * Note that commands can't generally be calcelled and that 
     * commands most often will be processed immediately after adding
     * them in a process commands callback at which point this property
     * won't have any effect. There are however special types of 
     * commands for which this mechanism can be useful, for instance to
     * avoid an obsolete render command to be processed.
     */
    //isCancelled;

    /**
     * @public Array
     * [read-only] Contains the commands added to this batch command. This 
     * array is read only. To add commands, use the addCommand method.
     */
    //commands;

    /**
     * @public Boolean
     * If true the batch command will continue processing
     * sub-commands even 
     * when a sub-command experience an error. If false, execution will stop
     * at the first error and any subsequent commands will get error 
     * responses.
     */
    //continueOnError;

    /**
     * Adds a command to the batch. Batch sub-commands will be processed
     * in the same order they are added and their responses can be 
     * accessed from the Response object passed to a response handler 
     * of the batch command itself.
     */
    addCommand(cmd)
    {
        this.commands.push(cmd);
        this.params.commands.push({name:cmd.name, params:cmd.params});
    }
}
module.exports = BatchCommand;