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

goog.provide('Blockly.Arduino.machidobot');
goog.require('Blockly.Arduino');

var motor_pins = ["D0", "D1", "D2", "D3"];
var motor_dirs = {
	// Both motors forward
	'F': [['D0', 'HIGH'], ['D1', 'LOW'], ['D2', 'HIGH'], ['D3', 'LOW']],
	// Both motors back
	'B': [['D0', 'LOW'], ['D1', 'HIGH'], ['D2', 'LOW'], ['D3', 'HIGH']],
	// Left forward, right back
	'L': [['D0', 'HIGH'], ['D1', 'LOW'], ['D2', 'LOW'], ['D3', 'HIGH']],
	// Right forward, left back
	'R': [['D0', 'LOW'], ['D1', 'HIGH'], ['D2', 'HIGH'], ['D3', 'LOW']],
	// Both motors idle
	'S': [['D0', 'LOW'], ['D1', 'LOW'], ['D2', 'LOW'], ['D3', 'LOW']],
}

Blockly.Arduino.machidobot_motors = function() {
	var direction = this.getFieldValue("DIR");

	for(var i = 0; i < motor_pins.length; i++)
		Blockly.Arduino.setups_['setup_output_' + motor_pins[i]] = 'pinMode(' + motor_pins[i] + ', OUTPUT);';
	var code = "";
	var instructions  = motor_dirs[direction]
	for(var i = 0; i < instructions.length; i++) {
		code = code + "digitalWrite(" + instructions[i][0] + ", " + instructions[i][1] + ");\n";
	}
	return code;
}
