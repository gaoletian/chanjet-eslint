/**
 * @fileoverview check invalid this in arrow function
 * @author gaoletian
 */
 "use strict";

 //------------------------------------------------------------------------------
 // Requirements
 //------------------------------------------------------------------------------
 
 var requireIndex = require("requireindex");
 
 //------------------------------------------------------------------------------
 // Plugin Definition
 //------------------------------------------------------------------------------
 
 
 // import all rules in lib/rules
 module.exports.rules = requireIndex(__dirname + "/rules");