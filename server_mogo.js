const express = require('express');
const app = express();
const sha = require('sha256');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const mongoclient = require('mongodb').MongoClient;
const ObjId = require('mongodb').ObjectId;
const url = 'mongodb+srv://admin:1234@jaegyu.lblbmk1.mongodb.net//?retryWrites=true&w=majority';
let mydb;
mongoclient.connect(url)
    .then((client => {
        mydb = client.db('myboard');
        mydb.collection('account').find().toArray().then(result => {
            // console.log(result);
        })
        app.listen(8080, function () {
            console.log("포트 8080으로 서버 대기중 ...")
        });

    })
    );

// body-parser 라이브러리 추가
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
// 정적 파일 라이브러리 추가
app.use(express.static('public'));

let session = require('express-session');
app.use(session({
    secret: 'dkufe8938493j4e08349u',
    resave: false,
    saveUninitialized: true,
})
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/session', function (req, res) {
    if (isNaN(req.session.milk)) {
        req.session.milk = 0;
    }
    req.session.milk = req.session.milk + 1000;
    res.send('session : ' + req.session.milk + '원');
});

app.get('/login', function (req, res) {
    //console.log('로그인 페이지');
    //res.render('login.ejs');
    console.log(req.session);
    if (req.session.user) {
        console.log('세션 유지');
        // res.send('로그인 되었습니다.');
        res.render('index.ejs', { user: req.session.user });
    } else {
        res.render('login.ejs');
    }
});

app.post('/login', function (req, res) {
    console.log('아이디 : ' + req.body.userid);
    console.log('비밀번호 : ' + req.body.userpw);
    //res.send('로그인 되었습니다.');

    mydb
        .collection('account')
        .findOne({ userid: req.body.userid })
        .then((result) => {
            if (result.userpw == sha(req.body.userpw)) {
                req.session.user = req.body;
                console.log('새로운 로그인');
                res.render('index.ejs', {user:req.session.user});
                /// res.send('로그인 되었습니다.');
            } else {
                res.render('login.ejs');
                /// res.send('비밀번호가 틀렸습니다.');
            }
        });
});

app.get("/logout", function (req, res) {
    console.log('로그아웃');
    req.session.destroy();
    /// res.redirect("/");
    res.render('index.ejs', { user: null });
});

app.get('/', function (req, res) {
    res.render('index.ejs', { user: null });
});

app.get('/signup', function (req, res) {
    res.render('signup.ejs');
});

app.post('/signup', function (req, res) {
    console.log(req.body.userid);
    console.log(sha(req.body.userpw));
    console.log(req.body.usergroup);
    console.log(req.body.useremail);

    mydb.collection('account')
        .insertOne({
            userid: req.body.userid,
            userpw: sha(req.body.userpw),
            usergroup: req.body.usergroup,
            useremail: req.body.useremail,
        })
        .then((result) => {
            console.log("회원가입 성공");
        });
    res.redirect("/");
});