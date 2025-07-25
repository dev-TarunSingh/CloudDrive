import Folder from "../models/Folder.js";
import Image from "../models/Image.js";

export const createFolder = async (req, res) => {
  const { name, parentId } = req.body;
  const folder = new Folder({ name, parentId, userId: req.user.id });
  console.log("Creating folder:", folder);

  await Folder.findByIdAndUpdate(parentId, { hasChildren: true });
  console.log("Updated parent folder to have children:", parentId);
  await folder.save();
  res.json(folder);
};

export const getContent = async (req, res) => {
  try {
    const parentId = req.query.parentId || null;
    const userId = req.user.id;

    // Fetch direct folders and images only
    const [folders, images] = await Promise.all([
      Folder.find({ parentId, userId }),
      Image.find({ folderId: parentId, userId }),
    ]);

    res.json({ folders, images });
  } catch (error) {
    console.error("Failed to load folder contents:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFolders = async (req, res) => {
  try {
    const parentId = req.query.parent || null;

    const [folders, images] = await Promise.all([
      Folder.find({
        userId: req.user.id,
        parentId: parentId,
      }),
      Image.find({
        userId: req.user.id,
        folderId: parentId,
      }),
    ]);

    res.json({ folders, images });
  } catch (error) {
    console.error("Error fetching folder contents:", error.message);
    res.status(500).json({ message: "Failed to load folder contents" });
  }
};

export const getAllFolders = async (req, res) => {
  try {
    const userId = req.user.id;
    const folders = await Folder.find({ userId }).lean();
    res.json({ folders });
  } catch (error) {
    console.error("Error fetching all folders:", error.message);
    res.status(500).json({ message: "Failed to load all folders" });
  }
};

export const getContentRecursive = async (req, res) => {
  try {
    const parentId = req.query.parentId || null;
    const userId = req.user.id;

    // Recursive function to get all descendant folder IDs
    const getDescendantFolderIds = async (folderId) => {
      const childFolders = await Folder.find({ parentId: folderId, userId }).lean();
      let ids = childFolders.map((f) => f._id.toString());
      for (const child of childFolders) {
        const childIds = await getDescendantFolderIds(child._id);
        ids = ids.concat(childIds);
      }
      return ids;
    };

    const descendantFolderIds = await getDescendantFolderIds(parentId);
    const allFolderIds = parentId ? [parentId, ...descendantFolderIds] : descendantFolderIds;

    // Fetch folders directly under parentId
    const folders = await Folder.find({ parentId, userId });

    // Fetch images in parent folder and all descendant folders
    const images = await Image.find({ folderId: { $in: allFolderIds }, userId });

    res.json({ folders, images });
  } catch (error) {
    console.error("Failed to load recursive folder contents:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteFolder = async (req, res) => {
  const { id } = req.params;
  await Folder.deleteOne({ _id: id, userId: req.user.id });
  await Folder.deleteMany({ parentId: id, userId: req.user.id });
  await Image.deleteMany({ folderId: id, userId: req.user.id });
  res.json({ message: "Folder and its contents deleted" });
};
