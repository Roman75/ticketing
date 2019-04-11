import Module from './../module';
import _ from 'lodash';

/**
 * floor module
 */
class Order extends Module {

	/**
	 * constructor for order
	 * @param ConnID {String} 32 character string of connection ID
	 * @param ConnUserID {String} 32 character string of user ID
	 */
	constructor(ConnID = null, ConnUserID = null) {
		super(ConnID, ConnUserID);
		this.pk = 'OrderID';
		this.table = 'innoOrder';
		this.view = 'viewOrder';
		this.fields = {
			'OrderID': {'type': 'string', 'length': 32, 'empty': false}, // varchar(32) NOT NULL COMMENT 'unique id of the order',
			'OrderNumber': {'type': 'integer', 'length': 6, 'empty': false}, // int(6) UNSIGNED ZEROFILL NULL COMMENT 'consecutive number of the order (why 6 digits and not less => it could be a stadium with more than 100.000 visitors and orders)',
			'OrderNumberText': {'type': 'string', 'length': 14, 'empty': false}, // varchar(14) NULL COMMENT '7 character prefix delimiter (-) and consecutive number of the order (example: ZBB2020-123456)',
			'OrderEventID': {'type': 'string', 'length': 32, 'empty': false}, // varchar(32) NOT NULL COMMENT 'id of the event that order belongs to',
			'OrderType': {'type': 'enum', 'empty': false}, // enum('order','credit') NOT NULL DEFAULT 'order' COMMENT 'type of order => or=order (Rechnung) | cr=credit (Gutschrift)',
			'OrderState': {'type': 'enum', 'empty': false}, // enum('open','payed') NOT NULL DEFAULT 'open' COMMENT 'state of order => op=open | pa=payed',
			'OrderPayment': {'type': 'enum', 'empty': false}, // enum('cash','mpay','paypal','transfer') NOT NULL DEFAULT 'cash' COMMENT 'payment method => ca=cash | mp=mpay | pa=paypal | tr=transfer',
			'OrderCreditID': {'type': 'string', 'length': 32, 'empty': false}, // varchar(32) NULL COMMENT 'id of order to which this credit belongs to',
			'OrderDateTimeUTC': {'type': 'datetime', 'empty': false}, // datetime NOT NULL COMMENT 'order date time',
			'OrderPayedDateTimeUTC': {'type': 'datetime', 'empty': true}, // datetime NOT NULL COMMENT 'order date time payed',
			'OrderFrom': {'type': 'string', 'length': 32, 'empty': false}, // enum('extern','intern') NOT NULL DEFAULT 'extern' COMMENT 'from of order => ex=external (online page) | in=internal (admin page)',
			'OrderFromUserID': {'type': 'string', 'length': 32, 'empty': false}, // varchar(32) NULL COMMENT 'unique id of the user the order was created (only if OrderFrom = in)',
			'OrderUserID': {'type': 'string', 'length': 32, 'empty': false}, // varchar(32) NULL COMMENT 'unique id of the user that order belongs to',
			'OrderCompany': {'type': 'string', 'length': 150, 'empty': false}, // varchar(150) NULL COMMENT 'company',
			'OrderCompanyUID': {'type': 'string', 'length': 30, 'empty': false}, // varchar(30) NULL COMMENT 'company UID',
			'OrderGender': {'type': 'enum', 'empty': false}, // enum('m','f') NULL COMMENT 'gender m=male | f=female',
			'OrderTitle': {'type': 'string', 'length': 50, 'empty': true}, // varchar(50) NULL COMMENT 'academical title',
			'OrderFirstname': {'type': 'string', 'length': 50, 'empty': false}, // varchar(50) NULL COMMENT 'first name',
			'OrderLastname': {'type': 'string', 'length': 50, 'empty': false}, // varchar(50) NULL COMMENT 'last name',
			'OrderStreet': {'type': 'string', 'length': 120, 'empty': false}, // varchar(120) NULL COMMENT 'street',
			'OrderCity': {'type': 'string', 'length': 100, 'empty': false}, // varchar(100) NULL COMMENT 'city',
			'OrderZIP': {'type': 'string', 'length': 20, 'empty': false}, // varchar(20) NULL COMMENT 'zip',
			'OrderCountryCountryISO2': {'type': 'enum', 'table': 'feCountry', 'pk': 'CountryISO2', 'empty': true}, // varchar(2) NULL COMMENT 'country',
			'OrderUserEmail': {'type': 'string', 'length': 250, 'empty': false}, // varchar(250) NULL COMMENT 'actual email address of user => is used to send mail to customer',
			'OrderUserPhone1': {'type': 'string', 'length': 30, 'empty': false}, // varchar(30) NULL COMMENT 'actual phone number of user',
			'OrderUserPhone2': {'type': 'string', 'length': 30, 'empty': false}, // varchar(30) NULL COMMENT 'actual phone number of user',
			'OrderUserFax': {'type': 'string', 'length': 30, 'empty': false}, // varchar(30) NULL COMMENT 'actual phone number of user',
			'OrderUserHomepage': {'type': 'string', 'length': 250, 'empty': false}, // varchar(250) NULL COMMENT 'actual phone number of user',
			'OrderGrossPrice': {'type': 'decimal', 'length': '6,2', 'empty': false}, // decimal(8,2) NULL DEFAULT 0.00 COMMENT 'price gross => brutto',
			'OrderNetPrice': {'type': 'decimal', 'length': '3,2', 'empty': false}, // decimal(8,2) NULL DEFAULT 0.00 COMMENT 'price net => netto',
		}
	}
}

module.exports = Order;