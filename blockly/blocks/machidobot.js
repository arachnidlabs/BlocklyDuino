/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2015 Nick Johnson.
 * https://github.com/arachnidlabs/BlocklyDuino
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Helper functions for the machidobot.
 * @author nick@arachnidlabs.com (Nick Johnson)
 */

goog.provide('Blockly.Blocks.machidobot');
goog.require('Blockly.Blocks');
goog.require('Blockly.Blocks.procedures');

Blockly.Blocks['machidobot_motors'] = {
  init: function() {
    this.setColour(190);
    this.appendDummyInput()
      .appendField("Drive")
      .appendField(new Blockly.FieldDropdown([
        ["forwards", "F"],
        ["backwards", "B"],
        ["left", "L"],
        ["right", "R"],
        ["stop", "S"]]), "DIR");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Drive the robot around');
  }    
};

Blockly.Blocks['ultrasonic_ranger'] = {
  init: function() {
    this.setColour(190);
    this.appendDummyInput()
      .appendField("Ultrasonic Ranger")
      .appendField("PIN#")
      .appendField(new Blockly.FieldDropdown(profile.default.digital), "PIN");
    this.setOutput(true, "Number")
    this.setTooltip("Ultrasonic distance sensor");
  }
};

Blockly.Blocks['particle_variable'] = {
  /**
   * Block for Particle.variable
   * @this Blockly.Block
   */
  init: function() {
    this.setColour(Blockly.Blocks.variables.HUE);
    this.appendDummyInput()
        .appendField("Particle variable")
        .appendField(new Blockly.FieldVariable(
        Blockly.Msg.VARIABLES_DEFAULT_NAME), 'VAR');
    this.setTooltip("Registers a particle IoT variable");
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getVars: function() {
    return [this.getFieldValue('VAR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameVar: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
      this.setFieldValue(newName, 'VAR');
    }
  },
};

Blockly.Blocks['particle_function'] = {
  /**
   * Block for defining a Particle function.
   * @this Blockly.Block
   */
  init: function() {
    this.setColour(Blockly.Blocks.procedures.HUE);
    var name = Blockly.Procedures.findLegalName(
        Blockly.Msg.PROCEDURES_DEFNORETURN_PROCEDURE, this);
    var nameField = new Blockly.FieldTextInput(name,
        Blockly.Procedures.rename);
    nameField.setSpellcheck(false);
    this.appendDummyInput()
        .appendField("Particle function")
        .appendField(nameField, 'NAME')
        .appendField("with: arg", 'PARAMS');
    this.setTooltip("Creates a function that is exposed via the Particle API");
    this.arguments_ = ['arg'];
    this.setStatements_(true);
    this.statementConnection_ = null;
  },
  setStatements_: Blockly.Blocks['procedures_defnoreturn'].setStatements_,
  updateParams_: Blockly.Blocks['procedures_defnoreturn'].updateParams_,
  mutationToDom: Blockly.Blocks['procedures_defnoreturn'].mutationToDom,
  domToMutation: Blockly.Blocks['procedures_defnoreturn'].domToMutation,
  decompose: Blockly.Blocks['procedures_defnoreturn'].decompose,
  compose: Blockly.Blocks['procedures_defnoreturn'].compose,
  dispose: Blockly.Blocks['procedures_defnoreturn'].dispose,
  /**
   * Return the signature of this procedure definition.
   * @return {!Array} Tuple containing three elements:
   *     - the name of the defined procedure,
   *     - a list of all its arguments,
   *     - that it DOES have a return value.
   * @this Blockly.Block
   */
  getProcedureDef: function() {
    return [this.getFieldValue('NAME'), this.arguments_, false];
  },
  getVars: Blockly.Blocks['procedures_defnoreturn'].getVars,
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameVar: function(oldName, newName) {
    var change = false;
    for (var i = 0; i < this.arguments_.length; i++) {
      if (Blockly.Names.equals(oldName, this.arguments_[i])) {
        this.arguments_[i] = newName;
        change = true;
      }
    }
    if (change) {
      this.updateParams_();
    }
  },
  customContextMenu: Blockly.Blocks['procedures_defnoreturn'].customContextMenu,
  callType_: 'procedures_callnoreturn'
};

Blockly.Blocks['particle_publish'] = {
  /**
   * Block for Particle.publish.
   * @this Blockly.Block
   */
  init: function() {
    this.setColour(120);
    this.appendDummyInput()
        .appendField("Publish event")
        .appendField(new Blockly.FieldTextInput(''), 'NAME');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Publish an event');    
  },
};

Blockly.Blocks['particle_publish_arg'] = {
  /**
   * Block for Particle.publish with argument.
   * @this Blockly.Block
   */
  init: function() {
    this.setColour(120);
    this.appendValueInput('ARG')
        .appendField("Publish event")
        .appendField(new Blockly.FieldTextInput(''), 'NAME')
        .appendField("with value ");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Publish an event');    
  },
};
