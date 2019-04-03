import Module from './../module';
import sha512 from 'hash.js/lib/hash/sha/512';
import randtoken from "rand-token";
import _ from 'lodash';


/**
 * user actions
 */
class User extends Module {

	/**
	 * validation for user fields<br>
	 * {'UserEmail': {'type': 'email', 'length': 200, 'empty': false},<br>
	 * 'UserType': {'type': 'enum', 'values': [null, 'admin', 'promoter']},<br>
	 * 'UserFirstname': {'type': 'string', 'length': 20, 'empty': false},<br>
	 * 'UserLastname': {'type': 'string', 'length': 20, 'empty': false}}
	 * @constant
	 * @default
	 */
	static get fields() {
		return {
			'UserEmail': {'type': 'email', 'length': 200, 'empty': false},
			'UserType': {'type': 'enum', 'values': [null, 'admin', 'promoter']},
			'UserFirstname': {'type': 'string', 'length': 20, 'empty': false},
			'UserLastname': {'type': 'string', 'length': 20, 'empty': false}
		};
	}

	/**
	 * login
	 * @param values
	 * @returns {Promise<any>}
	 */
	login(ClientID, values) {

		return new Promise((resolve, reject) => {

			let UserID = '';
			let UserFirstname = '';
			let UserLastname = '';
			let UserLangCode = '';
			let LogoutToken = null;

			let UserEmail = values.UserEmail;
			let UserPassword = values.UserPassword;
			let ClientClientID = values.ClientClientID;

			let fields = ['UserPasswordSalt'];
			let where = {'UserEmail': UserEmail};

			db.promiseSelect('innoUser', fields, where).then((res) => {
				if (!_.size(res)) {
					throw this.getError(1000);
				} else {
					let fields = ['UserID', 'UserLangCode', 'UserFirstname', 'UserLastname'];
					let values = {'UserEmail': UserEmail, 'UserPassword': sha512().update(UserPassword + res[0].UserPasswordSalt).digest('hex')};
					return db.promiseSelect('innoUser', fields, values);
				}
			}).then((res) => {
				if (!_.size(res)) {
					throw this.getError(1001);
				} else {
					UserID = res[0].UserID;
					UserFirstname = res[0].UserFirstname;
					UserLastname = res[0].UserLastname;
					UserLangCode = res[0].UserLangCode;
					return db.promiseSelect('memClientConn', ['ClientClientID'], {'ClientConnUserID': UserID});
				}
			}).then((res) => {
				let data = {'ClientConnUserID': UserID, 'ClientConnLangCode': UserLangCode};
				let where = {'ClientClientID': ClientClientID};
				if (_.size(res)) {
					LogoutToken = randtoken.generate(128);
					data = {'ClientConnLogoutToken': LogoutToken};
					where = {'ClientClientID': res[0].ClientClientID};
				}
				return db.promiseUpdate('memClientConn', data, where);
			}).then((res) => {
				resolve({
					'LogoutToken': LogoutToken,
					'UserLangCode': UserLangCode,
					'UserFirstname': UserFirstname,
					'UserLastname': UserLastname
				});
			}).catch((err) => {
				reject(err);
			});
		});
	}

	/**
	 * logout
	 * @param {array} values
	 * @returns {Promise<any>}
	 */
	logout(ClientClientID) {
		return db.promiseUpdate('memClientConn', {'ClientConnUserID': null}, {'clientClientID': ClientClientID});
	}

	/**
	 * logout all other users by token
	 * @param values
	 * @returns {Promise<any>}
	 */
	logoutToken(ClientID, LogoutToken) {

		return new Promise((resolve, reject) => {

			let table = 'memClientConn';
			let fields = ['ClientClientID'];
			let where = {'ClientConnLogoutToken': LogoutToken};
			let ret = [];

			db.promiseSelect(table, fields, where).then((res) => {
				if (!_.size(res)) {
					throw this.getError(1002);
				} else {
					ret = res;
					let data = {'ClientConnUserID': null};
					let where = {'ClientConnLogoutToken': LogoutToken};
					return db.promiseUpdate(table, data, where);
				}
			}).then(() => {
				resolve(ret);
			}).catch((err) => {
				reject(err);
			});
		});
	}

	/**
	 * logout-token expired
	 * @param values
	 * @returns {Promise<any>}
	 */
	logoutTokenExpired(ClientID, values) {
		return new Promise((resolve, reject) => {
			let sql = 'UPDATE memClientConn SET ClientConnLogoutToken = null WHERE ClientConnLogoutToken = ?';
			this._queryPromise(sql, values).then((res) => {
				resolve(res.changedRows);
			}).catch((err) => {
				console.log(err);
				reject(err);
			});
		});
	}

	/**
	 * create a new user
	 * @param values
	 * @returns {Promise<any>}
	 */
	create(ClientID, values) {
		/*
		return new Promise((resolve, reject) => {

			const err = this._validator(fields, values);
			const UserID = this._generateUUID();

			if (!err.length) {
				let sql = 'SELECT UserID FROM innoUser WHERE UserEmail = ?';
				this._queryPromise(sql, [values.UserEmail]).then((res) => {
					if (!res.length) {

						const hashes = this._hashPassword(values.UserPassword);
						sql = 'INSERT INTO innoUser (UserID,UserEmail,UserPassword,UserPasswordSalt,UserFirstname,UserLastname) VALUES (?,?,?,?,?,?)';

						return this._queryPromise(sql, [UserID, values.UserEmail, hashes.password, hashes.salt, values.UserFirstname, values.UserLastname]);
					} else {
						reject({'nr': 1001, 'message': 'Email already exists'});
					}
				}).then((res, err) => {
					resolve(UserID);
				}).catch((err) => {
					console.log(err);
					reject(err);
				});
			} else {
				reject(err);
			}
		});

		 */
	}

	/**
	 * update user
	 * @param values
	 * @returns {Promise<any>}
	 */
	update(ClientID, values) {
		/*
		return new Promise((resolve, reject) => {

			const err = this._validator(fields, values);

			if (!err.length) {
				let sql = 'UPDATE innoUser SET `UserEmail` = ?, `UserFirstname` = ?, `UserLastname` = ?, `UserType` = ? WHERE `UserID` = ?';
				values = [values.UserEmail, values.UserFirstname, values.UserLastname, values.UserType, values.UserID];
				this._queryPromise(sql, values).then((res) => {
					if (res.changedRows && res.affectedRows) {
						resolve();
					} else if (!res.changedRows && res.affectedRows) {
						reject({'nr': 1006, 'message': 'Nothing changed!'});
					} else if (!res.affectedRows) {
						reject({'nr': 1006, 'message': 'User not found!'});
					} else {
						reject({'nr': 9999, 'message': 'Unknown error!'});
					}
				}).catch((err) => {
					console.log(err);
					reject(err);
				});
			} else {
				reject(err);
			}
		});

		 */
	}

	/**
	 * delete user
	 * @param values
	 * @returns {*}
	 */
	delete(ClientID, values) {
		/*
		return new Promise((resolve, reject) => {
			let sql = 'DELTE FROM innoUser WHERE `UserID` = ?';
			this._queryPromise(sql, [values.UserID]).then((res) => {
				if (res.affectedRows) {
					resolve();
				} else {
					reject({'nr': 1008, 'message': 'Could not delete User!'});
				}
			}).catch((err) => {
				console.log(err);
				reject(err);
			});
		});

		 */
	}

	/**
	 * fetch onw specific user by UserID
	 * @param values {Object} eg {'UserID':uuid}
	 * @returns {Promise<any>}
	 */
	fetch(ClientID, values) {
		/*
		return new Promise((resolve, reject) => {

			let sql = 'SELECT * FROM innoUser WHERE UserID = ?';
			this._queryPromise(sql, [values.UserID]).then((res) => {
				if (res.length === 1) {
					var row = res[0];
					delete row.UserID;
					delete row.UserPassword;
					delete row.UserPasswordSalt;
					resolve(row);
				} else {
					reject({'nr': 1003, 'message': 'User not found'});
				}
			}).catch((err) => {
				console.log(err);
				reject(err);
			});
		});

		 */
	}

	/**
	 * set type for user rights (null = visitor || admin = Administrator || promoter = Promoter
	 * @param values {Object} eg {'UserID': uuid, 'type': null || 'admin' || 'promoter'}
	 * @returns {Promise<any>}
	 */
	setType(ClientID, values) {
		/*
		return new Promise((resolve, reject) => {

			let sql = 'UPDATE innoUser SET `UserType` = values.UserType WHERE UserID = ?';
			this._queryPromise(sql, [values.UserID]).then((res) => {
				if (res.affectedRows) {
					resolve();
				} else {
					reject({'nr': 1002, 'message': 'User not found or wrong type given.'});
				}
			}).catch((err) => {
				reject(err);
			});
		});

		 */
	}

	/**
	 * update password (create a new password for a user)
	 * @param values
	 * @returns {Promise<any>}
	 */
	updatePassword(ClientID, values) {
		/*
		return new Promise((resolve, reject) => {

		});

		 */
	}

	/**
	 * create password salt and hash password with extended salt
	 * @param password {String} password string should be already hasched by client (eg md5 or sha256 or even both)
	 * @returns {Object} object with password hash and password salt {'password': password_hash, 'salt': password_salt}
	 * @private
	 */
	_hashPassword(password) {
		const password_salt = randtoken.generate(128);
		const password_hash = sha512().update(password + password_salt).digest('hex');
		return {'password': password_hash, 'salt': password_salt};
	}

}

module.exports = User;
