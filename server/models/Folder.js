import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
  name: String,
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hasChildren: {
    type: Boolean,
    default: false,
  },
});

const Folder = mongoose.model("Folder", FolderSchema);

export default Folder;