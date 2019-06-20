// const excel = require("read-excel-file/node");
let mysql = require("mysql");
const express = require('express');
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const port = 5000;

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "sriharsha12345",
  database: "pragati_tnp"
});

app.use(cors());
app.use(bodyParser.json());
con.connect();

app.get("/drives/upcoming", (req, res) => {
  let date = new Date().toLocaleDateString("en-GB").split("/");
  date = [date[2], date[0], date[1]].join("-");
  let sql = "select d.*,dr.round_id ,r.round_name from drive_details d"+
  " inner join drive_rounds dr on d.drive_id = dr.drive_id inner join rounds r on r.id = dr.round_id"+
  " where d.date_of_drive>=DATE_FORMAT('" +date +"', '%Y-%m-%d') and d.delete_status='0' order by d.drive_id";
  con.query(sql,(err,result)=>{
    let driveData = (JSON.parse(JSON.stringify(result)));
    let drive_list = [];
    for(let i=0;i<driveData.length;i++){
      console.log(Object.keys(driveData[i]));
      // if(driveData[i].keys() in drive_list[i]){console.log('hi')}
      drive_list.push(driveData[i]);
    }
  });
});

app.post('/students/filter',(req,res)=>{
  let sql = "select * from student_details where "+btech_name+">="+data.btech_score+" and "+inter_name+">="+data.class12_score+" and "+
  ""+ssc_name+">="+data.class10_score+"and BTECH_BACKLOGS<="+data.backlogs+" and EAMCET_RANK<"+data.eamcet_rank+"";
  con.query(sql,(err,result)=>{
    console.log(result);
    // returnData.result={result};
    // res.send(returnData);
  });
});

app.listen(port);
