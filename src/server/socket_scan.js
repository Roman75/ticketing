import Helpers from './helpers';
import Scan from './modules/scan/scan'

class SocketScan extends Helpers {

	/**
	 * constructor for list socket events<br>
	 * @param client {Object} socket.io connection object
	 */
	constructor(client) {
		super();
		this._client = client;
		this.onCreate();
	}

	/**
	 * scan create<br>
	 * create a new scan
	 * @param client {Object} socket.io connection object
	 */
	onCreate(client) {
		const evt = 'scan-create';
		this._client.on(evt, (req) => {
			const scan = new Scan(this._client.id, this._client.userdata.UserID);
			scan.create(req).then((res) => {
				this._client.emit(evt, res);
				this.logSocketMessage(this._client, evt, res);
			}).catch((err) => {
				this._client.emit(evt + '-err', err);
				this.logSocketError(this._client, evt, err);
			});
		});

	}

}

module.exports = SocketScan;