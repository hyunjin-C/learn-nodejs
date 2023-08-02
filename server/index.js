const express = require("express");
const app = express();
const port = 5000;

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const config = require("./config/key");

const { User } = require("./models/User");
const { auth } = require("./middleware/auth");

// bodyParser가 클라이언트에서 오는 정보를 서버에서 분석해서 가져올 수 있게 해줌
// req.body로 클라이언트에서 온 정보를 받아준다.
app.use(bodyParser.urlencoded({ extended: true })); // aplication/x-www-form-urlencoded
app.use(bodyParser.json()); // aaplication/json
app.use(cookieParser());

const mongoose = require("mongoose");
mongoose
  .connect(config.mongoURI)
  .then(() => console.log("MongoDB Connected...")) // 연결 성공
  .catch((err) => console.log("에러: ", err)); // 연결 실패

app.get("/", (req, res) => {
  res.send("hello world");
});

// 회원가입
app.post("/api/users/register", (req, res) => {
  // endpoint: '/register'
  // 회원가입할 때 필요한 정보들을 가져오면 그것들을 데이터베이스에 넣어준다.
  const user = new User(req.body);

  // user.save(): req.body에 있는 정보가 user 모델에 저장된다.
  user.save().then(() => {
    try {
      res.status(200).json({
        success: true,
      });
    } catch (err) {
      return res.json({ success: false, err });
    }
  });
});

// 로그인
app.post("/api/users/login", (req, res) => {
  // 요청된 이메일을 데이터베이스에 있는지 찾는다.
  User.findOne({ email: req.body.email }).then(() => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "제공된 이메일에 해당하는 유저가 없습니다.",
      });
    }
  });

  // 요청된 이메일이 데이터베이스에 있다면 비밀번호가 맞는지 확인한다.
  user.comparePassword(req.body.password, (err, isMatch) => {
    if (!isMatch) {
      return res.json({
        loginSuccess: false,
        message: "비밀번호가 틀렸습니다.",
      });
    }
    // 비밀번호가 맞다면 토큰 생성한다.
    user.generateToken((err, user) => {
      if (err) return res.status(400).send(err);

      // 토큰을 저장한다. 어디에? 쿠키, 로컬스토리지, 세션스토리지 등 다양한 곳에 저장 가능 -> 모두 장단점이 있음
      res
        .cookie("x_auth", user.token)
        .status(200)
        .json({ loginSuccess: true, userId: user._id });
    });
  });
});

// Auth 기능
app.get("/api/users/auth", auth, (req, res) => {
  // 여기까지 미들웨어를 통과해왔다는 것은 Authentication이 True라는 말
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
  });
});

// 로그아웃
app.get("/api/users/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }).then(() => {
    try {
      res.status(200).send({
        success: true,
      });
    } catch (err) {
      return res.json({ success: false, err });
    }
  });
});

// client와 연결해보기
app.get("/api/hello", (req, res) => {
  res.send("안녕하세요~~!");
});

app.listen(port);
