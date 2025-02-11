db = db.getSiblingDB('mindflow_db');
db.createCollection('chat_logs');

db = db.getSiblingDB("mindflow_db");

db.createUser({
  user: "REDACTED",
  pwd: "REDACTED",
  roles: [{ role: "readWrite", db: "mindflow_db" }]
});
