const express = require("express");
const Promise = require("promise");
const app = express();
const cors = require("cors");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const bodyParser = require("body-parser");
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
    let values = [records[1], records[2], records[3]];
    let sql = "insert into student_details (" + records[0] + ") values ?";
    con.query(sql, [values], function(err) {
      if (err) throw err;
    });
  });
  res.send("Data Imported successfully");
});

app.post("/drives/add", upload.none(), (req, res) => {
  let data = req.body.data;
  company = data["company"];
  round_id = data["round_id"];
  // console.log(data);
  delete data["round_id"];
  let date = data["date_of_drive"].split("/");
  data["date_of_drive"] = [date[2], date[1], date[0]].join("-");
  let columns = Object.keys(data);
  let values = Object.values(data);
  values = [values];
  let sql = "insert into drive_details (" + columns + ") values ?";
  con.query(sql, [values], (err, res) => {
    if (err) throw err;
  });
  con.query(
    "select * from drive_details where drive_id = (select max(drive_id) from drive_details)",
    (err, result2) => {
      if (err) throw err;
      let drive_values = [];
      let temp = [];
      drive_id = result2[0].drive_id;
      drive_values.push(drive_id);
      round_id.forEach(id => {
        temp.push(id);
      });
      let drive_columns = [];
      drive_columns.push(drive_id);
      drive_columns.push(round_id);
      drive_values = [drive_values];
      temp.forEach(id => {
        drive_values[0].push(id);
        let sql2 = "insert into drive_rounds (drive_id,round_id) values ?";
        con.query(sql2, [drive_values], (error, resul) => {
          if (error) throw error;
        });
        drive_values[0].pop();
      });

      values[0].pop();
    }
  );
  res.send("sucessfully added!");
});

app.put("/round/add", function(req, res) {
  let data = req.body;
  let sql = "insert into rounds (round_name) values ('" + data.data + "')";
  con.query(sql, (err, result) => {
    if (err) throw err;
    //console.log(result);
  });
  res.send("Rounds added successfully");
});

app.get("/rounds", function(req, res) {
  con.query("select * from rounds", (err, result) => {
    if (err) throw err;
    res.send(JSON.parse(JSON.stringify(result)));
  });
});

app.post("/rounds/delete", (req, res) => {
  data = req.body;
  con.query("alter table rounds auto_increment = " + 1 + " ");
  con.query(
    "delete from rounds where id = (" + data.id + ") ",
    (err, result) => {
      if (err) throw err;
    }
  );
  res.send("Deleted successfully!");
});

app.get("/drives/upcoming", (req, res) => {
  let date = new Date().toLocaleDateString("en-GB").split("/");
  date = [date[2], date[0], date[1]].join("-");
  let noOfDrives;
  let sql =
    "select * from drive_details where date_of_drive>=DATE_FORMAT('" +
    date +
    "', '%Y-%m-%d') and delete_status='0'";
  con.query(sql, (err, result) => {
    if (err) throw err;
    driveData = JSON.parse(JSON.stringify(result));
    noOfDrives = driveData.length;
    for (let i = 0; i < driveData.length; i++) {
      let drive_id = driveData[i].drive_id;
      let noOfRounds = driveData[i].no_of_rounds;
      let sql =
        "select round_id from drive_rounds where drive_id =" + drive_id + "";
      con.query(sql, (error, resData) => {
        let round_ids = JSON.parse(JSON.stringify(resData));
        let round_list = [];
        for (let j = 0; j < round_ids.length; j++) {
          let sql =
            "select id,round_name from rounds where id=" +
            round_ids[j].round_id +
            "";
          con.query(sql, (err, result) => {
            round_list.push(result[0]);
            driveData[i]["rounds"] = round_list;
            if (noOfRounds - 1 === j) {
              updateDrive(driveData, i);
            }
          });
        }
      });
    }
  });
  function updateDrive(driveData, i) {
    if (i === noOfDrives - 1) {
      res.send(driveData);
    }
  }
});

app.post("/drives/delete", (req, res) => {
  let data = req.body.data;
  let sql ="update drive_details set delete_status='1' where drive_id=" +data.drive_id +"";
  con.query(sql, (err, driveResult) => {
    if (err) throw err;
  });
  res.send('Deleted Successfully!');
});

app.post("/drives/modify", (req, res) => {
  let data = req.body.data;
  let date = data.date.split('/');
  date =[date[2], date[1],date[0]].join("-");
  let dateQuery ="update drive_details set date_of_drive=DATE_FORMAT('" +date +"', '%Y-%m-%d') where drive_id="+data.drive_id+"";
  con.query(dateQuery,(err,result)=>{
    if (err) throw err;
  });
  con.query("select id from drive_rounds where drive_id="+data.drive_id+"",(err,ids)=>{
    ids=(JSON.parse(JSON.stringify(ids)));
    let noOfRounds = data.rounds.length
    if(noOfRounds > ids.length){
      values=[[data.drive_id,data.rounds[noOfRounds-1]]]
      con.query("insert into drive_rounds (drive_id,round_id) values ?",[values]);
      con.query("update drive_details set no_of_rounds="+noOfRounds+" where drive_id="+data.drive_id+"");
    }
    else{
    let id_list = [];
    ids.forEach((element)=>{id_list.push(element.id)});
    con.query("update drive_details set no_of_rounds="+ids.length+" where drive_id="+data.drive_id+"");
    for(let i=0;i<id_list.length;i++){
        let roundQuery = "update drive_rounds set round_id ="+data.rounds[i]+" where id="+id_list[i]+"";
        con.query(roundQuery,(err,resultRound)=>{
          if (err) throw err;
        });
      }
    }
  });
  res.send('successfully modified!');
});

app.get("/passing/year",(req,res)=>{
  let sql = "select * from passing_out_year";
  con.query(sql,(err,result)=>{
    res.send(JSON.parse(JSON.stringify(result)));
  });
});

app.get("/student/details", upload.none(), (req, res) => {
  let sql = "select * from student_details";
  let data = [];
  con.query(sql, (err, result) => {
    if (err) throw err;
    data.push(JSON.parse(JSON.stringify(result)));
    res.send(data);
  });
});

app.listen(port);
