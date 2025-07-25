import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  name: String,
  url: String,
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Image = mongoose.model("Image", ImageSchema);

export default Image;
