USE ticketing_db;

DROP VIEW IF EXISTS `viewOrderDetail`;
DROP TABLE IF EXISTS `innoOrderDetail`;
DROP TABLE IF EXISTS `innoOrderTax`;
DROP TABLE IF EXISTS `innoOrder`;

CREATE TABLE `innoOrder` (
  `OrderID`                                   varchar(32) NOT NULL COMMENT 'unique id of the order',
  `OrderNumber`                               int(6) UNSIGNED ZEROFILL NULL COMMENT 'consecutive number of the order (why 6 digits and not less => it could be a stadium with more than 100.000 visitors and orders)',
  `OrderNumberText`                           varchar(14) NULL COMMENT '7 character prefix delimiter (-) and consecutive number of the order (example: ZBB2020-123456)',

  `OrderEventID`                              varchar(32) NOT NULL COMMENT 'id of the event that order belongs to',

  `OrderType`                                 enum('order','credit') NOT NULL DEFAULT 'order' COMMENT 'type of order => or=order (Rechnung) | cr=credit (Gutschrift)',
  `OrderState`                                enum('open','payed') NOT NULL DEFAULT 'open' COMMENT 'state of order => op=open | pa=payed',
  `OrderPayment`                              enum('cash','mpay','paypal','transfer') NOT NULL DEFAULT 'cash' COMMENT 'payment method => ca=cash | mp=mpay | pa=paypal | tr=transfer',

  `OrderCreditID`                             varchar(32) NULL COMMENT 'id of order to which this credit belongs to',

  `OrderDateTimeUTC`                          datetime NOT NULL COMMENT 'order date time',
  `OrderPayedDateTimeUTC`                     datetime NOT NULL COMMENT 'order date time payed',

  `OrderFrom`                                 enum('extern','intern') NOT NULL DEFAULT 'extern' COMMENT 'from of order => ex=external (online page) | in=internal (admin page)',
  `OrderFromUserID`                           varchar(32) NULL COMMENT 'unique id of the user the order was created (only if OrderFrom = in)',

  `OrderUserID`                               varchar(32) NULL COMMENT 'unique id of the user that order belongs to',
  
  `OrderCompany`                              varchar(150) NULL COMMENT 'company',
  `OrderCompanyUID`                           varchar(30) NULL COMMENT 'company UID',

  `OrderGender`                               enum('m','f','c') NULL COMMENT 'gender m=male | f=female',
  `OrderTitle`                                varchar(50) NULL COMMENT 'academical title',
  `OrderFirstname`                            varchar(50) NULL COMMENT 'first name',
  `OrderLastname`                             varchar(50) NULL COMMENT 'last name',

  `OrderStreet`                               varchar(120) NULL COMMENT 'street',
  `OrderCity`                                 varchar(100) NULL COMMENT 'city',
  `OrderZIP`                                  varchar(20) NULL COMMENT 'zip',
  `OrderCountryCountryISO2`                   varchar(2) NULL COMMENT 'country',

  `OrderUserEmail`                            varchar(250) NULL COMMENT 'actual email address of user => is used to send mail to customer',
  `OrderUserPhone`                            varchar(20) NULL COMMENT 'actual phone number of user',

  `OrderGrossPrice`                           decimal(8,2) NULL DEFAULT 0.00 COMMENT 'price gross => brutto',
  `OrderNetPrice`                             decimal(8,2) NULL DEFAULT 0.00 COMMENT 'price net => netto',

  FOREIGN KEY Order_EventID (`OrderEventID`)        REFERENCES innoEvent(`EventID`),
  FOREIGN KEY Order_CreditID (`OrderCreditID`)      REFERENCES innoOrder(`OrderID`),
  FOREIGN KEY Order_FromUserID (`OrderFromUserID`)  REFERENCES innoUser(`UserID`),
  FOREIGN KEY Order_UserID (`OrderUserID`)          REFERENCES innoUser(`UserID`),
  PRIMARY KEY (`OrderID`)  
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE `innoOrderTax` (
  `OrderTaxOrderID`                           varchar(32) NOT NULL COMMENT 'unique id of the order that order tax belongs to',
  `OrderTaxPercent`                           decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'tax in percent',
  `OrderTaxAmount`                            decimal(8,2) NOT NULL DEFAULT 0.00 COMMENT 'tax amount',
  FOREIGN KEY OrderTax_OrderID (`OrderTaxOrderID`)  REFERENCES innoOrder(`OrderID`),
  PRIMARY KEY (`OrderTaxOrderID`,`OrderTaxPercent`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;

CREATE TABLE `innoOrderDetail` (
  `OrderDetailScanCode`              varchar(15) NOT NULL COMMENT 'unique scancode of the order detail => 7 chars event prefix, EAN (1 digit rand, 6 digits number, 1 check digit)',
  `OrderDetailScanType`              enum('single','multi','inout','test') NOT NULL DEFAULT 'single' COMMENT '',

  `OrderDetailOrderID`               varchar(32) NOT NULL COMMENT 'unique id of the order that order detail belongs to',

  `OrderDetailType`                  enum('ticket','seat','special','shippingcost','handlingfee') NOT NULL COMMENT 'type of order detail => ti=entry ticket | se=seat at location | sp=special = >upselling like Tortengarantie | sc=shipping cost | hf=handling fee',
  `OrderDetailTypeID`                varchar(32) NULL COMMENT 'id of the record from table => ticket (ti) | seat (se) | special (sp) | extra (sc and hf)',
  `OrderDetailState`                 enum('sold','canceled') NOT NULL COMMENT 'state of order detail => so=sold | ca=canceled',

  `OrderDetailEANRand`               tinyint(1) ZEROFILL NOT NULL DEFAULT 0 COMMENT 'EAN8 code first digit random',
  `OrderDetailNumber`                int(6) ZEROFILL NOT NULL DEFAULT 0 COMMENT 'ean 6 digits => continuous numerating depanding on event prefix',
  `OrderDetailEANCheckDigit`         tinyint(1) ZEROFILL NOT NULL DEFAULT 0 COMMENT 'check digit for the EAN8 code',
  `OrderDetailText`                  varchar(150) NULL COMMENT 'text of the line in the bill',
  `OrderDetailGrossRegular`          decimal(8,2) NOT NULL DEFAULT 0.00 COMMENT 'regular gross => brutto regular price',
  `OrderDetailGrossDiscount`         decimal(8,2) NOT NULL DEFAULT 0.00 COMMENT 'amount gross discount => brutto discount gross',
  `OrderDetailGrossPrice`            decimal(8,2) NOT NULL DEFAULT 0.00 COMMENT 'price gross => brutto subtract amount discount gross',
  `OrderDetailTaxPercent`            decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'tax in percent',

  FOREIGN KEY OrderDetail_OrderID (`OrderDetailOrderID`) REFERENCES innoOrder(`OrderID`),
  PRIMARY KEY (`OrderDetailScancode`, `OrderDetailOrderID`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;