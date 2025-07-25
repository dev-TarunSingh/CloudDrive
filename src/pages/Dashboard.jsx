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
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import FolderIcon from "@mui/icons-material/Folder";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import axios from "axios";

export default function Dashboard() {
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [folderStack, setFolderStack] = useState([]);

  // New state for folder switch snackbar
  const [folderSwitchSnackbar, setFolderSwitchSnackbar] = useState({
    open: false,
    message: "",
  });

  const toggleExpand = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };
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
  const [searchResults, setSearchResults] = useState({ folders: [], images: [] });
  const [isSearching, setIsSearching] = useState(false);

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1]._id : null;

  useEffect(() => {
    if (!token) return;

    axios
      .get("http://localhost:5000/api/user/profile", { headers })
      .then((res) => {setUser(res.data); console.log("User data fetched:", res.data)})
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
    if (token && !isSearching) {
      axios
        .get("http://localhost:5000/api/folders/contents/recursive?parentId=" + (currentFolderId || ""), { headers })
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
    }
  }, [token, refreshFlag, currentFolderId, isSearching]);

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
        { name: folderName, parentId: currentFolderId },
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

  const getDirectoryPath = () => {
    if (folderStack.length === 0) return "Root Folder";
    return folderStack.map((folder) => folder.name).join(" / ");
  };

  const openFolder = (folder) => {
    setFolderStack((prev) => {
      const newStack = [...prev, folder];
      setFolderSwitchSnackbar({
        open: true,
        message: `Switched to: ${newStack.map((f) => f.name).join(" / ")}`,
      });
      return newStack;
    });
  };

  const goToFolder = (index) => {
    setFolderStack((prev) => {
      const newStack = prev.slice(0, index + 1);
      setFolderSwitchSnackbar({
        open: true,
        message: `Switched to: ${newStack.map((f) => f.name).join(" / ")}`,
      });
      return newStack;
    });
  };

  const goToRoot = () => {
    setFolderStack([]);
    setFolderSwitchSnackbar({
      open: true,
      message: "Switched to: Root Folder",
    });
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

  const filteredSearchFolders = searchResults.folders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSearchImages = searchResults.images.filter((img) =>
    img.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderFolder = (folder) => {
    return (
      <Box key={folder._id} sx={{ pl: 2, borderLeft: "1px solid #ccc", mb: 1 }}>
        <ListItem
          button
          onClick={() => openFolder(folder)}
          sx={{ pl: 0, cursor: "pointer" }}
        >
          <ListItemIcon>
            <FolderIcon sx={{ color: "#1976d2" }} />
          </ListItemIcon>
          <ListItemText primary={folder.name} />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e, folder);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </ListItem>
      </Box>
    );
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearch(query);

    if (query.trim() === "") {
      setIsSearching(false);
      setSearchResults({ folders: [], images: [] });
      return;
    }

    setIsSearching(true);

    axios
      .get(`http://localhost:5000/api/images/search?query=${encodeURIComponent(query)}`, { headers })
      .then((res) => {
        setSearchResults({ folders: [], images: res.data });
      })
      .catch(() => {
        setAlert({
          open: true,
          message: "Failed to search images.",
          severity: "error",
        });
      });

  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "#1976d2" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ cursor: "pointer" }} onClick={goToRoot}>
            MyDrive
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              size="small"
              placeholder="Search..."
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          {/* Breadcrumb navigation for folder path */}
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
            <Typography
              variant="body1"
              sx={{ cursor: "pointer", color: "#1976d2" }}
              onClick={goToRoot}
            >
              Root
            </Typography>
            {folderStack.map((folder, index) => (
              <React.Fragment key={folder._id}>
                <ChevronRightIcon fontSize="small" sx={{ color: "#666" }} />
                <Typography
                  variant="body1"
                  sx={{ cursor: "pointer", color: "#1976d2" }}
                  onClick={() => goToFolder(index)}
                >
                  {folder.name}
                </Typography>
              </React.Fragment>
            ))}
          </Box>
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

        <List>
          {isSearching ? (
            filteredSearchFolders.length > 0 ? (
              filteredSearchFolders.map((folder) => renderFolder(folder))
            ) : (
              <Typography>No folders found.</Typography>
            )
          ) : filteredFolders.length > 0 ? (
            filteredFolders.map((folder) => renderFolder(folder))
          ) : (
            <Typography>No folders found.</Typography>
          )}
        </List>

        <Box mt={4}>
          <Typography variant="h6">
            {isSearching
              ? `Search Results for "${search}"`
              : `Images in ${folderStack.length > 0 ? folderStack[folderStack.length - 1].name : "Root Folder"}`}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {(isSearching ? filteredSearchImages : images).map((img) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={img._id}>
                <Paper sx={{ p: 1, textAlign: "center", position: "relative" }}>
                  <img
                    src={`http://localhost:5000${img.url}`}
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
        </Box>
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

      {/* Snackbar for folder switch */}
      <Snackbar
        open={folderSwitchSnackbar.open}
        autoHideDuration={3000}
        onClose={() => setFolderSwitchSnackbar({ ...folderSwitchSnackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setFolderSwitchSnackbar({ ...folderSwitchSnackbar, open: false })}
          severity="info"
          variant="filled"
        >
          {folderSwitchSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
