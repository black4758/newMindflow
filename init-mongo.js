// root 계정이 있는지 확인 후 생성
db.createUser({
  user: "root",
  pwd: process.env.MONGO_ROOT_PASSWORD || "1234",
  roles: [{ role: "root", db: "admin" }]
});

db = db.getSiblingDB("mindflow_db");

// mindflow_db에 계정 추가
db.createUser({
  user: process.env.MONGO_USERNAME || "ssafy",
  pwd: process.env.MONGO_PASSWORD || "ssafy",
  roles: [{ role: "readWrite", db: "mindflow_db" }]
});

// chat_logs 컬렉션 생성
db.createCollection("chat_logs");
