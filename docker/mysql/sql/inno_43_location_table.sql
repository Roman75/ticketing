USE ticketing_db;

DROP TABLE IF EXISTS `innoLocationTable`;
CREATE TABLE `innoLocationTable` (
  `LocationTableID` varchar(32) NOT NULL COMMENT 'unique id of the table',
  `LocationTableLocationID` varchar(32) NULL COMMENT 'unique id of the location that table belongs to',
  `LocationTableRoomID` varchar(32) NULL COMMENT 'unique id of the room that table belongs to',
  `LocationTableName` varchar(100) NULL COMMENT 'name',

  FOREIGN KEY LocationTable_LocationID (`LocationTableLocationID`) REFERENCES innoLocation(`LocationID`),
  FOREIGN KEY LocationTable_TableID (`LocationTableRoomID`) REFERENCES innoLocationRoom(`LocationRoomID`),
  PRIMARY KEY (`LocationTableID`)
) ENGINE=InnoDB DEFAULT CHARSET=UTF8MB4;
