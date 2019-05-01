import Module from './../module';
import Order from '../order/order';
import _ from 'lodash';

/**
 * user shopping cart actions
 * @extends Module
 */
class UserShoppingCart extends Module {

	/**
	 * constructor
	 * @param ClientConnID {String} 32 character string of connection ID from database table ``
	 */
	constructor(ClientConnID) {
		super(ClientConnID);
		this._userdata = SOCKET.io.sockets.connected[this._clientConnID].userdata;
		if (!_.isObject(this._userdata.ShoppingCart)) {
			this._userdata.ShoppingCart = {
				ShoppingCartItems: {},
				OrderFrom: (this._userdata.intern) ? 'intern' : 'extern',
				OrderFromID: (this._userdata.intern && this._userdata.User && this._userdata.User.UserID) ? this._userdata.User.UserID : null,
				OrderDetail: []
			}
		}
		if (!_.isArray(this._userdata.ShoppingCart.OrderDetail)) {
			this._userdata.ShoppingCart.OrderDetail = [];
		}
		//console.log(this._userdata.Event);
	}

	/**
	 * set user for this shopping cart (used for internal connections eg 'admin' ||'promoter')
	 * @param UserID {String} 32 character string of user id
	 */
	setUser(UserID) {
		return new Promise((resolve, reject) => {
			resolve('TODO :)');
		});
	}

	/**
	 * set ticket - multiple tickets (especially for external usage parameter Amount can be used)
	 * @param values {Object} Object
	 * @example
	 * {ID:'TicketID', Amount: 2}
	 * @returns {Promise<any>}
	 */
	setTicket(values) {
		return new Promise((resolve, reject) => {

			let TicketID = values.ID;
			let Amount = values.Amount;

			let OrderDetail = [];
			_.each(this._userdata.ShoppingCart.OrderDetail, (Item) => {
				if (Item.OrderDetailTypeID !== TicketID) {
					OrderDetail.push(Item);
				}
			});
			this._userdata.ShoppingCart.OrderDetail = OrderDetail;

			this._userdata.ShoppingCart.ShoppingCartItems[TicketID] = (Amount) ? Amount : null;
			if (Amount) {

				let soldTicket = 0;
				let actualVisitors = 0;

				DB.promiseSelect('viewEventTicketCountSold', null, {EventID: this._userdata.Event.EventID}).then(res => {
					let TicketCountSold = res;
					_.each(TicketCountSold, rowCountTicketSold => {
						if (rowCountTicketSold.Type === 'ticket') {
							actualVisitors += rowCountTicketSold.count;
						}
						if (rowCountTicketSold.TicketID === TicketID) {
							soldTicket = rowCountTicketSold.count;
						}
					});
					return DB.promiseSelect('innoTicket', null, {TicketID: TicketID, TicketEventID: this._userdata.Event.EventID});
				}).then(resTicket => {
					let maximumVisitors = this._userdata.Event.EventMaximumVisitors;
					let rowTicket = resTicket[0];
					_.each(SOCKET.io.sockets.connected, client => {
						if (client.id != this._clientConnID && client.adapter.rooms[this._userdata.Event.EventID].sockets && client.userdata.ShoppingCart && client.userdata.ShoppingCart.OrderDetail) {
							_.each(client.userdata.ShoppingCart.OrderDetail, Detail => {
								if (Detail.OrderDetailTypeID === TicketID) {
									soldTicket++;
									if (rowTicket.TicketType === 'ticket') {
										actualVisitors++;
									}
								}
							});
						}
					});
					let availableTicket = rowTicket.TicketContingent - soldTicket;

					if (this._userdata.intern === false && Amount > rowTicket.TicketMaximumOnline) {
						Amount = rowTicket.TicketMaximumOnline;
					}
					if (Amount > availableTicket) {
						Amount = availableTicket;
					}
					if (rowTicket.TicketType === 'ticket' && actualVisitors + Amount > maximumVisitors) {
						Amount = maximumVisitors - actualVisitors;
					}

					this._userdata.ShoppingCart.ShoppingCartItems[TicketID] = Amount;
					for (let i = 0; i < Amount; i++) {
						this._userdata.ShoppingCart.OrderDetail.push({
							ShoppingCartID: this.generateUUID(),
							ShoppingCartTicketName: rowTicket.TicketName,
							OrderDetailType: rowTicket.TicketType,
							OrderDetailTypeID: rowTicket.TicketID,
							OrderDetailScanType: rowTicket.TicketScanType,
							OrderDetailState: 'sold',
							OrderDetailSortOrder: rowTicket.TicketSortOrder,
							OrderDetailText: rowTicket.TicketLable,
							OrderDetailGrossRegular: rowTicket.TicketGrossPrice,
							OrderDetailGrossDiscount: 0,
							OrderDetailTaxPercent: rowTicket.TicketTaxPercent,
							OrderDetailTaxPrice: 0,
							OrderDetailGrossPrice: rowTicket.TicketGrossPrice,
							OrderDetailNetPrice: 0
						});
					}
					let order = new Order(this._clientConnID);
					this._userdata.ShoppingCart = _.extend(this._userdata.ShoppingCart, order.calculate(this._userdata.ShoppingCart.OrderDetail));
					resolve(this._userdata.ShoppingCart);

					SOCKET.io.to(this._userdata.Event.EventID).emit('update-ticket', {
						TicketID: rowTicket.TicketID,
						TicketType: rowTicket.TicketType,
						TicketContingent: availableTicket - Amount
					});

					SOCKET.io.to(this._userdata.Event.EventID).emit('update-event', {
						EventID: this._userdata.Event.EventID,
						EventAvailableVisitors: maximumVisitors - actualVisitors - Amount
					});

				}).catch(err => {
					console.log(err);
					reject();
				});
			} else {
				let order = new Order(this._clientConnID);
				this._userdata.ShoppingCart = _.extend(this._userdata.ShoppingCart, order.calculate(this._userdata.ShoppingCart.OrderDetail));
				resolve(this._userdata.ShoppingCart);
			}
		});
	}

	/**
	 * add seat
	 * @param SeatID {String} 32 character string for ID of the seat
	 * @returns {Promise<any>}
	 */
	addSeat(SeatID) {
		return new Promise((resolve, reject) => {
			DB.promiseSelect('viewEventSeat', null, {SeatEventID: this._userdata.Event.EventID, SeatID: SeatID}).then(resSeat => {
				if (_.size(resSeat)) {
					let rowSeat = resSeat[0];
					let action = 'add';
					if (rowSeat.SeatOrderID === null && rowSeat.SeatReservationID === null) {
						_.each(SOCKET.io.sockets.connected, client => {
							if (client.adapter.rooms[this._userdata.Event.EventID].sockets && client.userdata.ShoppingCart && client.userdata.ShoppingCart.OrderDetail) {
								_.each(client.userdata.ShoppingCart.OrderDetail, Detail => {
									if (Detail.OrderDetailType === 'seat' && Detail.OrderDetailTypeID === SeatID) {
										if (client.id != this._clientConnID) {
											action = 'blocked';
										}
									}
								});
							}
						});
						if (action === 'add') {
							let text = (rowSeat.RoomLabel) ? rowSeat.RoomLabel : '';
							text += (rowSeat.TableLabel) ? ' ' + rowSeat.TableLabel : '';
							text += (rowSeat.SeatLabel) ? ' ' + rowSeat.SeatLabel : '';
							if (rowSeat.SeatRow && rowSeat.SeatNumber) {
								text += ' ' + rowSeat.SeatRow + '/' + rowSeat.SeatNumber;
							} else if (rowSeat.TableNumber && rowSeat.SeatNumber) {
								text += ' ' + rowSeat.TableNumber + '/' + rowSeat.SeatNumber;
							} else if (rowSeat.SeatNumber) {
								text += ' ' + rowSeat.SeatNumber;
							}
							this._userdata.ShoppingCart.OrderDetail.push({
								ShoppingCartID: this.generateUUID(),
								ShoppingCartSeatName: rowSeat.SeatName,
								ShoppingCartRoomName: rowSeat.RoomName,
								ShoppingCartTableName: rowSeat.TableName,
								ShoppingCartTableNumber: rowSeat.TableNumber,
								OrderDetailType: 'seat',
								OrderDetailTypeID: rowSeat.SeatID,
								OrderDetailScanType: 'single',
								OrderDetailState: 'sold',
								OrderDetailSortOrder: 0,
								OrderDetailText: text.trim(),
								OrderDetailGrossRegular: rowSeat.SeatGrossPrice,
								OrderDetailGrossDiscount: 0,
								OrderDetailTaxPercent: rowSeat.SeatTaxPercent,
								OrderDetailTaxPrice: 0,
								OrderDetailGrossPrice: rowSeat.SeatGrossPrice,
								OrderDetailNetPrice: 0
							});
						} else if (action === 'release') {
							let OrderDetail = [];
							_.each(this._userdata.ShoppingCart.OrderDetail, (Item) => {
								if (Item.OrderDetailTypeID !== SeatID) {
									OrderDetail.push(Item);
								}
							});
							this._userdata.ShoppingCart.OrderDetail = OrderDetail;
							let Items = [];
							_.each(this._userdata.ShoppingCart.ShoppingCartItems, (Item, index) => {
								if (index != SeatID) {
									Items.push(Item);
								}
							});
							this._userdata.ShoppingCart.ShoppingCartItems = Items;
						}
						if (action !== 'blocked') {
							let order = new Order(this._clientConnID);
							this._userdata.ShoppingCart = _.extend(this._userdata.ShoppingCart, order.calculate(this._userdata.ShoppingCart.OrderDetail));
							resolve(this._userdata.ShoppingCart);
						} else {
							reject({SeatID: SeatID, SeatState: 'blocked'});
						}
					} else {
						if (rowSeat.SeatOrderID !== null) {
							reject({SeatID: SeatID, SeatState: 'sold'});
						} else if (rowSeat.SeatReservationID !== null) {
							reject({SeatID: SeatID, SeatState: 'reserved'});
						} else {
							reject({SeatID: SeatID, SeatState: 'blocked'});
						}
					}
				} else {
					reject(false);
				}
			}).catch(err => {
				console.log(err);
				reject();
			});

		});
	}

	/**
	 * add special offer to shopping cart (not a special ticket !!!)
	 * @param values {Object} arra
	 * @returns {Promise<any>}
	 */
	addSpecialOffer(values) {
		return new Promise((resolve, reject) => {
			resolve(values);
		});
	}

	/**
	 * set discount to shopping cart (order) item
	 * only allowd from intern user 'admin' or 'promoter'
	 * @param values {Object} Object
	 * @example
	 * {ID:'ShoppingCartDetailID', Discount: 1.23}
	 * @returns {Promise<any>}
	 */
	setDiscount(values) {

	}

	empty() {
		return new Promise((resolve, reject) => {
			resolve([]);
		});
	}

	del(DetailID) {
		return new Promise((resolve, reject) => {
			resolve(DetailID);
		});
	}

}

module.exports = UserShoppingCart;
