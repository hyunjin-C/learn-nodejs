// MongoDB Model & Schema

const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // A library to help you hash passwords.
const saltRounds = 10; // salt를 생성할 때 몇 자리인지로 할건지
const jwt = require("jsonwebtoken");

// Schema 생성
const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50,
  },
  email: {
    type: String,
    trim: true, // 띄어쓰기 제거
    unique: 1, // 같은 이메일 X
  },
  password: {
    type: String,
    minlength: 5,
  },
  lastname: {
    type: String,
    maxlength: 50,
  },
  role: {
    // 관리자/일반 유저
    type: Number,
    default: 0,
  },
  image: String,
  token: {
    // 유효성 관리
    type: String,
  },
  tokenExp: {
    // 토큰 사용할 수 있는 기간
    type: Number,
  },
});

// 비밀번호 암호화 하기
userSchema.pre("save", function (next) {
  var user = this;

  // 비밀번호를 바꿀 때만 비밀번호 암호화하도록 조건 달아야 함
  if (user.isModified("password")) {
    // salt를 이용해서 비밀번호 암호화
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err);
      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) return next(err);
        user.password = hash; // 비밀번호를 hash로 바꿔주기
        next();
      });
    });
  } else {
    next();
  }
});

userSchema.methods.comparePassword = function (plainPassword, cb) {
  // plainPassword 1234567 암호화된 비밀번호(복호화X -> plainPassword를 다시 암호화해서 비교)
  bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

userSchema.methods.generateToken = function (cb) {
  // jsonwebtoken 이용해서 token 생성하기
  var user = this;

  var token = jwt.sign(user._id.toHexString(), "secretToken");
  user.token = token;
  user.save().then(() => {
    try {
      cb(null, user);
    } catch (err) {
      return cb(err);
    }
  });
};

userSchema.statics.findByToken = function (token, cb) {
  var user = this;
  // token을 decode(복호화)한다.
  jwt.verify(token, "secretToken", function (err, decoded) {
    // 유저 아이디를 이용해서 유저를 찾은 다음 클라이언트에서 가져온 token과 DB에 보관된 token이 일치하는지 확인
    user.findOne({ _id: decoded, token: token }).then(() => {
      try {
        cb(null, user);
      } catch (err) {
        return cb(err);
      }
    });
  });
};

// schema를 model로 감싸기
const User = mongoose.model("User", userSchema); // 모델의 이름, schema

// model를 다른 파일에서도 쓸 수 있도록 export
module.exports = { User };
