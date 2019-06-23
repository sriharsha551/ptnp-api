const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const bodyParser = require("body-parser");
const { getJsDateFromExcel } = require("excel-date-to-js");
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

app.post("/students/add", upload.array("file", 12), (req, res) => {
  let returnData = {};
  let files = req.files;
  filenames = [];
  for (let i = 0; i < Object.keys(files).length; i++) {
    filenames.push(files[i].path);
  }
  filenames.forEach(path => {
    const obj = xlsx.parse(path);
    let records = obj[0].data;
    let index = records[0].indexOf("DOB");
    for (let i = 1; i < records.length; i++) {
      records[i][index] = getJsDateFromExcel(records[i][index]);
    }
    let values = [records[1], records[2], records[3]];
    console;
    let sql = "insert into student_details (" + records[0] + ") values ? on duplicate key update "+ 
    "NAME=values(NAME),BRANCH_CODE=values(BRANCH_CODE),GENDER = values(GENDER),BTECH_CGPA=values(BTECH_CGPA), "+
    "BTECH_PERCENTAGE=values(BTECH_PERCENTAGE),YOP_BTECH=values(YOP_BTECH),INTER_PERCENTAGE=values(INTER_PERCENTAGE), "+
    "INTER_CGPA=values(INTER_CGPA),YOP_INTER=values(YOP_INTER),SSC_PERCENTAGE=values(SSC_PERCENTAGE), "+
    "SSC_GPA=values(SSC_GPA),YOP_SSC=values(YOP_SSC),BTECH_BACKLOGS=values(BTECH_BACKLOGS),EMAIL=values(EMAIL), "+
    "MOBILE=values(MOBILE),NPTEL_CERTIFICATIONS=values(NPTEL_CERTIFICATIONS),OTHER_CERTIFICATIONS=values(OTHER_CERTIFICATIONS), "+
    "DOB=values(DOB),EAMCET_RANK=values(EAMCET_RANK),PARENT_NAME=values(PARENT_NAME),PARENT_MOBILE=values(PARENT_MOBILE), "+
    "ADDRESS=values(ADDRESS)";
    con.query(sql, [values], function(err) {
      if (err) throw err;
    });
  });
  returnData.status = "Data Imported Successfully!";
  res.send(returnData);
});

app.get("/student/details", upload.none(), (req, res) => {
  let returnData = {};
  let sql = "select * from student_details";
  let data = [];
  con.query(sql, (err, result) => {
    if (err) throw err;
    data.push(JSON.parse(JSON.stringify(result)));
    returnData.result = data;
    res.send(returnData);
  });
});

app.post("/students/filter", (req, res) => {
  let returnData = {};
  let data = req.body.data;
  let branch = [];
  let btech_name, inter_name, ssc_name;
  data.branch.forEach(element => {
    branch.push(parseInt(element));
  });
  branch = `${unescape(branch)}`;

  if (data.isSelected === "yes") {
    data.isSelected = "'0','1'";
  } else {
    data.isSelected = "'0'";
  }
  if (data.gender === "all") {
    data.gender = "'M','F'";
  }
  else{
    data.gender=`'${data.gender}'`;
  }
  if (data.class10_score_type === "percentage") {
    ssc_name = "SSC_PERCENTAGE";
  } else {
    ssc_name = "SSC_GPA";
  }
  if (data.class12_score_type === "percentage") {
    inter_name = "INTER_PERCENTAGE";
  } else {
    inter_name = "INTER_CGPA";
  }
  if (data.btech_score_type === "cgpa") {
    btech_name = "BTECH_CGPA";
  } else {
    btech_name = "BTECH_PERCENTAGE";
  }

  let sql ="select * from student_details where "+btech_name+">="+data.btech_score+" and "+inter_name+">="+data.class12_score+" and "+
  ""+ssc_name+">="+data.class10_score+" and BTECH_BACKLOGS<="+data.backlogs+" and EAMCET_RANK<"+data.eamcet_rank+" and GENDER in ("+ data.gender +") "
   +"and YOP_BTECH="+data.year_of_passing+" and selection_status in ("+data.isSelected+") and BRANCH_CODE in ("+branch+") ";
  
   con.query(sql, (err, result) => {
    result = JSON.parse(JSON.stringify(result));
    result.forEach(student => {
      if (student.SSC_GPA === null) {
        delete student.SSC_GPA;
        student.class10_score = student.SSC_PERCENTAGE;
        delete student.SSC_PERCENTAGE;
      } else {
        delete student.SSC_PERCENTAGE;
        student.class10_score = student.SSC_GPA;
        delete student.SSC_GPA;
      }
      if (student.INTER_CGPA === null) {
        delete student.INTER_CGPA;
        student.class12_score = student.INTER_PERCENTAGE;
        delete student.INTER_PERCENTAGE;
      } else {
        delete student.INTER_PERCENTAGE;
        student.class12_score = student.INTER_GPA;
        delete student.INTER_GPA;
      }
      if (student.BTECH_CGPA === null) {
        delete student.BTECH_CGPA;
        student.btech_score = student.BTECH_PERCENTAGE;
        delete student.BTECH_PERCENTAGE;
      } else {
        delete student.BTECH_PERCENTAGE;
        student.btech_score = student.BTECH_CGPA;
        delete student.BTECH_CGPA;
      }
    });
    returnData.result = result;
    res.send(returnData);
  });
});

app.post("/students/addToDrive",(req,res)=>{
  let returnData={};
  let data = req.body.data;
  let drive_id = data.driveToAdd;
  let students = data.students;
  let columnvalues=[];
  let values=[];
  students.forEach(student=>{
    columnvalues.push([student.HTNO,drive_id]);
  });
  
  let duplicate = "select HTNO,drive_id,count(*) from drive_process group by HTNO,drive_id having count(*) >=1";
  con.query(duplicate,(err,result)=>{
    result=JSON.parse(JSON.stringify(result));
    console.log(result[0]);
    let sql = "insert into drive_process (HTNO,drive_id) values ?";
    con.query(sql,[columnvalues],(err,result)=>{
      if (err) throw err;
      returnData.status="Sucessfully added to drive!";
      res.send(returnData);
    });
  });
  
});

app.post("/drives/add", upload.none(), (req, res) => {
  let returnData = {};
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
  returnData.status = "Successfully added!";
  res.send(returnData);
});

app.get("/drives/upcoming", (req, res) => {
  let returnData = {};
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
    if (driveData.length === 0) {
      returnData.result = driveData;
      res.send(returnData);
    } else {
      noOfDrives = driveData.length;
      for (let i = 0; i < driveData.length; i++) {
        let drive_id = driveData[i].drive_id;
        let noOfRounds = driveData[i].no_of_rounds;
        let sql =
          "select round_id from drive_rounds where drive_id =" +
          drive_id +
          " and delete_status='0'";
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
              +9;
              driveData[i]["rounds"] = round_list;
              if (noOfRounds - 1 === j) {
                updateDrive(driveData, i);
              }
            });
          }
        });
      }
    }
  });
  function updateDrive(driveData, i) {
    if (i === noOfDrives - 1) {
      returnData.result = driveData;
      res.send(returnData);
    }
  }
});

app.post("/drives/delete", (req, res) => {
  let returnData = {};
  let data = req.body.data;
  let sql =
    "update drive_details set delete_status='1' where drive_id=" +
    data.drive_id +
    "";
  con.query(sql, (err, driveResult) => {
    if (err) throw err;
  });
  returnData.status = "Deleted Successfully";
  res.send(returnData);
});

app.post("/drives/rounds/delete", (req, res) => {
  let returnData = {};
  let data = req.body.data;
  let noOfRounds = data.noOfRounds - 1;
  if (noOfRounds >= 1) {
    con.query(
      "update drive_rounds set delete_status='1' where drive_id=" +
        data.drive_id +
        " and round_id=" +
        data.round_id +
        ""
    );
    con.query(
      "update drive_details set no_of_rounds=" +
        noOfRounds +
        " where drive_id=" +
        data.drive_id +
        ""
    );
    returnData.status = "Successfully deleted!";
    res.send(returnData);
  } else {
    returnData.status = "Atleast one round must be present!";
    res.send(returnData);
  }
});

app.post("/drives/modify", (req, res) => {
  let returnData = {};
  let data = req.body.data;
  let date = data.date.split("/");
  date = [date[2], date[1], date[0]].join("-");
  let dateQuery =
    "update drive_details set date_of_drive=DATE_FORMAT('" +
    date +
    "', '%Y-%m-%d') where drive_id=" +
    data.drive_id +
    "";
  con.query(dateQuery, (err, result) => {
    if (err) throw err;
  });
  con.query(
    "select id from drive_rounds where drive_id=" + data.drive_id + "",
    (err, ids) => {
      ids = JSON.parse(JSON.stringify(ids));
      let noOfRounds = data.rounds.length;
      if (noOfRounds > ids.length) {
        values = [[data.drive_id, data.rounds[noOfRounds - 1]]];
        con.query("insert into drive_rounds (drive_id,round_id) values ?", [
          values
        ]);
        con.query(
          "update drive_details set no_of_rounds=" +
            noOfRounds +
            " where drive_id=" +
            data.drive_id +
            ""
        );
      } else {
        let id_list = [];
        ids.forEach(element => {
          id_list.push(element.id);
        });
        con.query(
          "update drive_details set no_of_rounds=" +
            ids.length +
            " where drive_id=" +
            data.drive_id +
            ""
        );
        for (let i = 0; i < id_list.length; i++) {
          let roundQuery =
            "update drive_rounds set round_id =" +
            data.rounds[i] +
            " where id=" +
            id_list[i] +
            "";
          con.query(roundQuery, (err, resultRound) => {
            if (err) throw err;
          });
        }
      }
    }
  );
  returnData.status = "Successfully modified!";
  res.send(returnData);
});

app.post("/drives/olddrive", (req, res) => {
  let returnData = {};
  let data = req.body.data;
  let noOfDrives;
  let sql =
    "select * from drive_details where YEAR(date_of_drive)=" + data.year + "";
  con.query(sql, (err, result) => {
    if (err) throw err;
    olddriveData = JSON.parse(JSON.stringify(result));
    if (olddriveData.length === 0) {
      returnData.result = driveData;
      res.send(returnData);
    } else {
      noOfDrives = olddriveData.length;
      for (let i = 0; i < olddriveData.length; i++) {
        let drive_id = olddriveData[i].drive_id;
        let noOfRounds = olddriveData[i].no_of_rounds;
        let sql =
          "select round_id from drive_rounds where drive_id =" +
          drive_id +
          " and delete_status='0'";
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
              +9;
              olddriveData[i]["rounds"] = round_list;
              if (noOfRounds - 1 === j) {
                updateDrive(olddriveData, i);
              }
            });
          }
        });
      }
    }
  });
  function updateDrive(olddriveData, i) {
    if (i === noOfDrives - 1) {
      returnData.result = olddriveData;
      res.send(returnData);
    }
  }
});

app.post("/round/add", function(req, res) {
  let returnData = {};
  let data = req.body;
  let sql = "insert into rounds (round_name) values ('" + data.data + "')";
  con.query(sql, (err, result) => {
    if (err) throw err;
  });
  returnData.status = "Rounds added Successfully";
  res.send(returnData);
});

app.get("/rounds", function(req, res) {
  let returnData = {};
  con.query("select * from rounds", (err, result) => {
    if (err) throw err;
    returnData = { result: JSON.parse(JSON.stringify(result)) };
    res.send(returnData);
  });
});

app.post("/rounds/delete", (req, res) => {
  let returnData = {};
  data = req.body;
  con.query(
    "update rounds set delete_status ='1' where id = (" + data.id + ") ",
    (err, result) => {
      if (err) throw err;
    }
  );
  returnData.status = "Deleted Successfully";
  res.send(returnData);
});

app.get("/passing/year", (req, res) => {
  let returnData = {};
  let sql = "select * from passing_out_year";
  con.query(sql, (err, result) => {
    returnData.result = JSON.parse(JSON.stringify(result));
    res.send(returnData);
  });
});


app.listen(port);
