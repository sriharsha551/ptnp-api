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
  password: "koushik@999",
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

app.post('/drives/add',upload.none(),(req,res)=>{
  let data = req.body.data;
  company = data['company'];
  round_id = data['round_id'];
  delete data['round_id'];
  let date = data["date_of_drive"].split('/');
  data['date_of_drive'] = [date[2],date[1],date[0]].join('-');
  let columns = Object.keys(data);
  let values = Object.values(data);
  //round_id = values.pop();
  values = [values];
  // round_id.forEach((id)=>{
  //   values[0].push(id);
    let sql = "insert into drive_details ("+columns+") values ?";
    con.query(sql,[values],(err,res)=>{
      if (err) throw err;
   })
   con.query("select * from drive_details where company = ('"+data.company+"')" ,(err,result2)=>{
      if(err) throw err;
      let drive_values=[];
      let temp=[]
      drive_id=result2[0].drive_id;
      drive_values.push(drive_id);
      // console.log(values2);
      round_id.forEach((id)=>{

         temp.push(id);
      //  console.log(round_id);

    })
   //drive_values.push(temp);
   //console.log(drive_values);
   let drive_columns = [];
   drive_columns.push("drive_id");
   drive_columns.push("round_id");
   drive_values=[drive_values];
   temp.forEach((id)=>{
        drive_values.push(id);
   
   let sql2 = "insert into drive_rounds ("+drive_columns+") values ?";
    con.query(sql2,[drive_values],(error,resul)=>{
      if (error) throw error;
    })
    drive_values.pop();
    })

    values[0].pop();
  });
});

app.put('/round/add', function(req, res) {
  let data = req.body;
  let sql = "insert into rounds (round_name) values ('"+data.data+"')";
  con.query(sql,(err,result)=>{
    if (err) throw err
    //console.log(result);
  });
  res.send('Rounds added successfully');
  });

  app.get('/rounds',function(req,res){
  con.query("select * from rounds",(err,result)=>{
    if (err) throw err
    res.send(JSON.parse(JSON.stringify(result)));
  });
});

app.post('/rounds/delete',(req,res)=>{
  data = req.body;
  con.query("alter table rounds auto_increment = "+1+" ");
  con.query("delete from rounds where id = ("+data.id+") ",(err,result)=>{
  if(err) throw err
  });
  res.send("Deleted successfully!")
});

app.get('/drives/upcoming',(req,res)=>{
  let date = new Date().toLocaleDateString('en-GB').split('/');
  date = [date[2],date[0],date[1]].join('-');  
  let sql = "select * from drive_details where date_of_drive>=DATE_FORMAT('"+date+"', '%Y-%m-%d')";
  con.query(sql,(err,result)=>{
    if (err) throw err; 
    result = JSON.parse(JSON.stringify(result));
        result.forEach((element)=>{
          console.log(element);
          
    });
    res.send('hi')  ;
  })
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
