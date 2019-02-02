/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/

/**
 * @file Response.js
 * This file defines the Response class.
 */
 
/**
 * @class Response
 * Defines the interface of a command response object. This interface
 * is used by RSService in calls to command response handlers. it 
 * gives access to all the data available in a response to a 
 * RealityServer command.
 */
   
/**
 * @ctor
 * Creates an %Response object.
 * @param command Command The %command object that triggered this response.
 * @param serverResponse Object The response object as sent by the server.
 */
class Response {
    constructor(command, serverResponse)
    {
        this.command = command;
        this.serverResponse = serverResponse;
        
        if(serverResponse.result == null)
            this.result = null;
        else
            this.result = serverResponse.result;
            
        this.isErrorResponse = (serverResponse.error != null && serverResponse.error.code != 0);
        
        if(this.isErrorResponse == false)
            this.error = null;
        else
            this.error = serverResponse.error;
 
    }

    /**
     * @public com::mi::rs::Command
     * Returns the command this is the response to. 
     */
    //command;

    /**
     * @public Object.
     * The result data structure that was returned by the RealityServer
     * command. The result will be null if the command experienced an 
     * error. Commands not returning a value will have an empty object 
     * as result. 
     */
    //result;

    /**
     * @public Boolean.
     * Convenience property that is true if this is an error response.
     * In this case Response.result will be null and Response.error 
     * be set to an object containing more information 
     * about the error. 
     */
    //isErrorResponse;

    /**
     * @public Object.
     * Contains information about the error, or null if no error occured. If
     * the error is defined, it will always have a string "message" property 
     * with a short description about the error, and a "code" integer property
     * that identifies the error.
     */
    //error;

    /**
     * @private Object
     * The raw response object returned by the server.
     */
    //serverResponse;
}

module.exports = Response;