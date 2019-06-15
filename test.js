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
function connect (callback){
con.connect(function(err) {
  if (err) throw err;
    let sql = "select * from drive_rounds";
  con.query(sql, function(err, result) {
    if (err) throw err;
    console.log(result);
    callback();
  });
});
}
function test(){
console.log("hi");}

connect(test);

app.get("/drives/upcoming", (req, res) => {
  let date = new Date().toLocaleDateString("en-GB").split("/");
  date = [date[2], date[0], date[1]].join("-");
  let apiData;
  let sql =
    "select * from drive_details where date_of_drive>=DATE_FORMAT('" +
    date +
    "', '%Y-%m-%d')";
    con.query(sql, (err,result) => {
      if (err) throw err;
      let drive_list=[];
      apiData = JSON.parse(JSON.stringify(result));
      apiData.forEach((drive)=>{
        let drive_id = drive.drive_id;
        let noOfRounds = drive.no_of_rounds;
        let sql = "select round_id from drive_rounds where drive_id ="+drive_id+"";
        con.query(sql,(error,resData)=>{
          let round_ids = JSON.parse(JSON.stringify(resData));
          let round_list =[];
          for(let i=1;i<=round_ids.length;i++){
            let sql = "select round_name from rounds where id="+round_ids[i].round_id+"";
            con.query(sql,(err,result)=>{
              round_list.push(result[0].round_name);
              drive['rounds']=round_list;
              if (noOfRounds == i){
              update(drive);
              }
            });
          }
        });
      });
      function update(driveData){
        drive_list.push(driveData);
        console.log(driveData);
      }
    });
});




app.get("/drives/upcoming", (req, res) => {
  let date = new Date().toLocaleDateString("en-GB").split("/");
  date = [date[2], date[0], date[1]].join("-");
  let apiData;
  let sql =
    "select * from drive_details where date_of_drive>=DATE_FORMAT('" +
    date +
    "', '%Y-%m-%d')";
    con.query(sql, (err,result) => {
      if (err) throw err;
      let drive_list=[];
      apiData = JSON.parse(JSON.stringify(result));
      apiData.forEach((drive)=>{
        let drive_id = drive.drive_id;
        let noOfRounds = drive.no_of_rounds;
        let sql = "select round_id from drive_rounds where drive_id ="+drive_id+"";
        con.query(sql,(error,resData)=>{
          let round_ids = JSON.parse(JSON.stringify(resData));
          let round_list =[];
          for(let i=0;i<round_ids.length;i++){
            let sql = "select round_name from rounds where id="+round_ids[i].round_id+"";
            con.query(sql,(err,result)=>{
              round_list.push(result[0].round_name);
              drive['rounds']=round_list;
              update(drive);
            });
          }
        });
      });
      function update(driveData){
        
      }
    });
});