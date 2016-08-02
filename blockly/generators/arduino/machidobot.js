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

Blockly.Arduino.ultrasonic_ranger = function() {
	var pin = this.getFieldValue("PIN");
	return ["ultrasonic_distance(" + pin + ")", Blockly.Arduino.ORDER_ATOMIC];
}

Blockly.Arduino.particle_variable = function() {
	var name = this.getFieldValue("VAR");
	Blockly.Arduino.setups_['setup_particle_variable_' + name] = "Particle.variable(\"" + name + "\", " + name + ");";
	return "";
}

Blockly.Arduino.particle_function = function() {
  // Define a procedure with a return value.
  var funcName = Blockly.Arduino.variableDB_.getName(this.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);

  Blockly.Arduino.setups_['setup_particle_function_' + funcName] = "Particle.function(\"" + funcName + "\", " + funcName + ");";

  var branch = Blockly.Arduino.statementToCode(this, 'STACK');
  if (Blockly.Arduino.INFINITE_LOOP_TRAP) {
    branch = Blockly.Arduino.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  var arg = Blockly.Arduino.variableDB_.getName(this.arguments_[0], Blockly.Variables.NAME_TYPE);
  var code = 'int ' + funcName + '(String _' + arg + ') {\n' +
  	  '  int ' + arg + " = _" + arg + ".toInt();\n" +
      branch + 
      '  return 0;\n' +
      '}\n';
  code = Blockly.Arduino.scrub_(this, code);
  Blockly.Arduino.definitions_[funcName] = code;

  return null;
}

Blockly.Arduino.particle_publish = function() {
	var name = this.getFieldValue('NAME');
	return 'Particle.publish("' + name + '");\n';
}

Blockly.Arduino.particle_publish_arg = function() {
	var name = this.getFieldValue('NAME');
	var value = Blockly.Arduino.valueToCode(this, 'ARG', Blockly.Arduino.ORDER_ATOMIC);
	return 'Particle.publish("' + name + '", ' + value + ');\n';
}
