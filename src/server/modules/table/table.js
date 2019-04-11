import Module from './../module';
import _ from 'lodash';

/**
 * floor module
 */
class Table extends Module {

	/**
	 * constructor for floor
	 * @param ConnID {String} 32 character string of connection ID
	 * @param ConnUserID {String} 32 character string of user ID
	 */
	constructor(ConnID = null, ConnUserID = null) {
		super(ConnID, ConnUserID);
		this.pk = 'TableID';
		this.table = 'innoTable';
		this.view = 'viewTable';
		this.fields = {}
	}

}

module.exports = Table;