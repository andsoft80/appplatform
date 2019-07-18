/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var express = require('express');
var fs = require('fs');
const fse = require('fs-extra')
var zlib = require('zlib');
var zip = require('machinepack-zip');
var fstream = require('fstream');
var unzip = require('unzip');
const path = require('path');
const multer = require("multer");
var upload = multer({dest: 'uploads/'});
const YAML = require('yamljs');

const swaggerUi = require('swagger-ui-express');





var app = express();
var cors = require('cors');
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({extended: false})); // to support URL-encoded bodies
app.use(cors());
app.use(express.static('static'));
app.listen(3000, function () {
    console.log('Start : localhost: ' + 3000);
});
var mysql = require('mysql');
var mySqlServerHost = 'localhost';

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({extended: false})); // to support URL-encoded bodies
const DisableTryItOutPlugin = function () {
    return {
        statePlugins: {
            spec: {
                wrapSelectors: {
                    allowTryItOutFor: () => () => false
                }
            }
        }
    }
}

const options = {
    swaggerOptions: {
        plugins: [
            DisableTryItOutPlugin
        ]
    }
};

app.all('/*', function (req, res, next) {
    
    next();
});

app.post('/showdocs', function (req, res) {
    var swaggerDocument = null;
    if (req.body.servicename) {
        YAML.load('./services/' + req.body.servicename + '/api/swagger/swagger.yaml', function (result)
        {
            if (result) {
                swaggerDocument = result;
                app.use('/' + req.body.servicename + '-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
                res.send('/' + req.body.servicename + '-docs');
            } else {
                res.end("Ошибка: Документация найдена!");
            }
        });
    } else {
        res.end("Ошибка: Имя сервиса не передано!");
    }

    

});




app.get('/', function (req, res) {
    res.sendFile('index.html');

});
app.get('/loadModule', function (req, res) {

    res.sendFile(path.join(__dirname + '/static/loadservice.html'));

});

/////////////universal sql api//////////////////////////////////
app.post('/table/:tableName/action/:action', function (req, res) {
    res.set({
        'Content-Type': 'text/plain',
        'charset': 'utf-8'
    });
//    var authNeed = 1;
//    if (req.body.an == 0) {
//        authNeed = req.body.an;
//    }
//    ;
//
//    var curruser = req.session.user;
//    if (typeof curruser === 'undefined' && authNeed == 1) {
//        res.write(JSON.stringify('Not authorized!'));
//        res.end();
//        return;
//    }

    var con = mysql.createConnection({
        host: mySqlServerHost,
        user: 'root',
        password: 'root',
        database: 'appplatform'


    });
    con.connect(function (err) {
        if (err)
            throw err;


    });

    var tableName = req.params.tableName;
    var action = req.params.action;

    if (action === 'post') {
        sqlStr = "INSERT INTO " + tableName + " (";
        for (i = 0; i < Object.keys(req.body).length; i++) {
            if (Object.keys(req.body)[i] == 'an') {
                continue;
            }
            sqlStr = sqlStr + Object.keys(req.body)[i] + ",";
        }
        sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr = sqlStr + ") VALUES (";
        for (i = 0; i < Object.keys(req.body).length; i++) {
            if (Object.keys(req.body)[i] == 'an') {
                continue;
            }
            sqlStr = sqlStr + "'" + req.body[Object.keys(req.body)[i]] + "',";
        }
        sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr = sqlStr + ")";

        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));
            res.end(JSON.stringify(result));

        });
    }
    if (action === 'put') {
        var id = req.body.id;
        sqlStr = "update " + tableName + " set ";
        for (i = 0; i < Object.keys(req.body).length; i++) {
            if (Object.keys(req.body)[i] === 'id') {
                continue;
            }
            if (Object.keys(req.body)[i] == 'an') {
                continue;
            }
            sqlStr = sqlStr + Object.keys(req.body)[i] + "='" + req.body[Object.keys(req.body)[i]] + "',"
        }
        sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr = sqlStr + "where id = " + id;

        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));
            res.end(JSON.stringify(result));

        });
    }

    if (action === 'delete') {

        var id = req.body.id;

        sqlStr = "delete from " + tableName + " where id =  " + id;

        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));
            res.end(JSON.stringify(result));

        });


    }
    if (action === 'get') {

        var id = req.body.id;
        var condition = req.body.condition;

        var str = '';
        if (condition) {

            str = "where " + condition[0].field + " = '" + condition[0].value + "'";
            for (i = 1; i < condition.length; i++) {
                str = str + ' and ' + condition[i].field + " = '" + condition[i].value + "'";
            }
        }
        if (id) {
            sqlStr = "select * from " + tableName + " where id =  " + id + " " + str;
        } else {
            sqlStr = "select * from " + tableName + " " + str;
        }


        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));
            res.end(JSON.stringify(result));
            //res.end(result);
            console.log(JSON.stringify(result));

        });


    }
    if (action === 'get_columns') {


        sqlStr = "DESC " + tableName;
        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));



            //console.log(JSON.stringify(columns));
            res.end(JSON.stringify(result));

        });


    }
    con.end(function (err) {
        if (err) {
            return console.log("Ошибка: " + err.message);
        }
    });

});

//////////////////////////////////////////////

app.get('/servicelist', function (req, res) {

    var con = mysql.createConnection({
        host: mySqlServerHost,
        user: 'root',
        password: 'root',
        database: 'appplatform'


    });
    con.connect(function (err) {
        if (err)
            throw err;


    });




    sqlStr = "select * from servicelist";



    con.query(sqlStr, function (err, result) {
        if (err)
            res.end(JSON.stringify(err));
        //res.end(JSON.stringify(result));
        var parcel = {};
        parcel.data = result;
        parcel.recordsTotal = result.length;
        parcel.recordsFiltered = result.length;
        res.json(parcel);


    });
    con.end(function (err) {
        if (err) {
            return console.log("Ошибка: " + err.message);
        }
    });

});


app.post("/upload", upload.single('file'), function (req, res, next) {
    //console.log(req.file);
    let filedata = req.file;

    if (!filedata)
        res.send("error");
    else
        res.send(req.file.path);

});



app.post('/unzip', function (req, res) {

    var source = req.body.src;
    var dest = req.body.dest;
    var origzipname = req.body.origzipname;

    var dn = origzipname.substring(0, origzipname.length - 4);

    //fs.createReadStream(source).pipe(unzip.Extract({path: dest}));
    var zip = require("machinepack-zip");
    zip.unzip({
        source: source,
        destination: dest,
    }).exec({
        error: function (err) {
            alert("error")
        },

        success: function () {
            //delete temp folder content after finish uncompress 




            var ncp = require("ncp").ncp;

            //ncp(path.join(__dirname, dest, 'swagger-node-example-master/'), path.join(__dirname, dest));
            ncp(path.join(__dirname, dest, dn), path.join(__dirname, dest), function (err) {
                if (err) {
                    return console.error(err);
                }
                fse.removeSync(path.join(__dirname, dest, dn));
                res.send('Загрузка модуля завершена!');
            });
        },
    });

});

app.post("/startservice", function (req, res) {


});

