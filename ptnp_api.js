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
  password: "sriharsha@12345",
  database: "pragati_tnp"
});

con.connect(function(err) {
  if (err) {
    console.log(err);
  }
});

app.use(cors());
app.use(bodyParser.json());


app.post("/login/page",(req,res)=>{
  let returnData ={};
  let data = req.body.data;
  data.password= sha256(data.password);
  let sql = "select user_name,user_password,user_role,branch from users where user_name = '"+data.user+"' and delete_status='0'";
  con.query(sql,(err,result)=>{
    if (err){
      returnData.error = err.code;
      returnData.status = "Error!";
      returnData.login = false;
      res.send(returnData);
    }
    else if (result.length === 0){
      returnData.error = err.code;
      returnData.status = "User does not exist!";
      returnData.login = false;
      res.send(returnData);
    }
    else if(data.password === result[0]['user_password']){
      returnData.role =result[0]['user_role'];
      returnData.login = true;
      returnData.user = result[0]['user_name'];
      returnData.branch = result[0]['branch'];
      res.send(returnData);
    }
    else{
      returnData.login=false;
      returnData.status = "Sorry! Wrong password!"
      res.send(returnData);
    }
  });
});

app.post("/user/add", (req, res) => {
  let returnData = {};
  let data = req.body.data;
  console.log(data);
  if(data.branch === '') data.branch = null;
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
        "insert into users (user_name,user_password,user_role,branch) values('"+data.user +"','" +data.password+"','" +data.role +"',"+data.branch+")";
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
    if(err){
      returnData.error = err.code;
      returnData.status = "Error!";
      returnData.result = userResult;
    }
    else if (userResult.length === 0){
      returnData.status = "No users!";
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

app.post('/student/details',(req,res)=>{
  HTNO = req.body.HTNO;
  let personal=[];
  let drives=[];
  let returnData={}
  let sql="select *  from student_details where HTNO='"+HTNO+"'";
  con.query(sql,(err,result)=>{
    if(err) {
      returnData.status="Sorry ! Cannot find student";
      returnData.result=[];
    }
    else{
    personal.push(JSON.parse(JSON.stringify(result)));
    returnData.result=[personal[0][0]];
  let sql2 = "select d.company,r.round_name,dp.selected,dp.offer_letter from drive_process "+
"dp inner join drive_details d on d.drive_id=dp.drive_id inner join "+
"rounds r on r.id=dp.round_id where dp.HTNO='"+HTNO+"'";
  con.query(sql2,(err,result)=>{
    if(err)
    {
      returnData.status="Sorry cannot get the data"; 
      returnData.result[1]=drives;
    }
    else{
    drives.push(JSON.parse(JSON.stringify(result)));
    returnData.result[1]=drives[0];
    let options={year:'numeric',month:'2-digit',day:'2-digit'};
    returnData.result[0].DOB=new Date(returnData.result[0].DOB).toLocaleDateString('en-GB',options);
    delete returnData.result[0].SNO;
    returnData.status="Successfully imported data...";
    }
    res.send(returnData);  
 });
}
 });
});

app.post('/student/editDetail',(req,res)=>{
  returnData={};
  data=req.body;
  let date=data.DOB.split('/');
  DOB = [date[2], date[0], date[1]].join("-");
  if(data.BTECH_PERCENTAGE===null)
  data.BTECH_PERCENTAGE=0.00;
if(data.INTER_CGPA===null)
  data.INTER_CGPA=0.00;
if(data.SSC_PERCENTAGE===null)
  data.SSC_PERCENTAGE=0.00;
if(data.BTECH_CGPA===null)
  data.BTECH_PERCENTAGE=0.00;
if(data.INTER_PERCENTAGE===null)
  data.INTER_CGPA=0.00;
if(data.SSC_GPA===null)
  data.SSC_PERCENTAGE=0.00;
    sql= "update student_details set NAME='"+data.NAME+"',BRANCH_CODE='"+data.BRANCH_CODE+"',GENDER='"+data.GENDER+" "+
    "',BTECH_CGPA='"+data.BTECH_CGPA+"',BTECH_PERCENTAGE='"+data.BTECH_PERCENTAGE+"', "+
    "YOP_BTECH='"+data.YOP_BTECH+"',INTER_PERCENTAGE='"+data.INTER_PERCENTAGE+"',INTER_CGPA='"+data.INTER_CGPA+"', "+
    "YOP_INTER='"+data.YOP_INTER+"',SSC_PERCENTAGE='"+data.SSC_PERCENTAGE+"',SSC_GPA='"+data.SSC_GPA+"', "+
    "YOP_SSC='"+data.YOP_SSC+"',BTECH_BACKLOGS='"+data.BTECH_BACKLOGS+"',EMAIL='"+data.EMAIL+"',MOBILE='"+data.MOBILE+"',NPTEL_CERTIFICATIONS='"+data.NPTEL_CERTIFICATIONS+"', "+
    "OTHER_CERTIFICATIONS='"+data.OTHER_CERTIFICATIONS+"',DOB=DATE_FORMAT('"+DOB+"','%Y-%m-%d'),EAMCET_RANK='"+data.EAMCET_RANK+"', "+
    "PARENT_NAME='"+data.PARENT_NAME+"',PARENT_MOBILE='"+data.PARENT_MOBILE+"',ADDRESS='"+data.ADDRESS+"'where HTNO='"+data.HTNO+"'";
     con.query(sql,(err,result)=>{
      if(err) 
        returnData.status="Sorry!Details Cannot be updated";
      else
        returnData.status="Successfully updated";
      res.send(returnData);
     })
})

app.post('/search/student/driveEditDetail',(req,res)=>{
  let data=req.body.ups;
  let HTNO=req.body.HTNO;
  let selection_staus = 0;
  data.forEach((ele)=>{
    if(ele.selected==="Selected"){
      selection_staus++;
    }
    let sql="select id from rounds where round_name='"+ele.round_name+"'";
    con.query(sql);
      let sql2 = "update drive_process  set selected='"+ele.selected+"',offer_letter='"+ele.offer_letter+"',round_id='"+round_id[0].id+"'where HTNO ='"+HTNO+"'";
      con.query(sql2,(error,result)=>
      {
        if(error)
        {
          returnData.status="Sorry!Cannot updated";
        }
        else{
        if(selection_staus>=1){
          let sql = "update student_details set selection_status = '1' where HTNO = '"+HTNO+"' ";
          con.query(sql);
          returnData.status="Successfull";
        }
      }
      res.send(returnData);
      })
    })
  })


app.post("/students/filter", (req, res) => {
  let returnData = {};
  let data = req.body.data;
  let branch = [];
  let selectedDrives = [];
  let btech_name, inter_name, ssc_name;
  data.branch.forEach(element => {
    branch.push(parseInt(element));
  });
  branch = `${unescape(branch)}`;
  if(data.selectedCompanies !== undefined){
  data.selectedCompanies.forEach(ids=>{
    selectedDrives.push(parseInt(ids));
  })
  selectedDrives = `${unescape(selectedDrives)}`;
}
  if(data.eamcet_rank===null) data.eamcet_rank=1000000000;
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
  let sql;
  if (data.isSelected === "yes") {
    data.isSelected = "'0'";
    if(selectedDrives.length ===0){
      sql ="select distinct s.* from student_details s left join drive_process d on d.HTNO = s.HTNo where s."+btech_name+">="+data.btech_score+" and s."+inter_name+">="+data.class12_score+" and "+
    "s."+ssc_name+">="+data.class10_score+" and s.BTECH_BACKLOGS<="+data.backlogs+" and s.EAMCET_RANK<"+data.eamcet_rank+" and s.GENDER in ("+ data.gender +") "
     +"and s.YOP_BTECH="+data.year_of_passing+" and s.BRANCH_CODE in ("+branch+") and s.selection_status in('0','1') ";
    }
    else{
    sql ="select distinct s.* from student_details s left join drive_process d on d.HTNO = s.HTNo where s."+btech_name+">="+data.btech_score+" and s."+inter_name+">="+data.class12_score+" and "+
    "s."+ssc_name+">="+data.class10_score+" and s.BTECH_BACKLOGS<="+data.backlogs+" and s.EAMCET_RANK<"+data.eamcet_rank+" and s.GENDER in ("+ data.gender +") "
     +"and s.YOP_BTECH="+data.year_of_passing+" and s.BRANCH_CODE in ("+branch+") and s.selection_status = '0' or (s.selection_status = '1' and d.selected in ('selected') and d.drive_id in ("+selectedDrives+") )";
    }
  } 
  else {
    data.isSelected = "'0'";
    sql ="select * from student_details where "+btech_name+">="+data.btech_score+" and "+inter_name+">="+data.class12_score+" and "+
    ""+ssc_name+">="+data.class10_score+" and BTECH_BACKLOGS<="+data.backlogs+" and EAMCET_RANK<"+data.eamcet_rank+" and GENDER in ("+ data.gender +") "
     +"and YOP_BTECH="+data.year_of_passing+" and selection_status = "+data.isSelected+" and BRANCH_CODE in ("+branch+") ";
    }
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
          returnData.status="Successfully added to drive!";
          res.send(returnData);
        }
    });
  }
  else{
    result.forEach(ele=>{
      rollno.push(ele.HTNO);
      duplicates.push(ele.drive_id);
    })
    columnvalues.forEach((entry,i)=>{
      if(rollno.includes(entry[0])===false){
        let sql="insert into drive_process (HTNO,drive_id) values('"+entry[0]+"','"+entry[1]+"')";
        con.query(sql,(err,result)=>{
          if (err) {
            returnData.error=err.code;
            returnData.status = "Sorry! can not add students to drive!";
            res.send(returnData);
          }
          else{
            returnData.status="Successfully added to drive!";
          }
        });
      }
      else if(rollno.includes(entry[0])===true){
        if(duplicates.includes(Number(drive_id))===false){
          let sql="insert into drive_process (HTNO,drive_id) values('"+entry[0]+"','"+entry[1]+"')";
          con.query(sql,(err,result)=>{
            if (err) {
              returnData.error=err.code;
              returnData.status = "Sorry! can not add students to drive!";
              res.send(returnData);
            }
            else{
              returnData.status="Successfully added to drive!";
              if(columnvalues.length-1 === i){
                send();
              }
            }
        });
        }
        else{
          returnData.status = "Successfully added to drive!";
          if(columnvalues.length-1 === i){
            send();
          }
        }
      }
    });
    function send(){
    res.send(returnData);
    }
  }
  });
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
    if (err){
      returnData.error = err.code;
      returnData.status = "Error!";
      returnData.returnData = driveResult;
      res.send(returnData);
    }
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
  con.query(dateQuery);
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
          con.query(roundQuery);
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
  let date = new Date().toLocaleDateString("en-GB").split("/");
  date = [date[2], date[0], date[1]].join("-");
  let noOfDrives;
  let sql;
  if(parseInt(data) === new Date().getFullYear())
  {
    sql =
    "select * from drive_details where YEAR(date_of_drive)=" + data + " and date_of_drive < "+date+" and delete_status='0'";
  }
  else
  {
    sql =
    "select * from drive_details where YEAR(date_of_drive)=" + data + " and delete_status='0'";
  }
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

app.post('/drive/rounds',(req,res)=>{
  let  drive_name=req.body.drive_name;
  sql="select r.round_name from rounds r inner join drive_details d "+
"inner join drive_rounds dr on r.id=dr.round_id and "+
"d.drive_id=dr.drive_id where d.company='"+drive_name+"'";
  con.query(sql,(err,result)=>
  {
    if(err||result.length===0){
      returnData.status="Sorry!Cannot find round name";
      returnData.result=[];
    }
    else{
      returnData.status="Successfull";
    returnData.result=JSON.parse(JSON.stringify(result));
    }
  })
  res.send(returnData);
})

app.post("/drives/drivesList", (req, res) => {
  let returnData={};
  let data = req.body.data;
  date = data.date.split("/");
  date = [date[2], date[1], date[0]].join("-");
  let values = [];
  sql ="select drive_id,company from drive_details where date_of_drive= '"+date +"'";
  con.query(sql, (err, drive_list) => {
    if (err || drive_list.length===0){
      returnData.status="Sorry! No drives are available";
      returnData.result=values;
    }
    else{
    drive_list.forEach(element => {
      values.push(JSON.parse(JSON.stringify(element)));
      returnData.result=values;
      returnData.status="Successful";
    });
  }
    res.send(values);
  });
});

app.post("/drives/performance/driveDetails", (req, res) => {
  returnData = {};
  values = [];
  values1 = [];
  data = req.body;
  let drive_id = data.drive_id;
  sql1 ="select dp.HTNO,r.round_name,dp.attendance_status,dp.selected,dp.offer_letter from drive_process dp inner join rounds r on dp.drive_id='"+drive_id +"' and r.id = dp.round_id";
  con.query(sql1, (err, selected) => {
    if (err||selected.length===0)
    {
        returnData.status="Sorry! There are no students";
        returnData.result = values;
        res.send(returnData);
    } 
    else{
    selected.forEach(ele => {
      values.push(JSON.parse(JSON.stringify(ele)));
    });
    returnData.result=[values];
    sql ="select r.round_name from drive_rounds dr inner join rounds r on r.id=dr.round_id and drive_id='" +drive_id +"'";
    con.query(sql, (err, result) => {
      if (err||result.length===0) {
        returnData.status="Sorry ! NO round is present";
        returnData.result=values1;
      }
      else{
      result.forEach(ele => {
        values1.push(JSON.parse(JSON.stringify(ele)));
      });
      returnData.result[1]=values1;
      returnData.status = "Successfull";
    }
    res.send(returnData);
    });
  }
  });

});

app.post("/drives/performance/editDetail", (req, res) => {
  returnData={};
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
    if (err||round_id[0].length===0) {
      returnData.status="Sorry! No round present";
      res.send(returnData);
    }
    else{
    round_id = JSON.parse(JSON.stringify(round_id));
    round_id = round_id[0].id;
    sql2 ="update drive_process set round_id='"+round_id +"',attendance_status='" +attendance_status +"',selected='"+selected+"',offer_letter='"+offer_letter+"' where drive_id='" +drive_id +"'and HTNO='" +HTNO +"'";
    con.query(sql2, (error, result) => {
      if (error) 
        returnData.status="Sorry !Failed to update";
      else{
      if(selected === 1){
        let sql = "update student_details set selection_status = '1' where HTNO = '"+HTNO+"' ";
        con.query(sql);
        returnData.status="Successfully updated";
      }
    }
    res.send(returnData);
    });
  }
  });
});

app.get("/drives/special",(req,res)=>{
  let returnData ={};
  let data = [];
  let drives;
  let year = new Date().getFullYear();
  let sql = "select drive_id,company,date_of_drive from drive_details where (YEAR(date_of_drive) = "+year+" or YEAR(date_of_drive) = "+(year-1)+") and delete_status='0'";
  con.query(sql,(err,result)=>{
    if(err || result.length === 0){
      returnData.status = "Sorry! No drives available!";
      res.send(returnData);
    }
    else{
    result.forEach(drive=>{
      drives = {};
      drives.name = (drive.company+" - "+new Date(drive.date_of_drive).toLocaleDateString('en-GB'));
      drives.value = JSON.stringify(drive.drive_id);
      data.push(drives);
    })
    returnData.result = data;
    returnData.status = "Successfull!";
    res.send(returnData);
    }
  });
});

app.post("/round/add", function(req, res) {
  let returnData = {};
  let data = req.body;
  let sql = "select count(round_name) from rounds where round_name='"+data.data+"'and delete_status='0'";
  con.query(sql,(error,count)=>{
    if(error) res.send("cannot find round name");
    else{
    count=count[0]['count(round_name)'];
    if(count===0){
    let sql = "insert into rounds (round_name) values ('" + data.data + "')";
    con.query(sql, (err, result) => {
    if (err) res.send("cannot insert rounds");
    else{
      res.send("Rounds added successfully");
    }
  });
}
}
});
});

app.get("/rounds", function(req, res) {
  let returnData = {};
  con.query("select * from rounds where delete_status='0'", (err, result) => {
    if (err){
      returnData.error = err.code;
      returnData.status = "Error!";
      returnData.result = [];
      res.send(returnData);
    }
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
      if (err) {returnData.error = err.code;
        returnData.status = "Error!";
        returnData.result = [];
        res.send(returnData);}
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

app.post('/test/addData',upload.array("file", 12),(req,res)=>{
  let files = req.files;
  let filenames=[];
  let originalnames=[];
  let excluding=[];
  let returnData = {};
  files.forEach((ele)=>{
    ele=ele.originalname.split(' ');
    originalnames.push(ele[0]);
    if(!excluding.includes(ele[0]))
      excluding.push(ele[0]);  
  })
  for(let i=0;i<excluding.length;i++){
    let sql="select count(*) from test_tnp where test_name='"+excluding[i]+"'";
    con.query(sql,(err,count)=>{
      count=(JSON.parse(JSON.stringify(count)));
      if(count[0]['count(*)']===0)
      {
        con.query("insert into test_tnp (test_name) values ('"+excluding[i]+"')");
        if(i==excluding.length-1)
          next();
      }
      else{
        next();
      }
    })
    returnData.status = "Successfull!";
    res.send(returnData)
  }
next=()=>{
  for(let i=0;i<originalnames.length;i++){
      con.query("select id from test_tnp where test_name='"+originalnames[i]+"'",(error,test_id)=>{
        test_id=(JSON.parse(JSON.stringify(test_id)));
        test_id=(test_id[0].id);
        filenames.push(files[i].path);
        const obj = xlsx.parse(filenames[i]);
        let records = obj[0].data;
        let HTNO=[];
        let grades=[];
        let unique_sub=[];
        let sub=[];
        let ori_sub=[];
        // console.log(records);
        for(let i=2;i<records[0].length;i++){
          sub.push(records[0][i]);
          if(!ori_sub.includes(records[0][i]))
            ori_sub.push(records[0][i]);
        }
        // console.log(sub);
        for(let i=1;i<records.length;i++){
          HTNO.push(records[i][1]);
        }
        for(let i=2;i<records[0].length;i++){
          for(let j=1;j<records.length;j++)
            grades.push(records[j][i]);
        }
        // console.log(grades);
        let k=0;
        sub.forEach(ele=>{
        let sql2="select count(*) from sub_tnp where sub_name='"+ele+"'";
        con.query(sql2,(err,count)=>{
        count=(JSON.parse(JSON.stringify(count)));
        if(count[0]['count(*)']===0)
        {
          con.query("insert into sub_tnp (sub_name) values ('"+ele+"')");
        }
        con.query("select id from sub_tnp where sub_name='"+ele+"'",(error,sub_id)=>{
        sub_id=(JSON.parse(JSON.stringify(sub_id)));
        sub_id=(sub_id[0].id);
        for(let j=0;j<HTNO.length;j++)
        {
          // console.log(j);
          let duplicate = "select count(*) from training_test where HTNO='"+HTNO[j]+"'and test_id='"+test_id+"'and sub_id='"+sub_id+"'";
          con.query(duplicate,(err,dup)=>{
              dup=JSON.parse(JSON.stringify(dup));
              if((dup[0]['count(*)'])===0)
                  con.query("insert into training_test(HTNO,test_id,sub_id,marks) values('"+HTNO[j]+"','"+test_id+"','"+sub_id+"','"+grades[k]+"')");
              else 
              con.query("update training_test set marks='"+grades[k]+"'where HTNO='"+HTNO[j]+"'and test_id='"+test_id+"'and sub_id='"+sub_id+"'");
              k++;
          })
        }})
      })
    })
    })
  }
}

})

app.post('/tests/subjects',(req,res)=>{
 returnData = {};
 branch = req.body.branch;
 year = req.body.year;
 sub=[];
 let sql='';
 if(branch==='all')
 {
   sql = "select distinct s.sub_name from sub_tnp s inner join student_details st on st.YOP_BTECH = '"+year+"' inner join training_test t on t.HTNO=st.HTNO where t.sub_id = s.id";
 }
 else{
 sql = "select distinct s.sub_name from sub_tnp s inner join student_details st on st.BRANCH_CODE = '"+branch+"' and st.YOP_BTECH = '"+year+"' inner join training_test t on t.HTNO=st.HTNO where t.sub_id = s.id";
 }

 con.query(sql,(err,result)=>{
   result=JSON.parse(JSON.stringify(result))
   result.forEach(ele=>{
     sub.push(ele.sub_name);
   })
   returnData['subjects']=sub;
   res.send(returnData);
 });

})

app.post('/display/testdata',(req,res)=>{
  let branch=req.body.branch_code;
  let year = req.body.yop;
  let sub = req.body.subject;
  let result={};
  let testName=[];
  let testData=[];
  let sql;
  let sql3;
  let returnData={};
  if(branch==='all'){
    lengt = "select distinct t.test_id from training_test  t inner join student_details s on s.YOP_BTECH='"+year+"'";
      if(sub==='all'){
   sql="select distinct t.HTNO from training_test t inner join student_details s on s.HTNO=t.HTNO where s.YOP_BTECH='"+year+"'";
  }
  else{
   sql="select distinct t.HTNO from training_test t inner join student_details s on s.HTNO=t.HTNO inner join sub_tnp st on st.id=t.sub_id where s.YOP_BTECH='"+year+"' and st.sub_name='"+sub+"'";
  }}
  else{
    lengt = "select distinct t.test_id from training_test  t inner join student_details s on s.BRANCH_CODE='"+branch+"' and s.YOP_BTECH='"+year+"'";
     if(sub==='all'){
    sql="select distinct t.HTNO from training_test t inner join student_details s on s.HTNO=t.HTNO where s.BRANCH_CODE='"+branch+"'and s.YOP_BTECH='"+year+"'";
   }
   else{
    sql="select distinct t.HTNO from training_test t inner join student_details s on s.HTNO=t.HTNO inner join sub_tnp st on st.id=t.sub_id where s.BRANCH_CODE='"+branch+"' and s.YOP_BTECH='"+year+"' and st.sub_name='"+sub+"'";
   }
}con.query(lengt,(e,len)=>{
        len=len.length;
        console.log(len);
  con.query(sql,(err,roll)=>{
    roll=JSON.parse(JSON.stringify(roll));
    roll.forEach((ele,j) => {
      let test={};
      let avg=[];
      let a=0;

    if(branch==='all'){
       sql3="select distinct t.id,t.test_name from training_test tt inner join test_tnp t on t.id = tt.id inner join student_details s on s.YOP_BTECH='"+year+"'"; 
    }
    else{
       sql3="select distinct t.id,t.test_name from training_test tt inner join test_tnp t on t.id = tt.id inner join student_details s on s.YOP_BTECH='"+year+"'and s.BRANCH_CODE='"+branch+"'";
    }
      con.query(sql3,(er,test_name)=>{
        let testId=[];
        testName=[];
        test_name=JSON.parse(JSON.stringify(test_name))
        test_name.forEach(test=>{
          testName.push(test.test_name);
          testId.push(test.id);
        })
        // console.log(testId);
        test['rollNumber']=JSON.parse(JSON.stringify(ele.HTNO))
    testId.forEach((name,i)=>{
      if(sub==='all'){
         sql2 = "select ts.sub_name,t.marks from training_test t inner join test_tnp tt on t.test_id=tt.id inner join sub_tnp ts on ts.id = t.sub_id where t.HTNO='"+ele.HTNO+"' and t.test_id='"+name+"'";

      }
      else{
    sql2 = "select ts.sub_name,t.marks from training_test t inner join test_tnp tt on t.test_id=tt.id inner join sub_tnp ts on ts.id = t.sub_id where t.HTNO='"+ele.HTNO+"' and t.test_id='"+name+"'and sub_name='"+sub+"'";
      }con.query(sql2,(err,marks)=>{
      result={};
      marks = JSON.parse(JSON.stringify(marks));
      marks.forEach(element=>{
        result[element.sub_name]=element.marks;
        avg.push(element.marks);
      })
      console.log(avg);
      test[testName[i]]=JSON.parse(JSON.stringify(result));
      if(i===testId.length-1){
        let sum=avg.reduce((a,b)=> a+=b);
        console.log(sum,len);
        sum=sum/len;
        test['avg']=sum;
     }
      testData[j]=(JSON.parse(JSON.stringify(test)));
      if(j===roll.length-1 && i===testId.length-1){
          returnData.testData=testData;
          returnData.status="succcessful";
          // console.log(returnData)
          res.send(returnData);
      }
          })      
        })
      })
    });
  })
  })
})

app.post('/tests',(req,res)=>{
  branch=req.body.branch;
  year=req.body.year;
  returnData = {};
   let test=[];
  let sql;
  if(branch==='all')
  {
    sql="select distinct s.test_name from test_tnp s inner join student_details sd on sd.YOP_BTECH='"+year+"'inner join training_test t on t.HTNO=sd.HTNO where s.id=t.sub_id";
  }
  else{
   sql = "select distinct s.test_name from test_tnp s inner join student_details sd on sd.BRANCH_CODE='"+branch+"'and sd.YOP_BTECH='"+year+"'inner join training_test t on t.HTNO=sd.HTNO where s.id=t.sub_id";
  }con.query(sql,(err,result)=>{
    result=JSON.parse(JSON.stringify(result))
    result.forEach(ele=>{
      test.push(ele.test_name);
    })
    returnData['tests']=test;
    console.log(returnData);
    res.send(returnData);
  });
 
 })


app.post('/tests/passing',(req,res)=>{
  let sql="select distinct YOP_BTECH from student_details order by YOP_BTECH desc";
  let returnData={};
  let result=[];
  con.query(sql,(err,respo)=>{
    respo=JSON.parse(JSON.stringify(respo));
    respo.forEach(ele=>{
      result.push(ele.YOP_BTECH);
    })
    returnData.result=result;
    returnData.status="successfull";
    res.send(returnData);
  })
})

app.post('/tests/subs/include',(req,res)=>{
  let branch=req.body.branch_code;
  let year=req.body.yop;
  let sub=req.body.subject;
  let tests=[];
  let testnames=[];
  let subs=[];
  let final={};
  let returnData={};
  let sql;
  let sql2;
  if(branch==='all'){
     sql = "select distinct t.test_id,tt.test_name from training_test  t inner join student_details s on s.YOP_BTECH='"+year+"'inner join test_tnp tt on t.test_id=tt.id"  
  }
  else{
  sql = "select distinct t.test_id,tt.test_name from training_test  t inner join student_details s on s.BRANCH_CODE='"+branch+"' and s.YOP_BTECH='"+year+"'inner join test_tnp tt on t.test_id=tt.id"
  }con.query(sql,(err,re)=>
  {
    re=JSON.parse(JSON.stringify(re));
    re.forEach(ele=>{
      tests.push(ele.test_id);
      testnames.push(ele.test_name);
    })
    tests.forEach((ele,i)=>{
      let subs=[];
      if(sub==='all'){
       sql2="select distinct st.sub_name from training_test t inner join sub_tnp st on t.sub_id=st.id where test_id='"+ele+"'";
      }
      else
      {
        sql2="select distinct st.sub_name from training_test t inner join sub_tnp st on t.sub_id=st.id where test_id='"+ele+"' and sub_name='"+sub+"'";
      }
      con.query(sql2,(error,result)=>{
        result=JSON.parse(JSON.stringify(result));
        result.forEach(ele=>{
          subs.push(ele.sub_name);
        })
        final[testnames[i]]=subs;
        if(i===tests.length-1){
          returnData['subject_count']=final;
          res.send(returnData);}
      })
    })
  })
})

app.listen(port);
