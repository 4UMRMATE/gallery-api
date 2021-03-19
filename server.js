const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const { Schema } = mongoose;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

// app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

mongoose.connect(`${process.env.DB_URI}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const pictureSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
});

const Picture = new mongoose.model("Picture", pictureSchema);

app.get("/api/gallery/pictures", async (req, res) => {
  try {
    const pictures = await Picture.find();
    res.json(pictures);
  } catch (err) {
    res.json({ error: err });
  }
});

app.post("/api/gallery/new-picture/", async (req, res) => {
  let img_url = "";
  req.query.url ? (img_url = req.query.url) : (img_url = req.body.picture_url);
  const newPicture = new Picture({
    url: img_url,
  });

  newPicture.save();
  res.json(newPicture);
});

const commentSchema = new Schema({
  picture_id: ObjectId,
  author: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  date: String,
});

const Comment = new mongoose.model("Comment", commentSchema);

app.get("/api/gallery/comment", (req, res) => {
  if (req.query.picture_id) {
    Picture.findById(req.query.picture_id, (err, picture) => {
      if (err) res.send("Unknown picture_id");
      if (picture) {
        Comment.find({ picture_id: req.query.picture_id }, (err, comments) => {
          if (err) res.json(err);

          res.json({
            _id: picture["_id"],
            count: log.length,
            comments: comments,
          });
        });
      }
    });
  } else {
    res.send("Unknown picture_id");
  }
});

const dateToUTC = (date) => {
  let dateUTC = date.toUTCString().split(" ").slice(0, 4);
  [dateUTC[1], dateUTC[2]] = [dateUTC[2], dateUTC[1]];
  dateUTC = dateUTC.join(" ").replace(",", "");
  return dateUTC;
};

app.post("/api/gallery/add-comment", (req, res) => {
  Picture.findById(req.body.picture_id, (err, picture) => {
    if (err) res.json({ error: err });

    const newComment = new Comment({
      author: req.body.author,
      picture_id: picture["_id"],
      text: req.body.text,
    });
    let commentDate = new Date();
    newComment.date = dateToUTC(commentDate);

    newComment.save();
    console.log("Created new comment!");
    console.log(newComment);

    res.json({
      _id: picture["_id"],
      author: newComment.author,
      text: newComment.text,
      date: newComment.date,
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
