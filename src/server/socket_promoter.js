import Helpers from './helpers';
import Promoter from './modules/promoter/promoter'

class SocketPromoter extends Helpers {

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
	 * promoter create<br>
	 * create new promoter
	 * @example
	 * socket.on('promoter-create', (res)=>{console.log(res);});
	 * socket.on('promoter-create-err', (err)=>{console.log(err);});
	 * socket.emit('promoter-create', {
	 *	'PromoterID': null,
	 *	'PromoterName': '',
	 *	'PromoterStreet': '',
	 *	'PromoterCity': '',
	 *	'PromoterZIP': '',
	 *	'PromoterCountryCountryISO2': '',
	 *	'PromoterPhone1': '',
	 *	'PromoterPhone2': '',
	 *	'PromoterFax': '',
	 *	'PromoterEmail': '',
	 *	'PromoterHomepage': '',
	 *	'PromoterLocations': '',
	 *	'PromoterPromoters': '',
	 *	'PromoterPromotersActive': ''
	 * });
	 * @param client {Object} socket.io connection object
	 */
	onCreate() {
		const evt = 'promoter-create';
		this._client.on(evt, (req) => {
			const promoter = new Promoter(this._client.id, this._client.userdata.UserID);
			promoter.create(req).then((res) => {
				this._client.emit(evt, res);
				this.logSocketMessage(this._client, evt, res);
			}).catch((err) => {
				this._client.emit(evt + '-err', err);
				this.logSocketError(this._client, evt, err);
			});
		});
	}

	/**
	 * promoter update<br>
	 * update existing promoter
	 * @example
	 * socket.on('promoter-update', (res)=>{console.log(res);});
	 * socket.on('promoter-update-err', (err)=>{console.log(err);});
	 * socket.emit('promoter-update', {
	 *	'PromoterID': 'ID of existing promoter',
	 *	'PromoterName': '',
	 *	'PromoterStreet': '',
	 *	'PromoterCity': '',
	 *	'PromoterZIP': '',
	 *	'PromoterCountryCountryISO2': '',
	 *	'PromoterPhone1': '',
	 *	'PromoterPhone2': '',
	 *	'PromoterFax': '',
	 *	'PromoterEmail': '',
	 *	'PromoterHomepage': '',
	 *	'PromoterLocations': '',
	 *	'PromoterPromoters': '',
	 *	'PromoterPromotersActive': ''
	 * });
	 * @param client {Object} socket.io connection object
	 */
	onUpdate() {
		const evt = 'promoter-update';
		this._client.on(evt, (req) => {
			const promoter = new Promoter(this._client.id, this._client.userdata.UserID);
			promoter.update(req).then((res) => {
				this._client.emit(evt, res);
				this.logSocketMessage(this._client, evt, res);
			}).catch((err) => {
				this._client.emit(evt + '-err', err);
				this.logSocketError(this._client, evt, err);
			});
		});
	}

	/**
	 * promoter delete<br>
	 * delete existing promoter
	 * @example
	 * socket.on('promoter-delete', (res)=>{console.log(res);});
	 * socket.on('promoter-delete-err', (err)=>{console.log(err);});
	 * socket.emit('promoter-delete', PromoterID);
	 * @param client {Object} socket.io connection object
	 */
	onDelete() {
		const evt = 'promoter-delete';
		this._client.on(evt, (id) => {
			const promoter = new Promoter(this._client.id, this._client.userdata.UserID);
			promoter.delete(id).then((res) => {
				this._client.emit(evt, id);
				this.logSocketMessage(this._client, evt, res);
			}).catch((err) => {
				this._client.emit(evt + '-err', err);
				this.logSocketError(this._client, evt, err);
			});
		});
	}

	/**
	 * promoter fetch<br>
	 * fetch promoter
	 * @example
	 * socket.on('promoter-fetch', (res)=>{console.log(res);});
	 * socket.on('promoter-fetch-err', (err)=>{console.log(err);});
	 * socket.emit('promoter-fetch', PromoterID);
	 * @param client {Object} socket.io connection object
	 */
	onFetch() {
		const evt = 'promoter-fetch';
		this._client.on(evt, (id) => {
			const promoter = new Promoter(this._client.id, this._client.userdata.UserID);
			promoter.fetch(id).then((res) => {
				this._client.emit(evt, res);
				this.logSocketMessage(this._client, evt, res);
			}).catch((err) => {
				this._client.emit(evt + '-err', err);
				this.logSocketError(this._client, evt, err);
			});
		});
	}

}

module.exports = SocketPromoter;
