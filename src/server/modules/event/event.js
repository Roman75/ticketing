import Module from './../module';
import _ from 'lodash';

/**
 * event module
 */
class Event extends Module {

	/**
	 * constructor
	 * @param connID {String} 32 character string of connection ID from database table ''
	 */
	constructor(ClientConnID) {
		super(ClientConnID);
		this.pk = 'EventID';
		this.table = 'innoEvent';
		this.view = 'viewEvent';
		this.fields = {
			EventID: {type: 'string', length: 32, empty: false}, // varchar(32) NOT NULL COMMENT 'unique id of the event',
			EventPromoterID: {type: 'string', length: 32, empty: false}, // varchar(32) NULL COMMENT 'unique id of the Event that event belongs to',
			EventLocationID: {type: 'string', length: 32, empty: false}, // varchar(32) NULL COMMENT 'unique id of the location that event belongs to',
			EventOnline: {type: 'boolean', empty: false}, // tinyint(1) NULL COMMENT 'is this event from outside world/homepage reachable (online)? has only effect if actual date is between EventSaleStartDateTimeUTC and EventSaleEndDateTimeUTC',
			EventTestMode: {type: 'boolean', empty: false}, // tinyint(1) NULL COMMENT 'is this event in Test Mode?',
			EventOrderNumberBy: {type: 'enum', values: ['promoter', 'event'], 'default': 'event'}, // enum('promoter','event') NOT NULL DEFAULT 'event' COMMENT 'generate order number by promoter or event? event = own number circle for this event prefix | promoter = prefix is used but number is consecutive to the EventPromoterID (after first order this can not be changed!)',
			EventOrderNumberResetDateTimeUTC: {type: 'datetime', length: 100, empty: true}, // datetime NULL COMMENT 'if EventOrderNumberBy = promoter this is the date when all events for this promoter are reset to 0 first order after this day gets order number 000001 (EventStartBillNumber is ignored!) ALL active events/orders for this promoter are getting a consecutive number',
			EventName: {type: 'string', length: 100, empty: false}, // varchar(100) NOT NULL COMMENT 'name',
			EventPrefix: {type: 'string', length: 5, empty: false}, // varchar(5) NOT NULL COMMENT 'prefix of the event eg ZBB2020 IMPORTANT: can not be changed after first order',
			EventPhone1: {type: 'string', length: 30, empty: true}, // varchar(30) NULL COMMENT 'phone number 1 for the Event',
			EventPhone2: {type: 'string', length: 30, empty: true}, // varchar(30) NULL COMMENT 'phone number 2 for the Event',
			EventFax: {type: 'string', length: 30, empty: true}, // varchar(30) NULL COMMENT 'fax number for the Event',
			EventEmail: {type: 'email', length: 250, empty: true}, // varchar(250) NULL COMMENT 'email for the Event',
			EventHomepage: {type: 'string', length: 250, empty: true}, //  varchar(250) NULL COMMENT 'homepage for the Event',
			EventSubdomain: {type: 'string', length: 50, empty: true, hasNot: ['www', 'admin', 'libs', 'scan', '_acme-challenge', 'mail', 'ftp', 'imap', 'pop', 'relay', 'smtp', 'app']}, // varchar(50) NULL COMMENT 'subdomain for the Event eg zuckerbaecker-ball-2020 (.ballcomplete.at will be automatical extended => tld comes from file .config.yaml)',
			EventStartBillNumber: {type: 'integer', length: 6, empty: false}, // int(6) NOT NULL DEFAULT 100 COMMENT 'the first bill number for the first order',
			EventMaximumVisitors: {type: 'integer', length: 6, empty: false}, // int(6) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'maximum visitors for this event (count all tickets from type ticket all others are exluded)',
			EventMaximumSeats: {type: 'integer', length: 2, empty: false}, // tinyint(2) UNSIGNED NOT NULL DEFAULT 20 COMMENT 'maximum seats per order',
			EventStepSeats: {type: 'integer', length: 1, empty: false}, // tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT 'in which steps is it allowed to order seats => value of 2 means a customer can order 2,4,6,... seats',
			EventDefaultTaxTicketPercent: {type: 'decimal', length: 50, empty: false}, // decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'default tax value for tickets',
			EventDefaultTaxSeatPercent: {type: 'decimal', length: 50, empty: false}, // decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'default tax value for seats',
			EventStartDateTimeUTC: {type: 'datetime', length: 50, empty: false}, // datetime NULL COMMENT '',
			EventEndDateTimeUTC: {type: 'datetime', length: 50, empty: false}, // datetime NULL COMMENT '',
			EventSaleStartDateTimeUTC: {type: 'datetime', length: 50, empty: false}, // datetime NULL COMMENT '',
			EventSaleEndDateTimeUTC: {type: 'datetime', length: 50, empty: false}, // datetime NULL COMMENT '',
			EventScanStartDateTimeUTC: {type: 'datetime', length: 50, empty: false}, // datetime NULL COMMENT '',
			EventScanEndDateTimeUTC: {type: 'datetime', length: 50, empty: false}, // datetime NULL COMMENT '',

			EventHandlingFeeName: {type: 'string', length: 100, empty: true}, // varchar(100) NULL COMMENT 'handling fee name',
			EventHandlingFeeLabel: {type: 'token', empty: true}, // varchar(100) NULL COMMENT 'handling fee label',
			EventHandlingFeeGrossInternal: {type: 'decimal', length: 50, empty: false}, // decimal(8,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '',
			EventHandlingFeeGrossExternal: {type: 'decimal', length: 50, empty: false}, // decimal(5,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '',
			EventHandlingFeeTaxPercent: {type: 'decimal', length: 50, empty: false}, // decimal(8,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '',
			EventShippingCostName: {type: 'decimal', length: 50, empty: false}, // decimal(5,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '',
			EventShippingCostLabel: {type: 'token', empty: true}, // varchar(100) NULL COMMENT 'shipping cost name',
			EventShippingCostGrossInternal: {type: 'string', length: 100, empty: true}, // varchar(100) NULL COMMENT 'shipping cost label',
			EventShippingCostGrossExternal: {type: 'decimal', length: 50, empty: false}, // decimal(8,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '',
			EventShippingCostTaxPercent: {type: 'decimal', length: 50, empty: false}, // decimal(5,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '',

			EventSendMailAddress: {type: 'email', length: 50, empty: false}, // varchar(250) NULL COMMENT '',
			EventSendMailServer: {type: 'string', length: 50, empty: false}, // varchar(250) NULL COMMENT '',
			EventSendMailServerPort: {type: 'string', length: 50, empty: false}, // smallint(5) UNSIGNED NULL COMMENT '',
			EventSendMailUsername: {type: 'string', length: 50, empty: false}, // varchar(250) NULL COMMENT '',
			EventSendMailPassword: {type: 'string', length: 50, empty: false}, // varchar(100) NULL COMMENT '',
			EventSendMailSettingsJSON: {type: 'json', length: 50, empty: false}, // json NULL COMMENT 'special settings for send mail',

			EventSendMailOrderSubjectLabel: {type: 'token', empty: true}, // varchar(100) NULL DEFAULT '§§MAIL_ORDER_SUBJECT' COMMENT 'token for order email template subject',
			EventSendMailOrderContentLabel: {type: 'token', empty: true}, // varchar(100) NULL DEFAULT '§§MAIL_ORDER_CONTENT' COMMENT 'token for order email template content (text)',
			EventSaleStartDateBeforeLabel: {type: 'token', empty: true}, // varchar(100) NULL DEFAULT '§§SALE_BEFORE_START' COMMENT 'token for text before event sale start date is reached',
			EventOfflineLabel: {type: 'token', empty: true}, // varchar(100) NULL DEFAULT '§§EVENT_OFFLINE' COMMENT 'token for text if the event is offline',
			EventSaleEndDateAfterLabel: {type: 'token', empty: true}, // varchar(100) NULL DEFAULT '§§SALE_AFTER_END' COMMENT 'token for text after event sale end date is reached',

			EventMpayTestFlag: {type: 'boolean', length: 50, empty: false}, // tinyint(1) unsigned NOT NULL DEFAULT 1 COMMENT 'is mpay in test mode',
			EventMpayMerchantID: {type: 'string', length: 50, empty: false}, // varchar(10) NULL COMMENT 'mPAY MerchantID',
			EventMpaySoapPassword: {type: 'string', length: 50, empty: false}, // varchar(10) NULL COMMENT 'mPAY Soap Password',
			EventMpayTestMerchantID: {type: 'string', length: 50, empty: false}, // varchar(10) NULL DEFAULT '91442' COMMENT 'mPAY Test MerchantID',
			EventMpayTestSoapPassword: {type: 'string', length: 50, empty: false} // varchar(10) NULL DEFAULT 'RkYvWLAH?b' COMMENT 'mPAY Test Soap Password',
		}
	}

	fetchDetail(EventID) {
		return new Promise((resolve, reject) => {
			let ret = null;
			DB.promiseSelect(this.table, null, {EventID: EventID}).then(resEvent => {
				if (_.size(resEvent) === 1) {
					ret = resEvent[0];
					ret.Ticketing = [];
					ret.Seating = [];
					ret.SpecialOffer = [];
				}
				return DB.promiseSelect('innoTicket', null, {TicketEventID: EventID});
			}).then(resTicket => {
				if (_.size(resTicket)) {
					ret.Ticketing = resTicket;
				}
				return DB.promiseSelect('innoFloor', ['FloorID', 'FloorEventID', 'FloorName', 'FloorLabel'], {FloorEventID: EventID});
			}).then(resFloor => {
				if (_.size(resFloor)) {
					ret.Seating = resFloor;
				}
				return DB.promiseSelect('innoRoom', null, {RoomEventID: EventID});
			}).then(resRoom => {
				if (_.size(resRoom)) {
					resRoom = resRoom;
					_.each(ret.Seating, rowFloor => {
						rowFloor.Room = _.filter(resRoom, {RoomFloorID: rowFloor.FloorID});
					});
				}
				return DB.promiseSelect('innoTable', null, {TableEventID: EventID});
			}).then(resTable => {
				if (_.size(resTable)) {
					_.each(ret.Seating, rowFloor => {
						_.each(rowFloor.Room, rowRoom => {
							rowFloor.Room.Table = _.filter(resTable, {TableRoomID: rowRoom.RoomID});
						});
					});
				}
				return DB.promiseSelect('innoSeat', null, {SeatEventID: EventID});
			}).then(resSeat => {
				if (_.size(resSeat)) {
					_.each(ret.Seating, rowFloor => {
						_.each(rowFloor.Room, rowRoom => {
							rowRoom.Seat = _.filter(resSeat, {SeatTableID: null});
							_.each(rowRoom.Table, rowTable => {
								rowTable.Seat = _.filter(resSeat, {SeatTableID: rowTable.TableID});
							});
						});
					});
				}
				resolve(ret);
			}).catch(err => {
				console.log(err);
				reject(err);
			});
		});
	}

	copy(values) {
		return new Promise((resolve, reject) => {
			const newEventID = this.generateUUID();
			let where = {EventID: values.EventID}
			let rowEvent = {};
			DB.promiseSelect(this.table, null, where).then(resEvent => {
				if (_.size(resEvent)) {
					rowEvent = resEvent[0];
					return DB.promiseSelect('innoTicket', null, {TicketEventID: values.EventID});
				} else {
					return;
				}
			}).then(resTicket => {
				if (_.size(resTicket)) {
				}
				return DB.promiseSelect('innoFloor', null, {FloorEventID: values.EventID})
			}).then(resFloor => {
				if (_.size(resFloor)) {
				}
				return DB.promiseSelect('innoRoom', null, {FloorEventID: values.EventID})
			});
		});
	}

	checkPrefix(Prefix) {
		let where = {
			EventPrefix: Prefix
		};
		return DB.promiseCount(this.table, where, 'COUNT(EventID) AS count');
	}

	checkSubdomain(Subdomain) {
		let where = {
			EventSubdomain: Subdomain
		};
		return DB.promiseCount(this.table, where, 'COUNT(EventID) AS count');
	}

}

module.exports = Event;


