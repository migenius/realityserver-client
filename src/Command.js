/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

/**
 * @file Command.js
 * This file defines the Command class.
 */

/**
 * @class Command
 * The %Command class that wraps the information needed to execute a 
 * command.
 */
   
/**
 * @ctor
 * Creates a %Command object.
 * @param name String The name of the NWS command.
 * @param params Object An associative array containing the command 
 * parameters.
 */
class Command {
	constructor(name, params)
	{
		this.name = name;
		this.params = params;
	    this.isCancelled = false;
	}

	/**
	 * @public String
	 * [read-only] The name of the RealityServer command.
	 */
	//name;

	/**
	 * @public Object
	 * [read-only] Command parameters specified as an associative array.
	 */
	//params;

	/**
	 * @public Boolean
	 * [read-only] This property is set to true if the
	 * command has been cancelled, in which case it will simply be 
	 * skipped by the service.
	 * <p>
	 * This property is set to true by the implementing class if the
	 * command has been cancelled, in which case it will simply be 
	 * skipped by the service. Note that commands are normally processed
	 * immediately after being added by a process commands callback at 
	 * which point this property does not have any effect. Most command 
	 * implementations should just return false, but there are special 
	 * cases, like render commands or other commands that return 
	 * binary data, where this mechanism can be of use. 
	 */
	//isCancelled;
}

module.exports = Command;