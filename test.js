// const excel = require("read-excel-file/node");
let mysql = require("mysql");
let xlsx = require("node-xlsx");

const obj = xlsx.parse("../Students_details.xlsx");
let records = obj[0].data;


let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "sriharsha12345",
  database: "pragati_tnp"
});

con.connect(function(err) {
  if (err) throw err;
  records.forEach((array)=>{     
    array.splice(0,1)
  })
  let values = [records[1], records[2], records[3]];
  let sql = "insert into student_details (" + records[0] + ") values ?";
  con.query(sql, [values], function(err, result) {
    if (err) throw err;
  });
});
