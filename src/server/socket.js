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
				this.clientConnect(client);

				// Basic Events
				this.clientOnDisconnect(client);
				this.clientOnSetLangCode(client);

				// User Events
				this.clientOnUserCreate(client);
				this.clientOnUserUpdate(client);
				this.clientOnUserDelete(client);

				// User Login/Logout Events
				this.clientOnUserLogin(client);
				this.clientOnUserLogout(client);
				this.clientOnUserLogoutToken(client);

				// FE List Events
				this.clientOnListCreate(client);
				this.clientOnListUpdate(client);
				this.clientOnListDelete(client);
				this.clientOnListInit(client);
				this.clientOnListFetch(client);

				// FE Form Events
				this.clientOnFormInit(client);

				// Floor Events
				this.clientOnFloorCreate(client);
				this.clientOnFloorUpdate(client);
				this.clientOnFloorDelete(client);
				this.clientOnFloorFetch(client);

			});
		}).catch((err) => {
			console.log(err);
		});

	}

	/**
	 * initialize a new client connection<br>
	 * a new websocket client has connected to the server<br>
	 * update count and save connection data to database table `memClientConn`
	 * @param client {Object} socket.io connection object
	 */
	clientConnect(client) {

		client._userdata = {
			token: randtoken.generate(32),
			lang: this._detectLang(client.handshake)
		}

		let values = {
			'ClientConnID': client.id,
			'ClientConnToken': client._userdata.token,
			'ClientConnLangCode': client._userdata.lang,
			'ClientConnAddress': (client.handshake && client.handshake.address) ? client.handshake.address : '',
			'ClientConnUserAgent': (client.handshake && client.handshake.headers && client.handshake.headers["user-agent"]) ? client.handshake.headers["user-agent"] : ''
		};

		const base = new Base(client.id);
		base.connection(values).then(() => {
			this._clients++;
			this._logMessage(client, 'client connected', client.handshake);
		}).catch((err) => {
			this._logError(client, 'connection', err);
		});
	}

	/**
	 * a client disconnected from server<br>
	 * reduce number of connections and delete entry from database table `memClientConn`
	 * @param client {Object} socket.io connection object
	 */
	clientOnDisconnect(client) {
		const evt = 'disconnect';
		client.on(evt, () => {
			const base = new Base(client.id);
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
	clientOnSetLangCode(client) {
		const evt = 'set-language';
		client.on(evt, (LangCode) => {
			const base = new Base(client.id);
			base.setConnectionLanguage(LangCode).then((res) => {
				client.emit(evt, true);
				this._logMessage(client, evt, LangCode);
			}).catch((err) => {
				console.log(err);
			});
		});
	}

	/**
	 * create a new user
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
	clientOnUserCreate(client) {
		const evt = 'user-create';
		client.on(evt, (req) => {
			const user = new User(client.id);
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
	clientOnUserUpdate(client) {
		const evt = 'user-update';
		client.on(evt, (req) => {
			const user = new User(client.id);
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
	 * delete existing user
	 * @example
	 * socket.on('user-delete', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('user-delete-err', (err)=>{console.log(err);}); // error
	 * socket.emit('user-delete', 'ID of existing user');
	 * @param client {Object} socket.io connection object
	 */
	clientOnUserDelete(client) {
		const evt = 'user-delete';
		client.on(evt, (id) => {
			const user = new User(client.id);
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
	clientOnUserLogin(client) {
		const evt = 'user-login';
		client.on(evt, (req) => {
			const user = new User(client.id);
			user.login(req).then((res) => {
				client.lang = res.UserLangCode;
				if (!res.LogoutToken) {
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
	clientOnUserLogout(client) {
		const evt = 'user-logout';
		client.on(evt, () => {
			const user = new User(client.id);
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
	clientOnUserLogoutToken(client) {
		const evt = 'user-logout-token';
		client.on(evt, (LogoutToken) => {
			const user = new User(client.id);
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
	 * create a new list
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
	clientOnListCreate(client) {
		const evt = 'list-create';
		client.on(evt, (req) => {
			const list = new List(client.id);
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
	clientOnListUpdate(client) {
		const evt = 'list-update';
		client.on(evt, (req) => {
			const list = new List(client.id);
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
	 * delete existing list
	 * @example
	 * socket.on('list-delete', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('list-delete-err', (err)=>{console.log(err);}); // error
	 * socket.emit('list-delete', 'ID of existing List');
	 * @param client {Object} socket.io connection object
	 */
	clientOnListDelete(client) {
		const evt = 'list-delete';
		client.on(evt, (id) => {
			const list = new List(client.id);
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
	 * request a list configuration<br>
	 * @example
	 * socket.on('list-init', (res)=>{console.log(res);}); // response (configuration of list and columns)
	 * socket.on('list-init-err', (err)=>{console.log(err);}); // error
	 * socket.emit('list-init', ListID); // request a list configuration
	 * @param client {Object} socket.io connection object
	 */
	clientOnListInit(client) {
		const evt = 'list-init';
		client.on(evt, (ListID) => {
			const list = new List(client.id);
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
	 * fetch list rows<br>
	 * @example
	 * socket.on('list-fetch', (res)=>{console.log(res);}); // response (configuration of list and columns)
	 * socket.on('list-fetch-err', (err)=>{console.log(err);}); // error
	 * socket.emit('list-fetch', {"list-fetch", {"ListID":"feList","from":0,"orderby":null,"orderdesc":false}}); // request list rows
	 * @param client {Object} socket.io connection object
	 */
	clientOnListFetch(client) {
		const evt = 'list-fetch';
		client.on(evt, (req) => {
			req = {
				ListID: req.ListID,
				From: req.from,
				OrderBy: req.orderby,
				OrderDesc: req.orderdesc
			}
			const list = new List(client.id);
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
	 * request a form configuration
	 * @example
	 * socket.on('form-init', (res)=>{console.log(res);}); // response (configuration of form and field)
	 * socket.on('form-init-err', (err)=>{console.log(err);}); // error
	 * socket.emit('form-init', ListID); // request a form configuration
	 * @param client {Object} socket.io connection object
	 */
	clientOnFormInit(client) {
		const evt = 'form-init';
		client.on(evt, (req) => {
			const form = new Form(client.id);
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
	clientOnFloorCreate(client) {
		const evt = 'floor-create';
		client.on(evt, (req) => {
			const floor = new Floor(client.id);
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
	 * fetch floor
	 * @example
	 * socket.on('floor-fetch', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('floor-fetch-err', (err)=>{console.log(err);}); // error
	 * socket.emit('floor-fetch', FloorID);
	 * @param client {Object} socket.io connection object
	 */
	clientOnFloorFetch(client) {
		const evt = 'floor-fetch';
		client.on(evt, (id) => {
			const floor = new Floor(client.id);
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
	clientOnFloorUpdate(client) {
		const evt = 'floor-update';
		client.on(evt, (req) => {
			const floor = new Floor(client.id);
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
	 * delete existing floor
	 * @example
	 * socket.on('floor-delete', (res)=>{console.log(res);}); // response (full record)
	 * socket.on('floor-delete-err', (err)=>{console.log(err);}); // error
	 * socket.emit('floor-delete', FloorID);
	 * @param client {Object} socket.io connection object
	 */
	clientOnFloorDelete(client) {
		const evt = 'floor-delete';
		client.on(evt, (id) => {
			const floor = new Floor(client.id);
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
	 * handle actions from clients
	 * @param client
	 * @private
	 */
	_actions(client) {
		/*

		client.on('register', (req) => {
			client.type = req.type;
			client.emit('register');
			client.emit('translation-fetch', db.translation.fetch(client.lang));
			this._logMessage(client, 'register', req);
		});

		client.on('language-set', (req) => {
			db.base.setLanguage(_.extend(req, {'ClientConnID': client.id})).then((res) => {
				client.lang = res.LangCode;
				client.emit('language-set');
				client.emit('translation-fetch', db.translation.fetch(client.lang));
				this._logMessage(client, 'language-set', req);
			}).catch(err => {
				client.emit('language-set', err);
				this._logError(client, 'language-set', err);
			});
		});

		client.on('language-fetch', (req) => {
			db.base.fetchLanguage(req).then((res) => {
				client.emit('language-fetch', res);
				this._logMessage(client, 'langauge-fetch', req);
			}).catch(err => {
				client.emit('language-fetch', err);
				this._logError(client, 'langauge-fetch', err);
			});
		});

		client.on('translation-set', (req) => {
			db.translation.set(req.LangCode, req.Token, req.Value);
		});

		client.on('translation-fetch', (req) => {
			let LangCode = req.LangCode ? req.LangCode : client.lang;
			client.emit('translation-fetch', db.translation.fetch(LangCode));
			this._logMessage(client, 'translation-fetch');
		});

		client.on('translation-fetch-group', (req) => {
			let LangCode = req.LangCode ? req.LangCode : client.lang;
			let TransGroupID = req.TransGroupID ? req.TransGroupID : null;
			db.translation.fetchGroup(LangCode, TransGroupID).then((res) => {
				client.emit('translation-fetch-group', res);
				this._logMessage(client, 'translation-fetch-group', res);
			}).catch((err) => {
				client.emit('translation-fetch-group', err);
				this._logError(client, 'translation-fetch-group', err);
			});
		});

		client.on('user-create', (req) => {
			this._logMessage(client, 'user-create', req);
			db.account.create(req).then(() => {
				client.emit('user-create');
				// TODO: send confirmation email
				let smtpClient = new SmtpClient(this._config.mail.smtp);

				smtpClient.sendPromise().then((res) => {
					console.log('socket.js', 'res', res);
				}).catch((err) => {
					console.log('socket.js', 'err', err);
				});

			}).catch((err) => {
				client.emit('user-create', err);
				this._logError(client, 'user-create', err);
			});
		});

		client.on('user-fetch', (req) => {
			this._logMessage(client, 'user-fetch', req);
			db.account.fetch(req).then((res) => {
				client.emit('user-fetch', res);
			}).catch((err) => {
				console.log(err);
				this._logError(client, 'user-fetch', err);
			});
		});

		client.on('user-update', (req) => {
			this._logMessage(client, 'user-update', req);
			db.account.update(req).then((res) => {
				client.emit('user-update', res);
			}).catch((err) => {
				console.log(err);
				this._logError(client, 'user-update', err);
			});
		});


		client.on('list-fetch', (req) => {
			db.list.fetch(req).then((res) => {
				client.emit('list-fetch', res);
			}).catch((err) => {
				console.log(err);
				this._logError(client, 'list-fetch', err);
			});
		});

		client.on('form-init', (req) => {
			this._logMessage(client, 'form-init', req);
			db.form.init(req.form_id).then((res) => {
				_.each(res.fields, (field) => {
					field.label = db.translation.get(client.lang, field.label);
				});
				client.emit('form-init', res);
			}).catch((err) => {
				console.log(err);
				this._logError(client, 'form-init', err);
			});
		});

		client.on('order-create', (req) => {
			this._logMessage(client, 'order-create', req);
			db.order.create(req).then((res) => {
				client.emit('order-create', res);
			});
		});


		client.on('user-fetch', (req) => {
			this._logMessage(client, 'user-fetch', req);
			Db.getConnection((err, db) => {
				if (!err) {
					const account = new ActionAccount({
						'io': io,
						'client': client,
						'db': db,
						'req': req
					});
					account.fetch();
				} else {
					this._err(err);
				}
			});
		});

		client.on('user-update', (req) => {
			this._logMessage(client, 'user-update', req);
			Db.getConnection((err, db) => {
				if (!err) {
					const account = new ActionAccount({
						'io': io,
						'client': client,
						'db': db,
						'req': req
					});
					account.update();
				} else {
					this._err(err);
				}
			});
		});

		client.on('list-init', (req) => {
			this._logMessage(client, 'list-init', req);
			Db.getConnection((err, db) => {
				if (!err) {
					const list = new ActionList({
						'io': io,
						'client': client,
						'db': db,
						'Db': Db,
						'req': req
					});
					list.init();
				} else {
					this._err(err);
				}
			});
		});

		client.on('list-fetch', (req) => {
			this._logMessage(client, 'list-fetch', req);
			Db.getConnection((err, db) => {
				if (!err) {
					const list = new ActionList({
						'io': io,
						'client': client,
						'db': db,
						'Db': Db,
						'req': req
					});
					list.fetch();
				} else {
					this._err(err);
				}
			});
		});

		client.on('form-init', (req) => {
			this._logMessage(client, 'form-init', req);
			Db.getConnection((err, db) => {
				if (!err) {
					const form = new ActionForm({
						'io': io,
						'client': client,
						'db': db,
						'Db': Db,
						'req': req
					});
					form.init();
				} else {
					this._err(err);
				}
			});
		});

		client.on('record-fetch', (req) => {
			this._logMessage(client, 'record-fetch', req);
			Db.getConnection((err, db) => {
				if (!err) {
					const record = new ActionRecord({
						'io': io,
						'client': client,
						'db': db,
						'Db': Db,
						'req': req
					});
					record.fetch();
				} else {
					this._err(err);
				}
			});
		});

		client.on('mask-fetch', (req) => {
			this._logMessage(client, 'record-fetch', req);
			Db.getConnection((err, db) => {
				if (!err) {
					const mask = new ActionMask({
						'io': io,
						'client': client,
						'db': db,
						'Db': Db,
						'req': req
					});
					mask.fetch();
				} else {
					this._err(err);
				}
			});
		});
		*/

	}

	_detectLang(handshake) {
		let LangCode = 'en-gb';
		if (handshake && handshake.headers && handshake.headers["accept-language"]) {
			LangCode = handshake.headers["accept-language"];
		}
		return LangCode.toLowerCase().substr(0, 5);
	}

	_logMessage(client = null, evt = '', message = '') {
		message = numeral(this._clients).format('0000') + ' client(s) => ' + client.id + ' => ' + evt + ' => ' + JSON.stringify(message);
		log.msg(logPrefix, message);
	}

	_logError(client = null, evt = '', message = '') {
		message = numeral(this._clients).format('0000') + ' client(s) => ' + client.id + ' => ' + evt + ' => ' + JSON.stringify(message);
		log.err(logPrefix, message);
	}

};

module.exports = Socket;
