const express = require("express");
const app = express();
const cors = require("cors");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const port = 5000;

let mysql = require("mysql");
let xlsx = require("node-xlsx");

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "sriharsha12345",
  database: "pragati_tnp"
});


app.use(cors());

app.post("/students/add",upload.array('file',12), (req, res) => {
  let files = req.files;
  filenames =[]

  for(let i=0;i<Object.keys(files).length;i++){
    filenames.push(files[i].path)
  }
  
  con.connect(function(err) {
    if (err) throw err;
    filenames.forEach((path)=>{
      const obj = xlsx.parse(path);
      let records = obj[0].data;
      let values = [records[1], records[2], records[3]];
      let sql = "insert into student_details (" + records[0] + ") values ?";
      con.query(sql, [values], function(err, result) {
        if (err) throw err;
      });
    });
  });
  res.send('Data Imported successfully');
});

app.listen(port);
