import Helpers from './helpers';
import randtoken from "rand-token";
import Validator from 'better-validator';
import _ from 'lodash';

/**
 * basic module class
 * all modules should extend this class
 */
class Module extends Helpers {

	/**
	 * get detail information for a error number
	 * @param nr {String} number of the error (error code)
	 * @param values {Object} object of values which should be replaced for the returned message
	 * @returns {{nr: *, message: *}}
	 */
	getError(nr, values) {
		let message = Module.errors[nr];
		_.each(values, (value, name) => {
			console.log(value, name);
			let re = new RegExp(name, 'g');
			message = message.replace(re, value);
		});
		return {'nr': nr, 'message': message};
	}

}

Module.errors = {
	'0010': "language code '§§LangCode' not found",
	'1000': "wrong user name",
	'1001': "wrong password",
	'1002': "token not found",
	'1100': "list with ID: '§§ID' not found",
	'1101': "list with ID: '§§ID' count not valid",
	'1102': "list with ID: '§§ID' no columns found",
	'1200': "form with ID: '§§ID' not found",
	'1201': "form with ID: '§§ID' no fields found",
}

module.exports = Module;