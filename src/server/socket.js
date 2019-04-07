import Io from 'socket.io';
import Helpers from './helpers';
import numeral from 'numeral';
import _ from 'lodash';
import randtoken from 'rand-token';
import SmtpClient from './mail/smtp_client';

// modules
import Base from './modules/base/base'
import Translation from './modules/translation/translation'
import User from './modules/user/user'
import List from './modules/list/list'
import Form from './modules/form/form'
import Event from './modules/event/event'
import Order from './modules/order/order'
import Floor from './modules/floor/floor'

const logPrefix = 'SOCKET  ';

/**
 * socket.io server connections<br>
 * <br>
 * IMPORTANT INFORMATION!<br>
 * the examples which are shown here are for client side communication whith this server NOT for development<br>
 *
 * @extends Helpers
 * @example
 * // use this code in your website
 * <html>
 *    <head>
 *        <script type="text/javascript" src="/socket.io/socket.io.js"></script>
 *        <script type="text/javascript">
 *          socket = io('localhost', {
 *              transports: ['websocket']
 *          });
 *        </script>
 *    </head>
 * </html>
 */
class Socket extends Helpers {

	/**
	 * basic class for socket server
	 * @param config {Object} configuration settings from ./../.config.yaml
	 */
	constructor(config) {
		super();

		if (config) {
			this._config = config;
		}

		this._clients = 0;

		// base, translation and account
		const base = new Base();
		base.init().then(() => {
			this.translation = new Translation();
			this.translation.init();
		}).then(() => {

			this._io = Io(this._config.http);
			this._io.on('connection', client => {

				// initialize a new client connection
				this.connect(client);

				// Basic Events
				this.disconnect(client);
				this.setLangCode(client);

				// User Events
				this.userCreate(client);
				this.userUpdate(client);
				this.userDelete(client);

				// User Login/Logout Events
				this.userLogin(client);
				this.userLogout(client);
				this.userLogoutByToken(client);

				// FE List Events
				this.listCreate(client);
				this.listUpdate(client);
				this.listDelete(client);
				this.listInit(client);
				this.listFetch(client);

				// FE Form Events
				this.formInit(client);

				// Floor Events
				this.floorCreate(client);
				this.floorUpdate(client);
				this.floorDelete(client);
				this.floorFetch(client);

			});
		}).catch((err) => {
			console.log(err);
		});

	}

	/**
	 * connection<br>
	 * a new websocket client has connected to the server<br>
	 * update count and save connection data to database table `memClientConn`
	 * @param client {Object} socket.io connection object
	 */
	connect(client) {

		client.userdata = {
			UserID: null,
			ConnToken: randtoken.generate(32),
			LangCode: this._detectLang(client.handshake)
		}

		let values = {
			'ClientConnID': client.id,
			'ClientConnToken': client.userdata.ConnToken,
			'ClientConnLangCode': client.userdata.LangCode,
			'ClientConnAddress': (client.handshake && client.handshake.address) ? client.handshake.address : '',
			'ClientConnUserAgent': (client.handshake && client.handshake.headers && client.handshake.headers["user-agent"]) ? client.handshake.headers["user-agent"] : ''
		};

		const base = new Base(client.id, client.userdata.UserID);
		base.connection(values).then(() => {
			this._clients++;
			this._logMessage(client, 'client connected', client.handshake);
		}).catch((err) => {
			this._logError(client, 'connection', err);
		});
	}

	/**
	 * disconnect<br>
	 * client disconnected from server
	 * reduce number of connections and delete entry from database table `memClientConn`
	 * @param client {Object} socket.io connection object
	 */
	disconnect(client) {
		const evt = 'disconnect';
		client.on(evt, () => {
			const base = new Base(client.id, client.userdata.UserID);
			base.disconnect().then(() => {
				this._clients--;
				this._logMessage(client, evt);
			}).catch((err) => {
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * set language for connected client<br>
	 * available language are stored in database table `feLang`
	 * @example
	 * socket.on('set-language', (res)=>{console.log(res);}); // the language for this client was set
	 * socket.emit('set-language', langCode); // sets the actual language for this connected client
	 * @param client {Object} socket.io connection object
	 */
	setLangCode(client) {
		const evt = 'set-language';
		client.on(evt, (LangCode) => {
			const base = new Base(client.id, client.userdata.UserID);
			base.setConnectionLanguage(LangCode).then((res) => {
				client.emit(evt, true);
				this._logMessage(client, evt, LangCode);
			}).catch((err) => {
				console.log(err);
			});
		});
	}

	/**
	 * user create<br>
	 * create new user
	 * socket.on('user-create', (res)=>{console.log(res);}); // login success
	 * socket.on('user-create-err', (err)=>{console.log(err);}); // login error
	 * socket.emit('user-create', {
	 * 	'UserType': null,						// null = normal user (customer), 'admin' = administrator, 'promoter' = promoter
	 * 	'UserEmail': 'test1.test1@test1.at',
	 * 	'UserLangCode': 'de-at',
	 * 	'UserCompany': 'Test 1',
	 * 	'UserCompanyUID': 'AT Test 1',
	 * 	'UserGender': 'm',
	 * 	'UserTitle': 'Dr.',
	 * 	'UserFirstname': 'Test First Name 1',
	 * 	'UserLastname': 'Test Last Name 1',
	 * 	'UserStreet': 'Test Street 1',
	 * 	'UserCity': 'Test City 1',
	 * 	'UserZIP': '1234',
	 * 	'UserCountryCountryISO2': 'AT',
	 * 	'UserPassword': cryptPassword('abcdefg1'),
	 * 	'UserPasswordCheck': cryptPassword('abcdefg1')
	 * });
	 * @param client {Object} socket.io connection object
	 */
	userCreate(client) {
		const evt = 'user-create';
		client.on(evt, (req) => {
			const user = new User(client.id, client.userdata.UserID);
			user.create(req).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt, res);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * user update<br>
	 * update existing user
	 * @example
	 * socket.on('user-create', (res)=>{console.log(res);}); // login success
	 * socket.on('user-create-err', (err)=>{console.log(err);}); // login error
	 * socket.emit('user-create', {
	 * 	'UserID': 'ID of existing user',
	 * 	'UserType': null,									// null = normal user (customer), 'admin' = administrator, 'promoter' = promoter
	 * 	'UserEmail': 'test1.test1@test1.at',
	 * 	'UserLangCode': 'de-at',
	 * 	'UserCompany': 'Company 1',
	 * 	'UserCompanyUID': 'AT Test 1',
	 * 	'UserGender': 'm',									// m = male, f = female
	 * 	'UserTitle': 'Dr.',
	 * 	'UserFirstname': 'First Name 1',
	 * 	'UserLastname': 'Last Name 1',
	 * 	'UserStreet': 'Street 1',
	 * 	'UserCity': 'City 1',
	 * 	'UserZIP': '1234',
	 * 	'UserCountryCountryISO2': 'AT',
	 * 	'UserPassword': cryptPassword('abcdefg1!'),			// (md5(sha256(UserPassword))) https://github.com/emn178/js-sha256 and https://github.com/blueimp/JavaScript-MD5/blob/master/js/md5.min.js
	 * 	'UserPasswordCheck': cryptPassword('abcdefg1!')
	 * });
	 * @param client {Object} socket.io connection object
	 */
	userUpdate(client) {
		const evt = 'user-update';
		client.on(evt, (req) => {
			const user = new User(client.id, client.userdata.UserID);
			user.update(req).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt, res);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * user delete<br>
	 * delete existing user
	 * @example
	 * socket.on('user-delete', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('user-delete-err', (err)=>{console.log(err);}); // error
	 * socket.emit('user-delete', 'ID of existing user');
	 * @param client {Object} socket.io connection object
	 */
	userDelete(client) {
		const evt = 'user-delete';
		client.on(evt, (id) => {
			const user = new User(client.id, client.userdata.UserID);
			user.delete(id).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt, res);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * user login<br>
	 * updates database table `memClientConn`
	 * @example
	 * socket.on('user-login', (res)=>{console.log(res);}); // login success
	 * socket.on('user-login-err', (err)=>{console.log(err);}); // login error
	 * socket.on('user-login-token', (res)=>{console.log(res);}); // login success but already logged in on other device. use user-logout-token to logout from other device
	 * socket.emit('user-login', {'UserEmail':email,'UserPassword':md5(sha256(password))}); // send login request
	 * @param client {Object} socket.io connection object
	 */
	userLogin(client) {
		const evt = 'user-login';
		client.on(evt, (req) => {
			const user = new User(client.id, client.userdata.UserID);
			user.login(req).then((res) => {
				client.lang = res.UserLangCode;
				if (!res.LogoutToken) {
					client.userdata.UserID = res.UserID;
					client.userdata.LangCode = res.UserLangCode;
					client.emit(evt, res);
					this._logMessage(client, evt, req);
				} else {
					client.emit('user-login-token', res.LogoutToken);
					this._logMessage(client, 'user-logout-token', req);
				}
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt + '-err', req);
			});
		});
	}

	/**
	 * user logout<br>
	 * updates database table `memClientConn`
	 * @example
	 * socket.on('user-logout', (res)=>{console.log(res);}); // logout success
	 * socket.emit('user-logout', null); // send logout request
	 * @param client {Object} socket.io connection object
	 */
	userLogout(client) {
		const evt = 'user-logout';
		client.on(evt, () => {
			const user = new User(client.id, client.userdata.UserID);
			user.logout().then((res) => {
				client.emit(evt, true);
				this._logMessage(client, evt);
			}).catch((err) => {
				client.emit(evt, err);
				this._logError(client, evt);
			});
		});
	}

	/**
	 * user logout by token<br>
	 * updates database table `memClientConn`
	 * @example
	 * socket.on('user-logout-token', (res)=>{console.log(res);}); // user was logged out by token (effects all connected devices which where logged in with that user data)
	 * socket.emit('user-logout-token', token); // send token logout request. the value 'token' 128 characters was send by server on login request when a user tried to log in but was logged in on other device (mobile phone, browser tab, ...)
	 * @param client {Object} socket.io connection object
	 */
	userLogoutByToken(client) {
		const evt = 'user-logout-token';
		client.on(evt, (LogoutToken) => {
			const user = new User(client.id, client.userdata.UserID);
			user.logoutToken(LogoutToken).then((res) => {
				_.each(res, (row) => {
					this._io.to(`${row.ClientConnID}`).emit('user-logout', false);
					this._io.to(`${row.ClientConnID}`).emit('user-logout', true);
				});
				client.emit('user-logout', false);
			}).catch((err) => {
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * list create<br>
	 * create new list
	 * @example
	 * socket.on('list-create', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('list-create-err', (err)=>{console.log(err);}); // error
	 * socket.emit('list-create', {
	 *	'ListName': 'Name',
	 *	'ListLabel': '§§LISTNAME',
	 *	'ListTable': 'database Table Name',
	 *	'ListPK': 'Name',
	 *	'ListMaskID': 'MaskID',
	 *	'ListLimit': 100,
	 *	'ListJSON': {"orderby": [{"FieldName1": ""}, {"FieldName2": "desc"}, {"FieldName3": ""}], "editable": 0},
	 *	'ListColumn': [{
	 *		'ListColumnOrder': 1,
	 *		'ListColumnName': 'Column_1',
	 *		'ListColumnType': 'text',
	 *		'ListColumnWidth': 150,
	 *		'ListColumnEditable': 0,
	 *		'ListColumnLabel': '§§Column1',
	 *		'ListColumnJSON': '{}'
	 *	}, {
	 *		'ListColumnOrder': 2,
	 *		'ListColumnName': 'Column_2',
	 *		'ListColumnType': 'text',
	 *		'ListColumnWidth': 150,
	 *		'ListColumnEditable': 0,
	 *		'ListColumnLabel': '§§Column2',
	 *		'ListColumnJSON': '{}'
	 *	}
	 * });
	 * @param client {Object} socket.io connection object
	 */
	listCreate(client) {
		const evt = 'list-create';
		client.on(evt, (req) => {
			const list = new List(client.id, client.userdata.UserID);
			list.create(req).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt, res);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * list update<br>
	 * update existing list
	 * @example
	 * socket.on('list-update', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('list-update-err', (err)=>{console.log(err);}); // error
	 * socket.emit('list-update', {
	 *	'ListID': 'ID of existing list',
	 *	'ListName': 'Name',
	 *	'ListTable': 'database Table Name',
	 *	'ListPK': 'Name',
	 *	'ListMaskID': 'MaskID',
	 *	'ListLimit': 100,
	 *	'ListJSON': {"orderby": [{"FieldName1": ""}, {"FieldName2": "desc"}, {"FieldName3": ""}], "editable": 0},
	 *	'ListColumn': [{
	 *		'ListColumnOrder': 1,
	 *		'ListColumnName': 'Column 1',
	 *		'ListColumnType': 'text',
	 *		'ListColumnWidth': 150,
	 *		'ListColumnEditable': 0,
	 *		'ListColumnLabel': '§§Column1',
	 *		'ListColumnJSON': '{}'
	 *	}, {
	 *		'ListColumnOrder': 2,
	 *		'ListColumnName': 'Column 2',
	 *		'ListColumnType': 'text',
	 *		'ListColumnWidth': 150,
	 *		'ListColumnEditable': 0,
	 *		'ListColumnLabel': '§§Column2',
	 *		'ListColumnJSON': '{}'
	 *	}
	 * });
	 * @param client {Object} socket.io connection object
	 */
	listUpdate(client) {
		const evt = 'list-update';
		client.on(evt, (req) => {
			const list = new List(client.id, client.userdata.UserID);
			list.update(req).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt, res);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * list delete<br>
	 * delete existing list
	 * @example
	 * socket.on('list-delete', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('list-delete-err', (err)=>{console.log(err);}); // error
	 * socket.emit('list-delete', 'ID of existing List');
	 * @param client {Object} socket.io connection object
	 */
	listDelete(client) {
		const evt = 'list-delete';
		client.on(evt, (id) => {
			const list = new List(client.id, client.userdata.UserID);
			list.delete(id).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt, res);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * list init<br>
	 * request a list configuration<br>
	 * @example
	 * socket.on('list-init', (res)=>{console.log(res);}); // response (configuration of list and columns)
	 * socket.on('list-init-err', (err)=>{console.log(err);}); // error
	 * socket.emit('list-init', ListID); // request a list configuration
	 * @param client {Object} socket.io connection object
	 */
	listInit(client) {
		const evt = 'list-init';
		client.on(evt, (ListID) => {
			const list = new List(client.id, client.userdata.UserID);
			list.init(ListID).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * list fetch<br>
	 * fetch list rows<br>
	 * @example
	 * socket.on('list-fetch', (res)=>{console.log(res);}); // response (configuration of list and columns)
	 * socket.on('list-fetch-err', (err)=>{console.log(err);}); // error
	 * socket.emit('list-fetch', {"list-fetch", {"ListID":"feList","from":0,"orderby":null,"orderdesc":false}}); // request list rows
	 * @param client {Object} socket.io connection object
	 */
	listFetch(client) {
		const evt = 'list-fetch';
		client.on(evt, (req) => {
			req = {
				ListID: req.ListID,
				From: req.from,
				OrderBy: req.orderby,
				OrderDesc: req.orderdesc
			}
			const list = new List(client.id, client.userdata.UserID);
			list.fetch(req).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * form init<br>
	 * request a form configuration
	 * @example
	 * socket.on('form-init', (res)=>{console.log(res);}); // response (configuration of form and field)
	 * socket.on('form-init-err', (err)=>{console.log(err);}); // error
	 * socket.emit('form-init', ListID); // request a form configuration
	 * @param client {Object} socket.io connection object
	 */
	formInit(client) {
		const evt = 'form-init';
		client.on(evt, (req) => {
			const form = new Form(client.id, client.userdata.UserID);
			form.init(req.form_id).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * floor create<br>
	 * create a new floor
	 * @example
	 * socket.on('floor-create', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('floor-create-err', (err)=>{console.log(err);}); // error
	 * socket.emit('floor-create', {
	 *	'FloorEventID': 'EventID | null',
	 *	'FloorLocationID': 'LocationID | null',
	 *	'FloorName': 'Name',
	 *	'FloorSVG': 'SVG String | null'
	 * });
	 * @param client {Object} socket.io connection object
	 */
	floorCreate(client) {
		const evt = 'floor-create';
		client.on(evt, (req) => {
			const floor = new Floor(client.id, client.userdata.UserID);
			floor.create(req).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt, res);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * floor fetch<br>
	 * fetch floor
	 * @example
	 * socket.on('floor-fetch', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('floor-fetch-err', (err)=>{console.log(err);}); // error
	 * socket.emit('floor-fetch', FloorID);
	 * @param client {Object} socket.io connection object
	 */
	floorFetch(client) {
		const evt = 'floor-fetch';
		client.on(evt, (id) => {
			const floor = new Floor(client.id, client.userdata.UserID);
			floor.fetch(id).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt, res);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * floor update<br>
	 * update existing floor
	 * @example
	 * socket.on('floor-create', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('floor-create-err', (err)=>{console.log(err);}); // error
	 * socket.emit('floor-create', {
	 *	'FloorID': 'ID of existing floor',
	 *	'FloorEventID': 'EventID | null',
	 *	'FloorLocationID': 'LocationID | null',
	 *	'FloorName': 'Name',
	 *	'FloorSVG': 'SVG String | null'
	 * });
	 * @param client {Object} socket.io connection object
	 */
	floorUpdate(client) {
		const evt = 'floor-update';
		client.on(evt, (req) => {
			const floor = new Floor(client.id, client.userdata.UserID);
			floor.update(req).then((res) => {
				client.emit(evt, res);
				this._logMessage(client, evt, res);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * floor delete<br>
	 * delete existing floor
	 * @example
	 * socket.on('floor-delete', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('floor-delete-err', (err)=>{console.log(err);}); // error
	 * socket.emit('floor-delete', FloorID);
	 * @param client {Object} socket.io connection object
	 */
	floorDelete(client) {
		const evt = 'floor-delete';
		client.on(evt, (id) => {
			const floor = new Floor(client.id, client.userdata.UserID);
			floor.delete(id).then((res) => {
				client.emit(evt, id);
				this._logMessage(client, evt, res);
			}).catch((err) => {
				client.emit(evt + '-err', err);
				this._logError(client, evt, err);
			});
		});
	}

	/**
	 * detect browser language from connection handshake object
	 * @param handshake
	 * @returns {string}
	 * @private
	 */
	_detectLang(handshake) {
		let LangCode = 'en-gb';
		if (handshake && handshake.headers && handshake.headers["accept-language"]) {
			LangCode = handshake.headers["accept-language"];
		}
		return LangCode.toLowerCase().substr(0, 5);
	}

	/**
	 * log message
	 * @param client {Object} socket.io connection object
	 * @param evt {String} event
	 * @param message {Object} message
	 * @private
	 */
	_logMessage(client = null, evt = '', message = '') {
		message = numeral(this._clients).format('0000') + ' => ' + client.id + ' => ' + client.userdata.UserID + ' => ' + evt + ' => ' + JSON.stringify(message);
		log.msg(logPrefix, message);
	}

	/**
	 * log error
	 * @param client {Object} socket.io connection object
	 * @param evt {String} event
	 * @param message {Object} message
	 * @private
	 */
	_logError(client = null, evt = '', message = '') {
		message = numeral(this._clients).format('0000') + ' => ' + client.id + ' => ' + client.userdata.UserID + ' => ' + evt + ' => ' + JSON.stringify(message);
		log.err(logPrefix, message);
	}

};

module.exports = Socket;
