/*!
 * easyEWS JavaScript Library v1.0.10
 * http://theofficecontext.com
 *
 * Copyright David E. Craig and other contributors
 * Released under the MIT license
 * https://tldrlegal.com/license/mit-license
 *
 * Date: 2018-03-09T09:27PST
 */
 /**
 * The global easyEws object 
 * @type {__nonInstanceEasyEwsClass} 
 * */
var easyEws =  new __nonInstanceEasyEwsClass();
/**
 * @class
 */
function __nonInstanceEasyEwsClass() {

    /** @type {string[]} */
    var groups = [];
    /** @type {string[]} */
    var processedGroups = []; 
    /** @type {MailBoxUser[]} */
    var users = [];
    /** @type {successCallbackMailboxUserArray} */
    var splitGroupSuccessCallback;
    /** @type {errorCallback} */
    var splitGroupErrorCallback;
    /** @type {debugCallback} */
    var splitGroupDebugCallback;
    /** @type {number} */
    var groupLevels = 0;

/***********************************************************************************************
 ***********************************************************************************************
 ***********************************************************************************************
                                ****  *   * ****  *     *****  ***                                  
                                *   * *   * *   * *       *   *   *                                 
                                ****  *   * ****  *       *   *                                     
                                *     *   * *   * *       *   *   *                                 
                                *      ***  ****  ***** *****  ***                                  
***********************************************************************************************
***********************************************************************************************
***********************************************************************************************/
    /**
     * PUBLIC: creates a new emails message with a single attachment and sends it
     * 
     * @param {string} subject - The subject for the message to be sent
     * @param {string} body - The body of the message to be sent
     * @param {string} to - The email address of the recipient
     * @param {string} attachmentName - Name of the attachment
     * @param {string} attachmentMime - MIME content in Base64 for the attachment
     * @param {successCallback} successCallback - Callback with 'success' if compelted successfully - function(string) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(string) { }
     * @param {debugCallback} debugCallback - Debug handler returns raw XML - function(string) { }
     */
    this.sendPlainTextEmailWithAttachment = function (subject, body, to, attachmentName, attachmentMime, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap = '<m:CreateItem MessageDisposition="SendAndSaveCopy">' +
                    '    <m:Items>' +
                    '        <t:Message>' +
                    '            <t:Subject>' + subject + '</t:Subject>' +
                    '            <t:Body BodyType="Text">' + body + '</t:Body>' +
                    '            <t:Attachments>' +
                    '                <t:ItemAttachment>' +
                    '                    <t:Name>' + attachmentName + '</t:Name>' +
                    '                    <t:IsInline>false</t:IsInline>' +
                    '                    <t:Message>' +
                    '                        <t:MimeContent CharacterSet="UTF-8">' + attachmentMime + '</t:MimeContent>' +
                    '                    </t:Message>' +
                    '                </t:ItemAttachment>' +
                    '            </t:Attachments>' +
                    '            <t:ToRecipients><t:Mailbox><t:EmailAddress>' + to + '</t:EmailAddress></t:Mailbox></t:ToRecipients>' +
                    '        </t:Message>' +
                    '    </m:Items>' +
                    '</m:CreateItem>';

        soap = getSoapHeader(soap);
        // make the EWS call 
        asyncEws(soap, function (xmlDoc) {
            // Get the required response, and if it's NoError then all has succeeded, so tell the user.
            // Otherwise, tell them what the problem was. (E.G. Recipient email addresses might have been
            // entered incorrectly --- try it and see for yourself what happens!!)
            /** @type {string} */
            var elem = xmlDoc.getElementsByTagName("m:ResponseCode")[0];
            if(elem == null) elem = xmlDoc.getElementsByTagName("ResponseCode")[0];
            var result = elem.textContent;
            if (result == "NoError") {
                successCallback(result);
            }
            else {
                if (errorCallback != null)
                    errorCallback(result);
            }
        }, function (errorDetails) {
            if (errorCallback != null)
                errorCallback(errorDetails);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC: gets the mail item as raw MIME data
     * 
     * @param {string} mailItemId - The id for the item
     * @param {successCallback} successCallback - Callback with email message as MIME Base64 string - function(string) { } 
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {debugCallback} debugCallback - Debug handler returns raw XML - function(String) { }
     */
    this.getMailItemMimeContent = function (mailItemId, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap =
            '<m:GetItem>' +
            '    <m:ItemShape>' +
            '        <t:BaseShape>IdOnly</t:BaseShape>' +
            '        <t:IncludeMimeContent>true</t:IncludeMimeContent>' +
            '    </m:ItemShape>' +
            '    <m:ItemIds>' +
            '        <t:ItemId Id="' + mailItemId + '"/>' +
            '    </m:ItemIds>' +
            '</m:GetItem>';
        soap = getSoapHeader(soap);
        // make the EWS call 
        asyncEws(soap, function (xmlDoc) {
            /** @type {array} */
            var nodes = getNodes(xmlDoc,"t:MimeContent");
            /** @type {string} */
            var content = nodes[0].textContent;
            successCallback(content);
        }, function (errorDetails) {
            if (errorCallback != null)
                errorCallback(errorDetails);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC: Updates the headers in the mail item
     * SEE: https://msdn.microsoft.com/en-us/library/office/dn596091(v=exchg.150).aspx
     * SEE: https://msdn.microsoft.com/en-us/library/office/dn495610(v=exchg.150).aspx
     * 
     * @param {string} mailItemId - The id of the item to update
     * @param {string} headerName - The header item to add/update
     * @param {string} headerValue - The header value to update
     * @param {boolean} [isMeeting] - is required to be true for meeting requests
     * @param {successCallback} [successCallback] - returns 'succeeeded' is successful - function(String) { }
     * @param {errorCallback} [errorCallback] - Error handler callback - function(Error) { }
     * @param {debugCallback} [debugCallback] - Debug handler returns raw XML - function(String) { }
     */
    this.updateEwsHeader = function (mailItemId, headerName, headerValue, isMeeting,
                                     successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var firstLine = '<m:UpdateItem MessageDisposition="SaveOnly" ConflictResolution="AlwaysOverwrite">';
        if(isMeeting){
            firstLine = '<m:UpdateItem MessageDisposition="SaveOnly" ConflictResolution="AlwaysOverwrite" SendMeetingInvitationsOrCancellations="SendOnlyToChanged">';
        }
        /** @type {string} */
        var soap =
            firstLine +
            '   <m:ItemChanges>' +
            '       <t:ItemChange>' +
            '           <t:ItemId Id="' + mailItemId + '"/>' +
            '           <t:Updates>' +
            '               <t:SetItemField>' +
            '                   <t:ExtendedFieldURI DistinguishedPropertySetId="InternetHeaders"' +
            '                                       PropertyName="' + headerName + '"' +
            '                                       PropertyType="String" />' +
            '                   <t:Message>' +
            '                       <t:ExtendedProperty>' +
            '                           <t:ExtendedFieldURI DistinguishedPropertySetId="InternetHeaders"' +
            '                                               PropertyName="' + headerName + '"' +
            '                                               PropertyType="String" />' +
            '                               <t:Value>' + headerValue + '</t:Value>' +
            '                           </t:ExtendedProperty>' +
            '                   </t:Message>' +
            '               </t:SetItemField>' +
            '           </t:Updates>' +
            '       </t:ItemChange>' +
            '   </m:ItemChanges>' +
            '</m:UpdateItem>';
        soap = getSoapHeader(soap);
        // make the EWS call
        asyncEws(soap, function (xmlDoc) {
            if (successCallback)
                successCallback("succeeded");
        }, function (errorDetails) {
            if (errorCallback != null)
                errorCallback(errorDetails);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC:  Returns a list of items in the folder
     * 
     * @param {string} folderId - The ID of the folder you want to search
     * @param {successCallbackArray} successCallback - Callback with array of item IDs - function(String[]) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {errorCallback} errorCallback - Debug handler returns raw XML - function(String) { }
     */
    this.getFolderItemIds = function (folderId, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap =
            '<m:FindItem Traversal="Shallow">' +
            '   <m:ItemShape> ' +
            '       <t:BaseShape>IdOnly</t:BaseShape>' +
            '   </m:ItemShape>' +
            '   <m:ParentFolderIds>' +
            '       <t:FolderId Id="' + folderId + '"/>' +
            '   </m:ParentFolderIds>' +
            '</m:FindItem>';

        /** @type {array} */
        var returnArray = [];

        soap = getSoapHeader(soap);

        // call ews
        asyncEws(soap, function (xmlDoc) {
            /** @type {array} */
            var nodes = getNodes(xmlDoc, "t:ItemId");
            // loop through and return an array of ids
            $.each(nodes, function (index, value) {
                returnArray.push(value.getAttribute("Id"));
            });
            successCallback(returnArray);
        }, function (errorDetails) {
            if (errorCallback != null) {
                errorCallback(errorDetails);
            }
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC:  Gets the item details for a specific item by ID
     * 
     * @param {string} itemId The ID for the item
     * @param {successCallbackMailItem} successCallback - Callback with the details of the MailItem - function(MailItem) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {debugCallback} debugCallback - Debug handler returns raw XML - function(String) { }
     */
    this.getMailItem = function (itemId, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap =
            '<m:GetItem>' +
            '   <m:ItemShape>' +
            '       <t:BaseShape>Default</t:BaseShape>' +
            '       <t:IncludeMimeContent>true</t:IncludeMimeContent>' +
            '   </m:ItemShape>' +
            '   <m:ItemIds>' +
            '       <t:ItemId Id="' + itemId + '" />' +
            '   </m:ItemIds>' +
            '</m:GetItem>';
        soap = getSoapHeader(soap);
        // make call to EWS
        asyncEws(soap, function (xmlDoc) {
            /** @type {MailItem} */
            var item = new MailItem(xmlDoc);
            successCallback(item);
        }, function (errorDetails) {
            if(errorCallback != null) {
                errorCallback(errorDetails);
            }
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };

    /**
     * PUBLIC:      Splits groups and groups in groups, async, until all users are
     *              found and added to the list. The list of MailBoxUsers[] is
     *              returned as a paramater of the success callback.
     * NOTE:        For performance reasons, this will STOP splitting groups after 10
     *              levels deeps. If groups nesting is greater than this it is bad design
     *              on the Exchange organization
     * @param {string[]} groupList The alias for the group(s) to be split
     * @param {successCallbackMailboxUserArray} sucessCallback Callback with array of MailBoxUsers - function(MailBoxUser[]) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {debugCallback} debugCallback - Debug handler returns raw XML - function(String) { }
     */
    this.splitGroupsAsync = function(groupList, successCallback, errorCallback, debugCallback) {
        // cleanup - reset arrays
        groups = [];
        users = [];
        processedGroups = [];
        groupLevels = 0;
        // add the current groups
        groups.push(groupList);
        // set callbacks
        splitGroupSuccessCallback = successCallback;
        splitGroupErrorCallback = errorCallback;
        splitGroupDebugCallback = debugCallback;
        // now start...
        splitGroupsRecursivelyAsync();
    };

    /**
     * PUBLIC:      Expands a group and returns all the members
     * NOTE:        Does not enumerate groups in groups
     * 
     * @param {string} group The alias for the group to be expanded
     * @param {successCallbackMailboxUserArray} successCallback - Callback with array of MailBoxUsers - function(MailBoxUser[]) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {errorCallback} errorCallback - Debug handler returns raw XML - function(String) { }
     */
    this.expandGroup = function (group, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap =
            '<m:ExpandDL>' +
            '    <m:Mailbox>' +
            '        <t:EmailAddress>' + group + '</t:EmailAddress>' +
            '    </m:Mailbox>' +
            '</m:ExpandDL>';
        soap = getSoapHeader(soap);
        // make the EWS call
        /** @type {array} */
        var returnArray = [];
        asyncEws(soap, function (xmlDoc) {
            /** @type {array} */
            var extendedProps = getNodes(xmlDoc, "t:Mailbox");
            // loop through and return an array of properties
            $.each(extendedProps, function (index, value) {
                returnArray.push(new MailboxUser(value));
            });
            successCallback(returnArray);
        }, function (errorDetails) {
            if (errorCallback != null)
                errorCallback(errorDetails);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     *  PUBLIC: Find a given conversation by the ID
     *  NOTE: Search for parent:
     *      http://stackoverflow.com/questions/19008696/exchange-find-items-in-ews-conversation-using-xml-request
     *      http://www.outlookcode.com/codedetail.aspx?id=1714
     *      https://msdn.microsoft.com/en-us/library/office/dn610351(v=exchg.150).aspx
     * 
     * @param {string} converstionId - The conversation to find
     * @param {successCallbackArray} successCallback - Callback with array of item IDs - function(String[]) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {errorCallback} errorCallback - Debug handler returns raw XML - function(String) { }
     */
    this.findConversationItems = function (conversationId, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap =
            '       <m:GetConversationItems>' +
            '           <m:ItemShape>' +
            '               <t:BaseShape>IdOnly</t:BaseShape>' +
            '               <t:AdditionalProperties>' +
            '                   <t:FieldURI FieldURI="item:Subject" />' +
            '                   <t:FieldURI FieldURI="item:DateTimeReceived" />' +
            '               </t:AdditionalProperties>' +
            '           </m:ItemShape>' +
            '           <m:FoldersToIgnore>' +
            '               <t:DistinguishedFolderId Id="deleteditems" />' +
            '               <t:DistinguishedFolderId Id="drafts" />' +
            '           </m:FoldersToIgnore>' +
            '           <m:SortOrder>TreeOrderDescending</m:SortOrder>' +
            '           <m:Conversations>' +
            '               <t:Conversation>' +
            '                   <t:ConversationId Id="' + conversationId + '" />' +
            '               </t:Conversation>' +
            '           </m:Conversations>' +
            '       </m:GetConversationItems>';
        soap = getSoapHeader(soap);
        // Make EWS call
        asyncEws(soap, function (xmlDoc) {
            /** @type {array} */
            var returnArray = [];
            try {
                /** @type {array} */
                var nodes = getNodes(xmlDoc, "t:ItemId");
                if (nodes == null) {
                    if (errorCallback != null) {
                        errorCallback(new Error("The XML returned from the server could not be parsed."));
                    }
                } else if (nodes.length == 0) {
                    successCallback(null);
                } else {
                    // loop through and return an array of ids
                    $.each(nodes, function (index, value) {
                        returnArray.push(value.getAttribute("Id"));
                    });
                    successCallback(returnArray);
                }
            } catch (error) {
                if (errorCallback != null)
                    errorCallback(error);
            }
        }, function (errorDetails) {
            if (errorCallback != null)
                errorCallback(errorDetails);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC: Gets a specific Internet header for a spific item
     * NOTE: https://msdn.microsoft.com/en-us/library/office/aa566013(v=exchg.150).aspx
     * 
     * @param {string} itemId - The item ID to get
     * @param {string} headerName - The header to get
     * @param {string} headerType - The header type (String, Integer)
     * @param {successCallback} successCallback - Returns the value for the header - function(string) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {errorCallback} errorCallback - Debug handler returns raw XML - function(String) { }
     */
    this.getSpecificHeader = function (itemId, headerName, headerType, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap =
        '   <m:GetItem>' +
        '       <m:ItemShape>' +
        '           <t:BaseShape>IdOnly</t:BaseShape>' +
        '           <t:AdditionalProperties>' +
        '               <t:ExtendedFieldURI DistinguishedPropertySetId="InternetHeaders" PropertyName="' + headerName + '" PropertyType="' + headerType + '" />' +
        '           </t:AdditionalProperties>' +
        '       </m:ItemShape>' +
        '       <m:ItemIds>' +
        '           <t:ItemId Id="' + itemId + '" />' +
        '       </m:ItemIds>' +
        '   </m:GetItem>';

        soap = getSoapHeader(soap);
        // Make the EWS call
        /** @type {string} */
        var returnValue = "";
        asyncEws(soap, function (xmlDoc) {
            try {
                if (xmlDoc == null) {
                    successCallback(null);
                    return;
                }
                /** @type {array} */
                var nodes = getNodes(xmlDoc, "t:ExtendedProperty");
                $.each(nodes, function (index, value) {
                    /** @type {string} */
                    var nodeName = getNodes(value, "t:ExtendedFieldURI")[0].getAttribute("PropertyName");
                    /** @type {string} */
                    var nodeValue = getNodes(value, "t:Value")[0].textContent;
                    if (nodeName == headerName) {
                        returnValue = nodeValue;
                    }
                });
                successCallback(returnValue);
            } catch (error) {
                if (errorCallback != null)
                    errorCallback(error);
            }
        }, function (errorDetails) {
            if (errorCallback != null)
                errorCallback(errorDetails);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC: Gets Internet headers for a spific item
     * NOTE: https://msdn.microsoft.com/en-us/library/office/aa566013(v=exchg.150).aspx
     * 
     * @param {string} itemId - The item ID to get
     * @param {successCallbackDictionary} successCallback - Callback with a Dictionary(key,value) containing the message headers - function(Dictionary) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {errorCallback} errorCallback - Debug handler returns raw XML - function(String) { }
     */
    this.getEwsHeaders = function (itemId, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap =
        '   <m:GetItem>' +
        '       <m:ItemShape>' +
        '           <t:BaseShape>AllProperties</t:BaseShape>' +
        '           <t:IncludeMimeContent>true</t:IncludeMimeContent>' +
        '       </m:ItemShape>' +
        '       <m:ItemIds>' +
        '           <t:ItemId Id="' + itemId + '" />' +
        '       </m:ItemIds>' +
        '   </m:GetItem>';
        soap = getSoapHeader(soap);
        // Make the EWS call
        /** @type {Dictionary} */
        var returnArray = new Dictionary();
        asyncEws(soap, function (xmlDoc) {
            try {
                if (xmlDoc == null) {
                    successCallback(null);
                    return;
                }
                /** @type {array} */
                var nodes = getNodes(xmlDoc, "t:InternetMessageHeader");
                $.each(nodes, function (index, value) {
                    returnArray.add(value.getAttribute("HeaderName"), value.textContent);
                });
                successCallback(returnArray);
            } catch (error) {
                if (errorCallback != null)
                    errorCallback(error);
            }
        }, function (errorDetails) {
            if (errorCallback != null)
                errorCallback(errorDetails);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC: Updates a folder property. If the property does not exist, it will be created.
     * 
     * @param {string} folderId - The ID for the folder
     * @param {string} propName - The property on the folder to set
     * @param {string} propValue - The value for the propert
     * @param {successCallback} successCallback - returns 'succeeeded' is successful - function(String) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {debugCallback} debugCallback - Debug handler returns raw XML - function(String) { }
     */
    this.updateFolderProperty = function (folderId, propName, propValue, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap =
            '       <m:UpdateFolder>' +
            '           <m:FolderChanges>' +
            '               <t:FolderChange>' +
            '                   <t:FolderId Id="' + folderId + '" />' +
            '                   <t:Updates>' +
            '                       <t:SetFolderField>' +
            '                           <t:ExtendedFieldURI ' +
            '                              DistinguishedPropertySetId="PublicStrings" ' +
            '                              PropertyName="' + propName + '" ' +
            '                              PropertyType="String" />' +
            '                            <t:Folder>' +
            '                               <t:ExtendedProperty>' +
            '                                  <t:ExtendedFieldURI ' +
            '                                     DistinguishedPropertySetId="PublicStrings" ' +
            '                                     PropertyName="' + propName + '" ' +
            '                                     PropertyType="String" />' +
            '                                 <t:Value>' + propValue + '</t:Value>' +
            '                              </t:ExtendedProperty>' +
            '                           </t:Folder>' +
            '                       </t:SetFolderField>' +
            '                   </t:Updates>' +
            '               </t:FolderChange>' +
            '           </m:FolderChanges>' +
            '       </m:UpdateFolder>';

        soap = getSoapHeader(soap);
        // make the EWS call
        asyncEws(soap, function(data) {
            if(successCallback != null)
                successCallback('succeeeded');
        }, function (error) {
            if (errorCallback != null)
                errorCallback(error);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC: Gets a folder property
     * 
     * @param {string} folderId - The ID for the folder
     * @param {string} propName - The property to get
     * @param {successCallback} successCallback - returns the folder property value if successful - function(String) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {debugCallback} debugCallback - Debug handler returns raw XML - function(String) { }
     */
    this.getFolderProperty = function (folderId, propName, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap =
            '<m:GetFolder>' +
                '<m:FolderShape>' +
                    '<t:BaseShape>IdOnly</t:BaseShape>' +
                    '<t:AdditionalProperties>' +
                        '<t:ExtendedFieldURI ' +
                        '   DistinguishedPropertySetId="PublicStrings" ' +
                        '   PropertyName="' + propName + '" ' +
                        '   PropertyType="String" />' +
                    '</t:AdditionalProperties>' +
                '</m:FolderShape>' +
                '<m:FolderIds>' +
                    '<t:FolderId Id="' + folderId + '"/>' +
                '</m:FolderIds>' +
            '</m:GetFolder>';
        soap = getSoapHeader(soap);
        // make the EWS call
        asyncEws(soap, function (xmlDoc) {
            /** @type {array} */
            var nodes = getNodes(xmlDoc, "t:Value");
            // return the content of the node
            if (nodes.length > 0) {
                successCallback(nodes[0].textContent);
            } else {
                successCallback(null); // no property found
            }
        }, function (error) {
            if (errorCallback != null)
                errorCallback(error);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC: Gets the folder id by the given name from the store
     * 
     * @param {string} folderName - Name of the folder to get the ID for
     * @param {successCallback} successCallback - returns the folder ID if successful - function(String) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {debugCallback} debugCallback - Debug handler returns raw XML - function(String) { }
     */
    this.getFolderId = function (folderName, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap =
            '    <m:GetFolder>' +
            '      <m:FolderShape>' +
            '        <t:BaseShape>IdOnly</t:BaseShape>' +
            '      </m:FolderShape>' +
            '      <m:FolderIds>' +
            '        <t:DistinguishedFolderId Id="' + folderName + '" />' +
            '      </m:FolderIds>' +
            '    </m:GetFolder>';
        soap = getSoapHeader(soap);
        // make EWS callback
        asyncEws(soap, function (xmlDoc) {
            /** @type {array} */
            var nodes = getNodes(xmlDoc, "t:FolderId");
            if (nodes.length > 0) {
                /** @type {string} */
                var id = nodes[0].getAttribute("Id");
                successCallback(id);
            } else {
                errorCallback("Unable to get folder ID");
            }
        }, function (errorDetails) {
            if (errorCallback != null)
                errorCallback(errorDetails);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC: Moves an item to the specified folder
     * 
     * @param {string} itemId - the item to be moved
     * @param {string} folderId - Name or ID of the folder where the item will be moved
     * @param {successCallback} successCallback - returns the folder ID if successful - function(String) { }
     * @param {errorCallback} errorCallback - Error handler callback - function(Error) { }
     * @param {debugCallback} debugCallback - Debug handler returns raw XML - function(String) { }
     */
    this.moveItem = function(itemId, folderId, successCallback, errorCallback, debugCallback) {
        /** @type {string} */
        var soap = '<MoveItem xmlns="http://schemas.microsoft.com/exchange/services/2006/messages"' +
                   '          xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types">' +
                   '    <ToFolderId>' +
                   '        <t:DistinguishedFolderId Id="' + folderId + '"/>' +
                   '    </ToFolderId>' +
                   '    <ItemIds>' +
                   '        <t:ItemId Id="' + itemId + '"/>' +
                   '    </ItemIds>' +
                   '</MoveItem>';
        soap = getSoapHeader(soap);
        // make EWS callback
        asyncEws(soap, function (data) {
            if(successCallback != null)
                successCallback('succeeeded');
        }, function (errorDetails) {
            if (errorCallback != null)
                errorCallback(errorDetails);
        }, function (debug) {
            if (debugCallback != null)
                debugCallback(debug);
        });
    };
    /**
     * PUBLIC:    Gets all the recipients from the To/CC/BCC lines
     * NOTE:      Requires the Office.js library to be loaded as it uses its types
     * 
     * @param {Office.Types.ItemCompose} composeItem - the cast of the Office.context.mailbox.item
     * @param {getAllRecipientsCallbackDelegate} successCallback - called when completed function(Office.EmailAddressDetails[], Office.EmailAddressDetails[]) { }
     * @param {errorCallbackDelegate} errorCallback - Error handler callback - function(Error) { }
     */
    this.getAllRecipientsAsync = function(composeItem, successCallback, errorCallback) {
        /** @type {Office.EmailAddressDetails[]} */
        var users = [];
        /** @type {Office.EmailAddressDetails[]} */
        var groups = [];
        // get the TO line
        composeItem.to.getAsync(function(toAsyncResult) {
            if(toAsyncResult.error) {
                errorCallback(error);
            } else {
                /** @type {Office.Recipients} */
                var recipients = toAsyncResult.value;
                // if there are results, add them to the return array
                if(recipients.length > 0) { 
                    recipients.forEach( 
                        /**
                         * @param {Office.EmailAddressDetails} recip
                         * @param {Number} index
                         */
                        function(recip, index) {
                            if(recip.recipientType == Office.MailboxEnums.RecipientType.DistributionList) {
                                /** @type {Boolean} */
                                var found = false;
                                for(var i=0; i<groups.length;i++) {
                                    /** @param {EmailAddressDetails} */
                                    var item = groups[i];
                                    if(item.emailAddress == recip.emailAddress) {
                                        found = true;
                                        break;
                                    }
                                }
                                if(!found) {
                                    groups.push(recip);
                                }
                            } else {
                                /** @type {Boolean} */
                                var found = false;
                                for(var i=0;i<users.length;i++) {
                                    /** @param {Office.EmailAddressDetails} */
                                    var item = users[i];
                                    if(item.emailAddress == recip.emailAddress) {
                                        found = true;
                                        break;
                                    }
                                }
                                if(!found) {
                                    users.push(recip);
                                }
                            }
                        }
                    );
                }
                // get the CC line
                composeItem.cc.getAsync(function(ccAsyncResult) {
                    if(ccAsyncResult.error) {
                        errorCallback(error);
                    } else {
                        /** @type {Office.Recipients} */
                        var recipients = ccAsyncResult.value;
                        // if we have results
                        if(recipients.length > 0) {
                            recipients.forEach( 
                                /**
                                 * @param {Office.EmailAddressDetails} recip
                                 * @param {Number} index
                                 */
                                function(recip, index) {
                                    if(recip.recipientType == Office.MailboxEnums.RecipientType.DistributionList) {
                                        /** @type {Boolean} */
                                        var found = false;
                                        for(var i=0; i<groups.length;i++) {
                                            /** @param {EmailAddressDetails} */
                                            var item = groups[i];
                                            if(item.emailAddress == recip.emailAddress) {
                                                found = true;
                                                break;
                                            }
                                        }
                                        if(!found) {
                                            groups.push(recip);
                                        }
                                    } else {
                                        /** @type {Boolean} */
                                        var found = false;
                                        for(var i=0;i<users.length;i++) {
                                            /** @param {Office.EmailAddressDetails} */
                                            var item = users[i];
                                            if(item.emailAddress == recip.emailAddress) {
                                                found = true;
                                                break;
                                            }
                                        }
                                        if(!found) {
                                            users.push(recip);
                                        }
                                    }
                                }
                            );
                        } // end-if ccAsyncResult.value.length
            
                        // get the BCC line
                        composeItem.bcc.getAsync(function(bccAsyncResult) {
                            if(bccAsyncResult.error) {
                                errorCallback(error);
                            } else {
                                /** @type {Office.Recipients} */
                                var recipients = bccAsyncResult.value;
                                if(recipients.length > 0) {
                                    recipients.forEach( 
                                        /**
                                         * @param {Office.EmailAddressDetails} recip
                                         * @param {Number} index
                                         */
                                        function(recip, index) {
                                            if(recip.recipientType == Office.MailboxEnums.RecipientType.DistributionList) {
                                                /** @type {Boolean} */
                                                var found = false;
                                                for(var i=0; i<groups.length;i++) {
                                                    /** @param {EmailAddressDetails} */
                                                    var item = groups[i];
                                                    if(item.emailAddress == recip.emailAddress) {
                                                        found = true;
                                                        break;
                                                    }
                                                }
                                                if(!found) {
                                                    groups.push(recip);
                                                }
                                            } else {
                                                /** @type {Boolean} */
                                                var found = false;
                                                for(var i=0;i<users.length;i++) {
                                                    /** @param {Office.EmailAddressDetails} */
                                                    var item = users[i];
                                                    if(item.emailAddress == recip.emailAddress) {
                                                        found = true;
                                                        break;
                                                    }
                                                }
                                                if(!found) {
                                                    users.push(recip);
                                                }
                                            }
                                        }
                                    );
                                    successCallback(users, groups);
                                } else {
                                    successCallback(users, groups);
                                } // end-if(bccAsyncResult.value.length > 0)
                            } // end-if(bccAsyncResult.error)
                        }); //composeItem.bcc.getAsync
                    } // end-if(ccAsyncResult.error)
                }); // composeItem.cc.getAsync
            } // end-if(toAsyncResult.error)
        }); // to.getAsync
    };
/***********************************************************************************************
 ***********************************************************************************************
 ***********************************************************************************************
                          ****  ****  ***** *   *  ***  ***** *****  ***                            
                          *   * *   *   *   *   * *   *   *   *     *   *                           
                          ****  ****    *   *   * *****   *   ***     *                             
                          *     *   *   *    * *  *   *   *   *     *   *                           
                          *     *   * *****   *   *   *   *   *****  ***                            
***********************************************************************************************
***********************************************************************************************
***********************************************************************************************/
    /**
     * PRIVATE:         Expands a group, if other groups found in the group
     *                  recursively calls itself until all groups are split
     */
    function splitGroupsRecursivelyAsync() {
        // if there are no more groups found, or we have recursively
        // found more than 10 levels of groups, then we stop
        if(groups.length == 0 || groupLevels > 10) { 
            // if no groups stop
            splitGroupSuccessCallback(users); 
        } else {
            /** @type {string} */
            var group = groups.pop();
            processedGroups.push(group);
            // call expandGroup to get users
            easyEws.expandGroup(group, function(groupResult) {
                groupResult.forEach(
                    /**
                     * @param {MailboxUser} result
                     * @param {Nubmer} index
                     */
                    function(result, index) {
                        if(result.MailboxType() == "PublicDL" || 
                           result.MailboxType() == "PrivateDL") { 
                            // add the group to the list of results as
                            // long as it does not already contain a group
                            // we have processed or a group that is on the
                            // stack to be processed
                            if(processedGroups.indexOf(result.Address()) < 0 && 
                               groups.indexOf(result.Address()) < 0) {
                                groupLevels++;
                                groups.push(result.Address());
                            }
                        } else {
                            // add the user to the list as long as they have
                            // not already been included already. This way
                            // we have a list of unique results.
                            /** @type {boolean} */
                            var found = false;
                            for(var i=0;i < users.length; i++) {
                                /** @type {MailboxUser} */
                                var item = users[i];
                                if(item.Address() == result.Address()) {
                                    found = true;
                                    break;
                                }
                            }
                            if(found == false) {
                                users.push(result);
                            }
                        }
                    }
                ); // groupUsers.forEach
                splitGroupsRecursivelyAsync(); // recursive
            }, function(error) {
                splitGroupErrorCallback(error);
            }, function(debug) {
                splitGroupDebugCallback(debug);
            }); // easyEws.expandGroup
        } // end-if
    };
    /**
     * PRIVATE: creates a SOAP EWS wrapper
     * 
     * @param {string} request The XML body of the soap message
     */
    function getSoapHeader(request) {
        /** @type {string} */
        var result =
            '<?xml version="1.0" encoding="utf-8"?>' +
            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
            '               xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
            '               xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages"' +
            '               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"' +
            '               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types">' +
            '   <soap:Header>' +
            '       <RequestServerVersion Version="Exchange2013" xmlns="http://schemas.microsoft.com/exchange/services/2006/types" soap:mustUnderstand="0" />' +
            '   </soap:Header>' +
            '   <soap:Body>' + request + '</soap:Body>' +
            '</soap:Envelope>';
        return result;
    };

    /**
     * PRIVATE: Makes an EWS callback with promise
     * 
     * @param {string} soap - XML Soap message
     * @param {function({DOMDocument})} successCallback - Success callback - function(DOMDocument) { }
     * @param {function({Object})} errorCallback - Error handler callback - function(Error) { }
     * @param {function({string})} debugCallback - Debug callback - function(String) { }
     */
    function asyncEws(soap, successCallback, errorCallback, debugCallback) {
        Office.context.mailbox.makeEwsRequestAsync(soap, function (ewsResult) {
            if (ewsResult.status == "succeeded") {
                /** @type {XMLDocument} */
                var xmlDoc = $.parseXML(ewsResult.value);                   
                successCallback(xmlDoc);

                // provide a detailed debug with the initial soap, fully formed
                // and the response from the server
                debugCallback("STATUS: " + ewsResult.status + "\n" +
                                "---- START SOAP ----\n" + soap + "\n---- END SOAP ----\n" +
                                "---- START RESPONSE ----\n" + ewsResult.value + "---- END RESPONSE ----"); // return raw result
            } else {
                if (errorCallback != null) {
                    errorCallback("makeEwsRequestAsync failed. " + ewsResult.error);
                    debugCallback("STATUS: " + ewsResult.status + "\n" +
                                    "ERROR: " + ewsResult.error + "\n" +
                                    "---- START SOAP ----\n" + soap + "\n---- END SOAP ----\n" +
                                    "---- START RESPONSE ----\n" + ewsResult.value + "---- END RESPONSE ----"); // return raw result
                }
            }
        }); 
    };
    /** 
     * PRIVATE: This function returns an element node list based on the name
     *           provided (using the Namespace, such as t:Item). It will look
     *           for t:Item and return all nodes, but it not, it will seach
     *           without the namespace "Item"
     *NOTE: This is done because there is a difference in calling EWS functions
        *      from the browser in OWA and the full client Outlook
        * @param {XMLNode} node - The parent node
        * @param {string} elementNameWithNS - The element tagname to get with namespace
        * @return {XMLNode} - The node found
    */
    function getNodes(node, elementNameWithNS) {
        /** @type {string} */
        var elementWithoutNS = elementNameWithNS.substring(elementNameWithNS.indexOf(":") + 1);
        /** @type {array} */
        var retVal = node.getElementsByTagName(elementNameWithNS);
        if (retVal == null || retVal.length == 0) {
            retVal = node.getElementsByTagName(elementWithoutNS);
        }
        return retVal;
    };
};

/***********************************************************************************************
 ***********************************************************************************************
 ***********************************************************************************************
                             *   * ***** *     ****  ***** ****   ***                               
                             *   * *     *     *   * *     *   * *   *                              
                             ***** ***   *     ****  ***   ****    *                                
                             *   * *     *     *     *     *   * *   *                              
                             *   * ***** ***** *     ***** *   *  ***                                                            
***********************************************************************************************
***********************************************************************************************
***********************************************************************************************/
/* HELPER FUNCTIONS AND CLASSES */
/**
 * @typedef {Object} MailItem
 * @property {string} MimeContent Returns the MimeContent of the message
 * @property {string} CharacterSet Returns the mime content character set
 * @property {string} Subject Returns the subject of the message
 * @param {XMLDocument} value Sets the value of a new MailItem
 */
function MailItem(value) {
    this.value = value || {};

    /**
     * Returns the MimeContent of the message
     * @returns {string} Base64 string
     */
    this.MimeContent = function () {
        return this.value.getElementsByTagName("t:MimeContent")[0].textContent;
    };

    /**
     * Returns the mime content character set
     * @returns {string} Character set value
     */
    this.CharacterSet = function () {
        return this.value.getElementsByTagName("t:MimeContent")[0].getAttribute("CharacterSet");
    };

    /**
     * Returns the subject of the message
     * @returns {string} Subject line
     */
    this.Subject = function () {
        return this.value.getElementsByTagName("t:Subject")[0].textContent;
    };

    /** Returns the body of the message 
     * @returns {string} Body text
    */
    this.Body = function () {
        return this.value.getElementsByTagName("t:Body")[0].textContent;
    }
}

/**
 * Mailbox user wrapper
 *      <t:Mailbox>
 *          <t:Name>username</t:Nname>
 *          <t:EmailAddress>user@there.com</t:EmailAddress>
 *          <t:RoutingType>SMTP</t:RoutingType>
 *          <t:MailboxType>Mailbox / PublicDL</t:MailboxType>
 *      </t:Mailbox>
 * @typedef {Object} MailboxUser
 * @property {string} Name Returns the name of the item
 * @property {string} Address Returns the email address of the item
 * @property {string} RoutingType Returns the type of address of the item
 * @property {string} MailboxType Returns is the item is a mailbox user or a PublicDL
 * @param {XMLDocument} value XML string from EWS request
 */
function MailboxUser(value) {
    this.value = value || {};
    /**
     * Returns the name of the item
     * @returns {string} The user name
     */
    this.Name = function () {
        return this.value.getElementsByTagName("t:Name")[0].textContent;
    };
    /**
     * Returns the email address of the item
     * @returns {string} email
     */
    this.Address = function () {
        return this.value.getElementsByTagName("t:EmailAddress")[0].textContent;
    };
    /**
     * Returns the routing type for this mailbox
     * SEE: https://msdn.microsoft.com/en-us/library/office/aa563474(v=exchg.150).aspx
     * @returns {string} type ActingAs | Mailbox | RoomList
     */
    this.RoutingType = function () {
        return this.value.getElementsByTagName("t:RoutingType")[0].textContent;
    };
    /**
     * Returns the mailbox type such as Mailbox, PublicDL, PrivateDL, Contact, etc.
     * SEE: https://msdn.microsoft.com/en-us/library/office/aa563493(v=exchg.150).aspx
     * @returns {string} Mailbox | PublicDL | PrivateDL | Contact | PublicFolder | Unknown | OneOff | GroupMailbox
     */
    this.MailboxType = function () {
        return this.value.getElementsByTagName("t:MailboxType")[0].textContent;
    };
}

/**
 * Dictionary Object Class
 * Helps to work with items in a dictionary with key value pairs
 * 
 * @typedef {Object} Dictionary
 * @property {function(Object, function())} forEach Loops through each item in the Dictionary
 * @property {function(string)} lookup Returns the value for the specified key
 * @property {function(string, Object)} add Adds a new item to the Dictionary collection
 * @property {boolean} containsKey True if key exists in collection
 * @property {Number} length Returns the length of the array, or number of items
 * @param {Object[]} values Array of values
 */
function Dictionary(values) {
    this.values = values || {};

    /**
     * INTERNAL: Loops through each item in the Dictionary
     * @param {Object} object 
     * @param {function(Object, Object)} action 
     */
    var forEachIn = function (object, action) {
        for (var property in object) {
            if (Object.prototype.hasOwnProperty.call(object, property))
                action(property, object[property]);
        }
    };

    /**
     * Returns true if it contains the specified key
     * @param {string} key 
     */
    this.containsKey = function (key) {
        return Object.prototype.hasOwnProperty.call(this.values, key) &&
          Object.prototype.propertyIsEnumerable.call(this.values, key);
    };

    /**
     * For each function for the Dictionary
     * @param {function(Object,Object)}
     */
    this.forEach = function (action) {
        forEachIn(this.values, action);
    };

    /**
     * Returns the value for the specified key
     * @param {Object} key The value found
     */
    this.lookup = function (key) {
        return this.values[key];
    };

    /**
     * Adds a new item to the Dictionary collection
     * @param {string} key The key name
     * @param {Object} value The value
     */
    this.add = function (key, value) {
        this.values[key] = value;
    };

    /**
     * Returns the length of the array, or number of items
     * @returns {Number} The number of items in the array
     */
    this.length = function () {
        /** @type {number} */
        var len = 0;
        forEachIn(this.values, function () { len++ });
        return len;
    };
};
/***********************************************************************************************
 ***********************************************************************************************
 ***********************************************************************************************
              *****  ***  ****   ***   ***        ***** *   * ***** ****   ***   ***                
                 *  *   * *   * *   * *   *       *      * *    *   *   * *   * *   *               
                 *    *   *   * *   * *           ***     *     *   ****  *****   *                 
              *  *  *   * *   * *   * *   *       *      * *    *   *   * *   * *   *               
               **    ***  ****   ***   ***        ***** *   *   *   *   * *   *  ***                                                                         
***********************************************************************************************
***********************************************************************************************
***********************************************************************************************/
/**
 * This is the sucess callback
 * @callback successCallback
 * @param {string} result
 * @returns {void}
 */
var successCallback = function(result) { };
/**
 * This is the sucess callback
 * @callback successCallback
 * @param {MailItem} result
 * @returns {void}
 */
var successCallbackMailItem = function(result) { };
/**
 * This is the sucess callback
 * @callback successCallbackArray
 * @param {string[]} result
 * @returns {void}
 */
var successCallbackArray = function(result) { };
/**
 * This is the success callback
 * @callback successCallbackMailBoxUserArray
 * @param {MailboxUser[]} result
 * @returns {void}
 */
var successCallbackMailboxUserArray = function(result) { };
/**
 * This is the sucess callback
 * @callback successCallbackDictionary
 * @param {Dictionary} result
 * @returns {void}
 */
var successCallbackDictionary = function(result) { };
/**
 * This is the error callback
 * @callback errorCallback
 * @param {string} error
 * @returns {void}
 */
var errorCallback = function(error) { };
/**
 * This is the debug callback
 * @callback debugCallback
 * @param {string} debug
 * @returns {void}
 */
var debugCallback = function(debug) { };
/**
 * Calback with users and groups
 * @param {Office.EmailAddressDetails[]} users 
 * @param {Office.EmailAddressDetails[]} groups 
 */
var getAllRecipientsCallbackDelegate = function(users, groups) { }