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

  

  let sql ="select * from student_details where "+btech_name+">="+data.btech_score+" and "+inter_name+">="+data.class12_score+" and "+
  ""+ssc_name+">="+data.class10_score+" and BTECH_BACKLOGS<="+data.backlogs+" and EAMCET_RANK<"+data.eamcet_rank+" and GENDER in ("+ data.gender +") "
   +"and YOP_BTECH="+data.year_of_passing+" and selection_status in ("+data.isSelected+") and BRANCH_CODE in ("+branch+") ";


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
      // returnData.status = "Successfull!";
      // res.send(returnData)
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
                if((dup[0]['count(*)'])===0){
                    con.query("insert into training_test(HTNO,test_id,sub_id,marks) values('"+HTNO[j]+"','"+test_id+"','"+sub_id+"','"+grades[k]+"')",(errorr,re)=>{
                    if(err)
                      console.log(HTNO[j]);})
                    }
                else {
                con.query("update training_test set marks='"+grades[k]+"'where HTNO='"+HTNO[j]+"'and test_id='"+test_id+"'and sub_id='"+sub_id+"'",(errorr,re)=>{
                  if(err)
                    console.log(HTNO[j]);
                })
                }k++;
                console.log(HTNO[j]);
            })
          }})
        })
      })
      })
      if(i===originalnames.length-1)
      {
        returnData.status = "Successfull!";
        res.send(returnData)
      }
    }
  }
  
  })

  app.get("/subjects", function(req, res) {
    let returnData = {};
    con.query("select * from sub_tnp where delete_status='0'", (err, result) => {
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


  let sql = "insert into training_test (HTNO,test_id,sub_id,marks) values('"+student[0]+"','"+testId+"','"+columns[i]+"','"+student[i]+"')";

  app.post("/test/addData", upload.array("file", 12), (req, res) => {
    let files = req.files;
    let testId = req.body.test_id;
    let filename = files[0].path;
    let returnData = {};
    let rollno = [];
    let duplicates = [];
    const obj = xlsx.parse(filename);
    let records = obj[0].data;
    records.forEach(record => {
      record.shift();
    });
    let columns = records[0];
    records.shift();
    console.log(records);
    records.forEach((student, studentNo) => {
      for (let i = 1; i <columns.length; i++) {
      let duplicate = "select HTNO,test_id,count(*) from training_test group by HTNO,test_id having count(*)>1";
      con.query(duplicate,(err,result)=>{
        result=JSON.parse(JSON.stringify(result));
        if(result.length===0){
          let sql = "insert into training_test (HTNO,test_id,sub_id,marks) values('"+student[0]+"','"+testId+"','"+columns[i]+"','"+student[i]+"')";
          con.query(sql,(err,insertResult)=>{
            if (err) {
              console.log(err);
              returnData.error=err.code;
              returnData.status = "Sorry! can not add data!";
              res.send(returnData);
            }
            else{
              returnData.status="Successfully added!";
              if(studentNo === records.length-1  && i===columns.length-1)
              update();
            }
        });
      }
      else{
        result.forEach(ele=>{
          if(rollno.includes(ele.HTNO)===false){
            rollno.push(ele.HTNO);
            duplicates.push(ele.test_id);
          }
        });
        if(rollno.includes(student[0])===false)
        {
          let sql = "insert into training_test (HTNO,test_id,sub_id,marks) values('"+student[0]+"','"+testId+"','"+columns[i]+"','"+student[i]+"')";
          con.query(sql,(err,result)=>{
            if (err) {
              returnData.error=err.code;
              returnData.status = "Sorry! can not add!";
              res.send(returnData);
            }
            else{
              returnData.status="Successfully added!";
            }
          });
        }
        else if(rollno.includes(student[0])===true){
          if(duplicates.includes(Number(testId))===false){
            let sql = "insert into training_test (HTNO,test_id,sub_id,marks) values('"+student[0]+"','"+testId+"','"+columns[i]+"','"+student[i]+"')";            con.query(sql,(err,result)=>{
                if (err) {
                  returnData.error=err.code;
                  returnData.status = "Sorry! can not add !";
                  res.send(returnData);
                }
                else{
                  returnData.status="Successfully added!";
                  if(studentNo === records.length-1  && i===columns.length-1){
                    update();
                  }
                }
            });
            }
            else{
              returnData.status = "Successfully added to drive!";
              if(studentNo === records.length-1  && i===columns.length-1){
                update();
              }
            }
          }    
      }
      });
    }
  });
  function update (){
    res.send(returnData);
  }
  });