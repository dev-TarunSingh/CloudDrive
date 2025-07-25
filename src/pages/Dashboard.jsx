// Dashboard.jsx

import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Avatar,
  IconButton,
  TextField,
  Container,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import FolderIcon from "@mui/icons-material/Folder";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import axios from "axios";

export default function Dashboard() {
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [folderStack, setFolderStack] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState({ username: "", email: "" });
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [openFolderDialog, setOpenFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const currentFolderId =
    folderStack.length > 0 ? folderStack[folderStack.length - 1]._id : null;

  const fetchFolderContents = (folderId = null) => {
    axios
      .get(`http://localhost:5000/api/folders/contents?parent=${folderId || ""}`, {
        headers,
      })
      .then((res) => {
        setFolders(res.data.folders || []);
        setImages(res.data.images || []);
      })
      .catch(() => {
        setAlert({
          open: true,
          message: "Failed to load folder contents.",
          severity: "error",
        });
      });
  };

  useEffect(() => {
    if (!token) return;

    axios
      .get("http://localhost:5000/api/user/profile", { headers })
      .then((res) => setUser(res.data))
      .catch((err) => {
        const message = err?.response?.data?.message || "Something went wrong";
        if (message === "Invalid token" || message === "Unauthorized") {
          setAlert({
            open: true,
            message: "Session expired. Please login again.",
            severity: "error",
          });
          localStorage.clear();
          setTimeout(() => (window.location.href = "/"), 1500);
        } else {
          setAlert({ open: true, message, severity: "error" });
        }
      });
  }, [token]);

  useEffect(() => {
    if (token) fetchFolderContents(currentFolderId);
  }, [token, currentFolderId, refreshFlag]);

  const triggerRefresh = () => setRefreshFlag((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleCreateFolder = () => {
    if (!folderName.trim()) {
      setAlert({
        open: true,
        message: "Folder name cannot be empty",
        severity: "warning",
      });
      return;
    }
    axios
      .post(
        "http://localhost:5000/api/folders",
        { name: folderName, parent: currentFolderId },
        { headers }
      )
      .then(() => {
        setAlert({ open: true, message: "Folder created", severity: "success" });
        setOpenFolderDialog(false);
        setFolderName("");
        triggerRefresh();
      })
      .catch(() => {
        setAlert({ open: true, message: "Failed to create folder", severity: "error" });
      });
  };

  const uploadFiles = (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    if (currentFolderId) formData.append("folder", currentFolderId);

    axios
      .post("http://localhost:5000/api/images/upload", formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        setAlert({ open: true, message: "Images uploaded", severity: "success" });
        triggerRefresh();
      })
      .catch(() => {
        setAlert({ open: true, message: "Image upload failed", severity: "error" });
      });
  };

  const openFolder = (folder) => {
    setFolderStack((prev) => {
      const newStack = [...prev, folder];
      fetchFolderContents(folder._id);
      return newStack;
    });
  };

  const goToFolder = (index) => {
    const newStack = folderStack.slice(0, index + 1);
    const newFolder = newStack[newStack.length - 1];
    setFolderStack(newStack);
    fetchFolderContents(newFolder?._id || null);
  };

  const goToRoot = () => {
    setFolderStack([]);
    fetchFolderContents(null);
  };

  const handleMenuOpen = (e, item) => {
    setAnchorEl(e.currentTarget);
    setMenuTarget(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTarget(null);
  };

  const handleDownload = () => {
    if (menuTarget?.filename) {
      const link = document.createElement("a");
      link.href = `http://localhost:5000/uploads/${menuTarget.filename}`;
      link.download = menuTarget.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    const url = menuTarget.filename
      ? `http://localhost:5000/api/images/${menuTarget._id}`
      : `http://localhost:5000/api/folders/${menuTarget._id}`;

    axios
      .delete(url, { headers })
      .then(() => {
        setAlert({
          open: true,
          message: `${menuTarget.filename ? "Image" : "Folder"} deleted`,
          severity: "success",
        });
        triggerRefresh();
      })
      .catch(() => {
        setAlert({ open: true, message: "Delete failed", severity: "error" });
      });

    handleMenuClose();
  };

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredImages = images.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "#1976d2" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">MyDrive</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              size="small"
              placeholder="Search..."
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ background: "white", borderRadius: 1 }}
            />
            <Avatar>{user.username?.[0]?.toUpperCase() || "?"}</Avatar>
            <Typography>{user.username}</Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <IconButton onClick={goToRoot}>
            <HomeIcon />
          </IconButton>
          {folderStack.map((f, i) => (
            <Box key={f._id} display="flex" alignItems="center" gap={1}>
              <ChevronRightIcon />
              <Button onClick={() => goToFolder(i)}>{f.name}</Button>
            </Box>
          ))}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">All Folders and Images</Typography>
          <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={() => setOpenFolderDialog(true)}>
              Create Folder
            </Button>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
            >
              Upload Images
              <input
                hidden
                multiple
                type="file"
                onChange={(e) => uploadFiles(Array.from(e.target.files))}
              />
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {filteredFolders.map((folder) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={folder._id}>
              <Paper
                sx={{
                  p: 2,
                  position: "relative",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <Box onClick={() => openFolder(folder)}>
                  <FolderIcon sx={{ fontSize: 40, color: "#1976d2" }} />
                  <Typography>{folder.name}</Typography>
                </Box>
                <IconButton
                  size="small"
                  sx={{ position: "absolute", top: 4, right: 4 }}
                  onClick={(e) => handleMenuOpen(e, folder)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Paper>
            </Grid>
          ))}

          {filteredImages.map((img) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={img._id}>
              <Paper sx={{ p: 1, textAlign: "center", position: "relative" }}>
                <img
                  src={`http://localhost:5000/uploads/${img.filename}`}
                  alt={img.name}
                  style={{
                    maxWidth: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/fallback.png";
                  }}
                />
                <Typography variant="body2" mt={1}>
                  {img.name}
                </Typography>
                <IconButton
                  size="small"
                  sx={{ position: "absolute", top: 4, right: 4 }}
                  onClick={(e) => handleMenuOpen(e, img)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {menuTarget?.filename && <MenuItem onClick={handleDownload}>Download</MenuItem>}
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>

      <Dialog open={openFolderDialog} onClose={() => setOpenFolderDialog(false)}>
        <DialogTitle>Create Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Folder Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFolderDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder}>Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </>
  );
}
