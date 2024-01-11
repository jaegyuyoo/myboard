const mongoclient = require("mongodb").MongoClient;
const ObjId = require("mongodb").ObjectId;
const url =
  "mongodb+srv://admin:1234@cluster0.hmvwkf5.mongodb.net/?retryWrites=true&w=majority";
let mydb;
mongoclient
  .connect(url)
  .then((client) => {
    mydb = client.db("myboard");

    app.listen(8080, function () {
      console.log("포트 8080으로 서버 대기중 ... ");
    });
  })
  .catch((err) => {
    console.log(err);
  });

const express = require("express");
const app = express();

const sha = require('sha256');

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

let session = require("express-session");
app.use(
  session({
    secret: "dkufe8938493j4e08349u",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//body-parser 라이브러리 추가
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
//정적 파일 라이브러리 추가
app.use(express.static("public"));

app.get("/", function (req, res) {
  if (req.session.passport) {
    console.log("세션 유지");

    res.render("index.ejs", { user: req.session.passport });
  } else {
    console.log("user : null");
    res.render("index.ejs", { user: null });
  }
});
app.get("/list", function (req, res) {
  mydb
    .collection("post")
    .find()
    .toArray()
    .then((result) => {
      console.log(result);
      res.render("list.ejs", { data: result });
    });
});

//'/enter' 요청에 대한 처리 루틴
app.get("/enter", function (req, res) {
  res.render("enter.ejs");
});

//'/save' 요청에 대한 post 방식의 처리 루틴
app.post("/save", function (req, res) {
  console.log(req.body.title);
  console.log(req.body.content);
  //몽고DB에 데이터 저장하기
  mydb
    .collection("post")
    .insertOne({
      title: req.body.title,
      content: req.body.content,
      date: req.body.someDate,
    })
    .then((result) => {
      console.log(result);
      console.log("데이터 추가 성공");
    });
 res.redirect("/list");
});

app.post("/delete", function (req, res) {
  console.log(req.body);
  req.body._id = new ObjId(req.body._id);
  mydb
    .collection("post")
    .deleteOne(req.body)
    .then((result) => {
      console.log("삭제완료");
      res.status(200).send();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send();
    });
});

//'/content' 요청에 대한 처리 루틴
app.get("/content/:id", function (req, res) {
  console.log(req.params.id);
  req.params.id = new ObjId(req.params.id);
  mydb
    .collection("post")
    .findOne({ _id: req.params.id })
    .then((result) => {
      console.log(result);
      res.render("content.ejs", { data: result });
    });
});

//'/edit' 요청에 대한 처리 루틴
app.get("/edit/:id", function (req, res) {
  req.params.id = new ObjId(req.params.id);
  mydb
    .collection("post")
    .findOne({ _id: req.params.id })
    .then((result) => {
      console.log(result);
      res.render("edit.ejs", { data: result });
    });
});

app.post("/edit", function (req, res) {
  console.log(req.body);
  req.body.id = new ObjId(req.body.id);
  mydb
    .collection("post")
    .updateOne(
      { _id: req.body.id },
      {
        $set: {
          title: req.body.title,
          content: req.body.content,
          date: req.body.someDate,
        },
      }
    )
    .then((result) => {
      console.log("수정완료");
      res.redirect("/list");
    })
    .catch((err) => {
      console.log(err);
    });
});

let cookieParser = require("cookie-parser");

app.use(cookieParser("ncvka0e398423kpfd"));
app.get("/cookie", function (req, res) {
  let milk = parseInt(req.signedCookies.milk) + 1000;
  if (isNaN(milk)) {
    milk = 0;
  }
  res.cookie("milk", milk, { signed: true });
  res.send("product : " + milk + "원");
});



app.get("/login", function (req, res) {
  console.log(req.session);
  if (req.session.user) {
    console.log("세션 유지");
    //res.send('로그인 되었습니다.');
    res.render("index.ejs", { user: req.session.user });
  } else {
    console.log("로그인 페이지");
    res.render("login.ejs");
  }
});

passport.serializeUser(function (user, done) {
  console.log("serializeUser");
  console.log(user.userkey);
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  console.log("deserializeUser");
  console.log(user);

  mydb
  .collection("account")
  .findOne({ userkey : user.userkey })
  .then((result) => {
    console.log(result);
    done(null, result);
  })
});

app.post(
  "/login",
  passport.authenticate("local", {
    succeessRedirect : '/',
    failureRedirect: "/fail",
  }),
  function (req, res) {
    // res.redirect("/");
    console.log(req.session);
    console.log(req.session.passport);
    res.render("index.ejs", { user: req.session.passport });
  }
);



passport.use(
  new LocalStrategy(
    {
      usernameField: "userid",
      passwordField: "userpw",
      session: true,
      passReqToCallback: false,
    },
    function (inputid, inputpw, done) {
      mydb
        .collection("account")
        .findOne({ userid: inputid })
        .then((result) => {
          console.log(result);
          if (result.userpw == sha(inputpw)) {
            console.log("새로운 로그인");
            done(null, result);
          } else {
            done(null, false, { message: "비밀번호 틀렸어요" });
          }
        });
    }
  )
);


app.get("/logout", function (req, res) {
  console.log("로그아웃");
  req.session.destroy();
  res.render("index.ejs", { user: null });
});

app.get("/signup", function (req, res) {
  res.render("signup.ejs");
});

app.post("/signup", function (req, res) {
  console.log(req.body.userid);
  console.log(req.body.userpw);
  console.log(req.body.usergroup);
  console.log(req.body.useremail);

  mydb
    .collection("account")
    .insertOne({
      userid: req.body.userid,
      userpw: req.body.userpw,
      usergroup: req.body.usergroup,
      useremail: req.body.useremail,
    })
    .then((result) => {
      console.log("회원가입 성공");
    });
  res.redirect("/");
});


app.get(
  '/facebook',
  passport.authenticate(
    'facebook'
  )
);

app.get(
  '/facebook/callback',
  passport.authenticate(
    'facebook',
    {
      succeessRedirect : '/',
      failureRedirect: "/fail",
    }),
    function (req, res) {
      console.log(req.session);
      console.log(req.session.passport);
      res.render("index.ejs", { user: req.session.passport });
    }
);

passport.use(new FacebookStrategy({
  clientID: '170983382262864',
  clientSecret: '1227b1002a055280eac4a047d76844a4',
  callbackURL: "/facebook/callback"
},
function(accessToken, refreshToken, profile, done) {
  console.log(profile);
  var authkey = 'facebook'+ profile.id;
  var authName = profile.displayName;

  console.log(authName);
  console.log(authkey);

  let loop = 0;
  while(loop < 2)
  {
    console.log(loop);
    mydb
      .collection("account")
      .findOne({ userkey: authkey })
      .then((result) => {
        if(result != null){
          console.log("-----------------------");
          console.log(result);
          console.log("find 페이스북 로그인 성공");
          done(null, result);
        }else{
          mydb
          .collection("account")
          .insertOne({
            userkey : authkey,
            userid: authName,
          })
          .then((result) => {
            console.log("-----------------------");
            console.log(result);
            console.log("insert 페이스북 로그인 성공");
            //done(null, result);
          });
        }
      }).catch((error) => {
        done(null, false, error);
      })
      loop++;
    }
  }
));