CREATE DATABASE IF NOT EXISTS `webexbot` DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;
USE `webexbot`;

--
-- Table structure for table `tbl_clients`
--

DROP TABLE IF EXISTS `tbl_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_clients` (
  `pkid` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(80) COLLATE utf8_bin NOT NULL,
  `city` varchar(80) COLLATE utf8_bin DEFAULT NULL,
  `manager` varchar(100) COLLATE utf8_bin NOT NULL,
  `email` varchar(30) COLLATE utf8_bin NOT NULL,
  `phone` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  `website` varchar(100) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`pkid`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
