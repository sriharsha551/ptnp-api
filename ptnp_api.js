const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const bodyParser = require('body-parser');
let mysql = require("mysql");
let xlsx = require("node-xlsx");
const port = 5000;

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "sriharsha12345",
  database: "pragati_tnp"
});

con.connect(function(err) {
  if (err) throw err;
});

app.use(cors());
app.use(bodyParser.json());

app.put("/students/add", upload.array("file", 12), (req, res) => {
  let files = req.files;
  filenames = [];
  for (let i = 0; i < Object.keys(files).length; i++) {
    filenames.push(files[i].path);
  }
  filenames.forEach(path => {
    const obj = xlsx.parse(path);
    let records = obj[0].data;
    records.forEach((array)=>{     
      array.splice(0,1)
    })
    let values = [records[1], records[2], records[3]];
    let sql = "insert into student_details (" + records[0] + ") values ?";
    con.query(sql, [values], function(err) {
      if (err) throw err;
    });
  });
  res.send("Data Imported successfully");
});

app.put('/drives/add',upload.none(),(req,res)=>{

});

app.put('/round/add', function(req, res) {
  let data = req.body;
  let sql = "insert into rounds (round_name) values ('"+data.data+"')";
  con.query(sql,(err,result)=>{
    if (err) throw err
  });
  });

app.get('/student/details',upload.none(),(req,res)=>{
  let sql = "select * from student_details";
  let data = [];
  con.query(sql,(err,result)=>{
    if (err) throw err;
    data.push(JSON.parse(JSON.stringify(result)));
    res.send(data);
  });
});

app.listen(port);
