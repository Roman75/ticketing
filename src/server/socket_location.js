import Helpers from './helpers';
import Location from './modules/location/location'

class SocketLocation extends Helpers {

	/**
	 * constructor for list socket events<br>
	 * @param client {Object} socket.io connection object
	 */
	constructor(client) {
		super();
		this._client = client;
		this.onCreate();
		this.onUpdate();
		this.onDelete();
		this.onFetch();
	}

	/**
	 * location create<br>
	 * create new location
	 * @example
	 * socket.on('location-create', (res)=>{console.log(res);});
	 * socket.on('location-create-err', (err)=>{console.log(err);});
	 * socket.emit('location-create', {
	 *	'LocationID': null,
	 *	'LocationName': '',
	 *	'LocationStreet': '',
	 *	'LocationCity': '',
	 *	'LocationZIP': '',
	 *	'LocationCountryCountryISO2': '',
	 *	'LocationPhone1': '',
	 *	'LocationPhone2': '',
	 *	'LocationFax': '',
	 *	'LocationEmail': '',
	 *	'LocationHomepage': ''
	 * });
	 * @param client {Object} socket.io connection object
	 */
	onCreate(client) {
		const evt = 'location-create';
		this._client.on(evt, (req) => {
			const location = new Location(this._client.id, this._client.userdata.UserID);
			location.create(req).then((res) => {
				this._client.emit(evt, res);
				this.logSocketMessage(this._client, evt, res);
			}).catch((err) => {
				this._client.emit(evt + '-err', err);
				this.logSocketError(this._client, evt, err);
			});
		});
	}

	/**
	 * location update<br>
	 * update existing location
	 * @example
	 * socket.on('location-update', (res)=>{console.log(res);});
	 * socket.on('location-update-err', (err)=>{console.log(err);});
	 * socket.emit('location-update', {
	 *	'LocationID': 'ID of existing location',
	 *	'LocationName': '',
	 *	'LocationStreet': '',
	 *	'LocationCity': '',
	 *	'LocationZIP': '',
	 *	'LocationCountryCountryISO2': '',
	 *	'LocationPhone1': '',
	 *	'LocationPhone2': '',
	 *	'LocationFax': '',
	 *	'LocationEmail': '',
	 *	'LocationHomepage': ''
	 * });
	 * @param client {Object} socket.io connection object
	 */
	onUpdate(client) {
		const evt = 'location-update';
		this._client.on(evt, (req) => {
			const location = new Location(this._client.id, this._client.userdata.UserID);
			location.update(req).then((res) => {
				this._client.emit(evt, res);
				this.logSocketMessage(this._client, evt, res);
			}).catch((err) => {
				this._client.emit(evt + '-err', err);
				this.logSocketError(this._client, evt, err);
			});
		});
	}

	/**
	 * location delete<br>
	 * delete existing location
	 * @example
	 * socket.on('location-delete', (res)=>{console.log(res);});
	 * socket.on('location-delete-err', (err)=>{console.log(err);});
	 * socket.emit('location-delete', LocationID);
	 * @param client {Object} socket.io connection object
	 */
	onDelete(client) {
		const evt = 'location-delete';
		this._client.on(evt, (id) => {
			const location = new Location(this._client.id, this._client.userdata.UserID);
			location.delete(id).then((res) => {
				this._client.emit(evt, id);
				this.logSocketMessage(this._client, evt, res);
			}).catch((err) => {
				this._client.emit(evt + '-err', err);
				this.logSocketError(this._client, evt, err);
			});
		});
	}

	/**
	 * location fetch<br>
	 * fetch location
	 * @example
	 * socket.on('location-fetch', (res)=>{console.log(res);});
	 * socket.on('location-fetch-err', (err)=>{console.log(err);});
	 * socket.emit('location-fetch', LocationID);
	 * @param client {Object} socket.io connection object
	 */
	onFetch(client) {
		const evt = 'location-fetch';
		this._client.on(evt, (id) => {
			const location = new Location(this._client.id, this._client.userdata.UserID);
			location.fetch(id).then((res) => {
				this._client.emit(evt, res);
				this.logSocketMessage(this._client, evt, res);
			}).catch((err) => {
				this._client.emit(evt + '-err', err);
				this.logSocketError(this._client, evt, err);
			});
		});
	}

}

module.exports = SocketLocation;
