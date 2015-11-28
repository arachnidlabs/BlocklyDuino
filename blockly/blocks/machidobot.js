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
