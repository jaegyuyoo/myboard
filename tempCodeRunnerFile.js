var mysql = require("mysql2");
var conn = mysql.createConnection({
	host: "localhost",
    user: "root",
    password: "1234",
    database: "myboard",
});