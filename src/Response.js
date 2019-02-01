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
 * 
 * Batch commands has complex responses containing the responses of 
 * all the batch sub-commands. To make parsing eaiser there are several
 * batch command specific methods added to this interface. The result 
 * object will contain all the information needed, but the  
 * subResponses array contains all the sub-responses as Response 
 * objects. Note that sub-responses can also be responses to nested 
 * batch commands.
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
        
        if( (!this.isErrorResponse) && (this.result) && (command.addCommand != undefined) && (command.continueOnError != undefined) && ( command.commands instanceof Array))
        {
            var responses = this.result.responses;
            var subErrors = this.result.has_sub_error_response;
        
            // Check the type of the result
            if( (!(responses instanceof Array)) || (subErrors == undefined))
                throw new String("Failed to create batch response. Batch response result not of expected type.");
        
            this.isBatchResponse = true;

            // Sanity check, the commands array and the responses array should 
            // have the same size!
            if(!responses.length == command.commands.length)
                throw new String("Failed to create sub-responses for batch command. The nr of sub-commands did not match the number of sub-responses.");
            
            // Create sub-responses
            var subcommands = command.commands;
            this.subResponses = [];
            var len = subcommands.length;
            for(var i=0; i<len; i++)
            {
                this.subResponses.push(new Response(subcommands[i], responses[i]));
            }

            this.hasSubErrorResponse = subErrors;
        }
        else
        {
            this.isBatchResponse = false;
            this.subResponses = null;
            this.hasSubErrorResponse = false;
        }
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
     * @public Boolean.
     * True if this is the response to a batch command. If true then 
     * the batch specific methods can be used to easier parse the 
     * sub-responses of the batch command.
     */
    //isBatchResponse;

    /**
     * @public Array 
     * if isBatchResponse is true, then this array contains objects of 
     * type Response for all the sub-commands. sub-responses are 
     * in the same order as the sub-commands were added to the original
     * batch request.
     */
    //subResponses;

    /**
     * @public Boolean.
     * Returns true if any of the sub-responses is an error response. 
     * This function also takes sub-responses of nested batch commands
     * into account. Note that the Response.error property only say
     * if the batch command itself succedded or not, it does not say 
     * anything about the individual sub-commands. Each sub-command needs
     * to be inspected, and this is a convenience method to determine if
     * error handling is needed or not for the sub-responses.
     */
    //hasSubErrorResponse;

    /**
     * @private Object
     * The raw response object returned by the server.
     */
    //serverResponse;
}

module.exports = Response;