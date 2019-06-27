const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const bodyParser = require("body-parser");
const sha256 = require('sha256');
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

app.post("/login/page",(req,res)=>{
  let returnData ={};
  let data = req.body.data;
  data.password= sha256(data.password);
  let sql = "select user_name,user_password,user_role from users where user_name = '"+data.user+"' and delete_status='0'";
  con.query(sql,(err,result)=>{
    if (err || result.length===0){
      returnData.status = "User does not exist!";
      returnData.login = false;
      res.send(returnData);
    }
    else if(data.password === result[0]['user_password']){
      returnData.role =result[0]['user_role'];
      returnData.login = true;
      returnData.user = result[0]['user_name'];
      res.send(returnData);
    }
    else{
      returnData.login=false;
      res.send(returnData);
    }
  });
});

app.post("/user/add", (req, res) => {
  let returnData = {};
  let data = req.body.data;
  data.password = sha256(data.password);
  let sql = "select user_name from users where delete_status='0'";
  con.query(sql, (err, userResult) => {
    let userList = [];
    userResult.forEach(user => {
      userList.push(user.user_name);
    });
    if (userList.includes(data.user)) {
      returnData.status = "User already exists!";
      res.send(returnData);
    }
    else{
      let sql =
        "insert into users (user_name,user_password,user_role) values('"+data.user +"','" +data.password+"','" +data.role +"')";
      con.query(sql, (err, result) => {
        if (err) {
          returnData.error = err.code;
          returnData.status = "Sorry! can not add user!";
          res.send(returnData);
        }
        else{
          returnData.status = "User added successfully!";
          res.send(returnData);
        }
      });
    }
  });
});

app.get("/users/all",(req,res)=>{
  let returnData = {};
  let sql = "select user_id,user_name from users where delete_status='0'";
  con.query(sql, (err, userResult) => {
    if(err || userResult.length===0){
      returnData.error = err.code;
      returnData.status = "No users found!";
      returnData.result = userResult;
    }
    else{
    returnData.result =JSON.parse(JSON.stringify(userResult));
    res.send(returnData);
  }
});
});

app.post("/user/reset",(req,res)=>{
  let returnData = {};
  let data = req.body.data;
  let sql = "update users set user_password = '"+sha256(data.password)+"' where user_id = "+data.selected_user+" ";
  con.query(sql,(err,result)=>{
    if(err){
      returnData.error = err.code;
      returnData.status = "Password reset failed!";
      res.send(returnData);
    }
    else{
      returnData.status = "Password reset successfull!";
      res.send(returnData);
    }
  });
});

app.post("/user/delete",(req,res)=>{
  let returnData = {};
  let data = req.body.data;
  let sql = "update users set delete_status='1' where user_id = "+data.userID+" ";
  con.query(sql,(err,result)=>{
    if(err){
      returnData.error = err.code;
      returnData.status = "Sorry! can not delete user!";
      res.send(returnData);
    }
    else{
      returnData.status = "User deleted!";
      res.send(returnData);
    }
  });
});

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
    let sql = "insert into student_details (" + records[0] + ") values ? on duplicate key update "+ 
    "NAME=values(NAME),BRANCH_CODE=values(BRANCH_CODE),GENDER = values(GENDER),BTECH_CGPA=values(BTECH_CGPA), "+
    "BTECH_PERCENTAGE=values(BTECH_PERCENTAGE),YOP_BTECH=values(YOP_BTECH),INTER_PERCENTAGE=values(INTER_PERCENTAGE), "+
    "INTER_CGPA=values(INTER_CGPA),YOP_INTER=values(YOP_INTER),SSC_PERCENTAGE=values(SSC_PERCENTAGE), "+
    "SSC_GPA=values(SSC_GPA),YOP_SSC=values(YOP_SSC),BTECH_BACKLOGS=values(BTECH_BACKLOGS),EMAIL=values(EMAIL), "+
    "MOBILE=values(MOBILE),NPTEL_CERTIFICATIONS=values(NPTEL_CERTIFICATIONS),OTHER_CERTIFICATIONS=values(OTHER_CERTIFICATIONS), "+
    "DOB=values(DOB),EAMCET_RANK=values(EAMCET_RANK),PARENT_NAME=values(PARENT_NAME),PARENT_MOBILE=values(PARENT_MOBILE), "+
    "ADDRESS=values(ADDRESS)";
    con.query(sql, [values], function(err) {
      if (err) {
        returnData.error=err.code;
        returnData.status = "Sorry! can not import students data!";
        res.send(returnData);
      }
    });
  });
  returnData.status = "Data Imported Successfully!";
  res.send(returnData);
});

app.get("/student/details", upload.none(), (req, res) => {
  let returnData = {};
  let sql = "select s.*,d.company,r.round_name,dp.selected,dp.offer_letter from student_details s inner join drive_process dp on HTNO='"+data.HTNO+"'inner join drive_details d on d.drive_id=dp.drive_id inner join rounds r  on r.id=dp.round_id where HTNO='"+data.HTNO+"'";
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
  if(data.eamcet_rank===null) data.eamcet_rank=1000000000;
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
    if (err) {
      returnData.error=err.code;
      returnData.result=[];
      returnData.status = "Sorry! can not filter students!";
      res.send(returnData);
    }
    else{
      if(result.length===0){
        returnData.error = "Invalid criteria!"
        returnData.status = "No students to filter for given criteria!";
        returnData.result=result;
        res.send(returnData);
      }
      else{
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
    returnData.status = "Filtered successfully!"
    res.send(returnData);
    }
  }
  });
});

app.post("/students/addToDrive",(req,res)=>{
  let returnData={};
  let data = req.body.data;
  let drive_id = data.driveToAdd;
  let students = data.students;
  let rollno=[];
  let columnvalues=[];
  let duplicates=[];
  students.forEach(student=>{
    columnvalues.push([student.HTNO,drive_id]);
  });
  let duplicate = "select HTNO,drive_id,count(*) from drive_process group by HTNO,drive_id having count(*) >=1";
  con.query(duplicate,(err,result)=>{
    result=JSON.parse(JSON.stringify(result));
    if(result.length===0){
      let sql = "insert into drive_process (HTNO,drive_id) values ?";
      con.query(sql,[columnvalues],(err,result)=>{
        if (err) {
          returnData.error=err.code;
          returnData.status = "Sorry! can not add students to drive!";
          res.send(returnData);
        }
        else{
          returnData.status="Successfully added to drive!"
        }
    });
  }
  else{
    result.forEach(ele=>{
      rollno.push(ele.HTNO);
      duplicates.push(ele.drive_id);
    })
    columnvalues.forEach(entry=>{
      if(rollno.includes(entry[0])===false){
        let sql="insert into drive_process (HTNO,drive_id) values('"+entry[0]+"','"+entry[1]+"')";
        con.query(sql,(err,result)=>{
          if (err) {
            returnData.error=err.code;
            returnData.status = "Sorry! can not add students to drive!";
            res.send(returnData);
          }
          else{
            returnData.status="Successfully added to drive!"
          }
        });
      }
      if(rollno.includes(entry[0]===true)){
        if(duplicates.includes(drive_id)===false){
          let sql="insert into drive_process (HTNO,drive_id) values('"+entry[0]+"','"+entry[1]+"')";
          con.query(sql,(err,result)=>{
            if (err) {
              returnData.error=err.code;
              returnData.status = "Sorry! can not add students to drive!";
              res.send(returnData);
            }
            else{
              returnData.status="Successfully added to drive!"
            }
        });
        }
      }
    })
  }
  });
    res.send(returnData);
});

app.post("/drives/add", upload.none(), (req, res) => {
  let returnData = {};
  let data = req.body.data;
  round_id = data.round_id;
  delete data["round_id"];
  let date = data["date_of_drive"].split("/");
  data["date_of_drive"] = [date[2], date[1], date[0]].join("-");
  let columns = Object.keys(data);
  let values = [Object.values(data)];
  let drive_id;
  let sql = "insert into drive_details (" + columns + ") values ? ";
  con.query(sql,[values],(err, result) => {
    if (err) {
      returnData.error=err.code;
      returnData.status = "Sorry! can not add drive!";
      res.send(returnData);
    }
    else{
    drive_id=result.insertId;
    let noOfRounds = round_id.length;
    round_id.forEach((id,i)=>{
      let sql = "insert into drive_rounds (drive_id,round_id) values('"+drive_id+"','"+id+"')";
      con.query(sql,(err,result)=>{
        if (err) {
          returnData.error=err.code;
          returnData.status = "Sorry! can not add drive!";
          res.send(returnData);
        }
        else{
          returnData.status = "Successfully added!";
          if(noOfRounds-1 === i){
            update();
          }
        }
      });
    });
  }
  });
  function update(){
    res.send(returnData);
  }
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
    if (err) {
      returnData.error=err.code;
      returnData.status = "Sorry! Error occured";
      res.send(returnData);
    }
    driveData = JSON.parse(JSON.stringify(result));
    if (driveData.length === 0) {
      returnData.result = driveData;
      res.status = "No upcoming drives!"
      res.result =driveData;
      res.send(returnData);
    } else {
      noOfDrives = driveData.length;
      for (let i = 0; i < driveData.length; i++) {
        let drive_id = driveData[i].drive_id;
        let sql =
          "select round_id from drive_rounds where drive_id =" +
          drive_id +
          " and delete_status='0'";
        con.query(sql, (error, resData) => {
          let round_ids = JSON.parse(JSON.stringify(resData));
          let round_list = [];
          let noOfRounds = resData.length;
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
    }
  });
  function updateDrive(driveData, i) {
    if (i === noOfDrives - 1) {
      returnData.result = driveData;
      res.status= "Upcoming drives!"
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
    "select id from drive_rounds where drive_id=" + data.drive_id + " and delete_status='0'",
    (err, ids) => {
      ids = JSON.parse(JSON.stringify(ids));
      let noOfRounds = data.roundIds.length;
      if (noOfRounds > ids.length) {
        values = [[data.drive_id, data.roundIds[noOfRounds - 1]]];
        con.query("insert into drive_rounds (drive_id,round_id) values ?", [values]);
        con.query("update drive_details set no_of_rounds=" +noOfRounds +" where drive_id=" +data.drive_id +"");
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
            data.roundIds[i] +
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
    "select * from drive_details where YEAR(date_of_drive)=" + data + "";
  con.query(sql, (err, result) => {
    if (err){}
    olddriveData = JSON.parse(JSON.stringify(result));
    if (olddriveData.length === 0) {
      returnData.result = olddriveData;
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
  let sql = "select count(round_name) from rounds where round_name='"+data.data+"'and delete_status='0'";
  con.query(sql,(error,count)=>{
    if(error) throw error;
    count=count[0]['count(round_name)'];
  if(count===0){
  let sql = "insert into rounds (round_name) values ('" + data.data + "')";
  con.query(sql, (err, result) => {
    if (err) throw err;
    returnData.status = "Rounds added Successfully";
  });
  }
  else
  returnData.status = "Rounds cannot be Added";
  res.send(returnData);
});
});

app.get("/rounds", function(req, res) {
  let returnData = {};
  con.query("select * from rounds where delete_status='0'", (err, result) => {
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
  let sql = "select distinct YEAR(date_of_drive) from drive_details where delete_status='0' ";
  con.query(sql, (err, result) => {
    if(err){
      returnData.error = err.code;
      returnData.status = "No years present!";
      returnData.result = result;
      res.send(returnData);
    }
    else{
    result = JSON.parse(JSON.stringify(result));
    let resultYear = [];
    result.forEach((ele)=>{
      resultYear.push(ele['YEAR(date_of_drive)']);
    })
    returnData.result = resultYear;
    returnData.status = "Successfull!"
    res.send(returnData);
    }
  });
});

app.post("/drives/drivesList", (req, res) => {
  let date = req.body.date.split("/");
  date = [date[2], date[1], date[0]].join("-");
  let values = [];
  sql =
    "select drive_id,company from drive_details where date_of_drive='" +
    date +
    "'";
  con.query(sql, (err, drive_list) => {
    if (err) throw err;
    drive_list.forEach(element => {
      values.push(JSON.parse(JSON.stringify(element)));
    });
    res.send(values);
  });
});

app.post("/drives/performance/driveDetails", (req, res) => {
  returnData = {};
  values = [];
  values1 = [];
  data = req.body;
  let drive_id = data.drive_id;
  sql1 =
    "select dp.HTNO,r.round_name,dp.attendance_status,dp.selected,dp.offer_letter from drive_process dp inner join rounds r on dp.drive_id='" +
    drive_id +
    "' and r.id = dp.round_id";
  con.query(sql1, (err, selected) => {
    if (err) throw err;
    selected.forEach(ele => {
      values.push(JSON.parse(JSON.stringify(ele)));
    });
    returnData.students = values;
    sql =
      "select r.round_name from drive_rounds dr inner join rounds r on r.id=dr.round_id and drive_id='" +
      drive_id +
      "'";
    con.query(sql, (err, result) => {
      if (err) throw err;
      result.forEach(ele => {
        values1.push(JSON.parse(JSON.stringify(ele)));
      });
      returnData.rounds = values1;
      res.send(returnData);
    });
  });
});

app.post("/drives/performance/editDetail", (req, res) => {
  round_name = req.body.round_name;
  attendance_status = req.body.attendanceStatus;
  HTNO = req.body.HTNO;
  drive_id = req.body.drive_id;
  selected = req.body.selected;
  offer_letter = req.body.offer_letter;
  if (selected === "Selected") selected = 1;
  else selected = 2;
  if (offer_letter === "Submitted") offer_letter = 1;
  else offer_letter = 2;

  if (attendance_status === "P") attendance_status = 2;
  else attendance_status = 1;
  sql = "select id from rounds where round_name='" + round_name + "'";
  con.query(sql, (err, round_id) => {
    if (err) throw err;
    round_id = JSON.parse(JSON.stringify(round_id));
    round_id = round_id[0].id;
    sql2 =
      "update drive_process set round_id='"+round_id +"',attendance_status='" +attendance_status +"',selected='"+selected+"',offer_letter='"+offer_letter+"' where drive_id='" +drive_id +"'and HTNO='" +HTNO +"'";
    con.query(sql2, (error, result) => {
      if (error) throw error;
    });
  });
  res.send("successfull");
});

app.listen(port);
