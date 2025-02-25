const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;  // Render assigns PORT dynamically

app.use(cors());
app.use(express.json());

// Serve static files under /VehicleData so image URLs work correctly
app.use("/VehicleData", express.static(path.join(__dirname, "../VehicleData")));

// Ensure VehicleData directory exists
const VEHICLE_DATA_DIR = path.join(__dirname, "../VehicleData");
fs.ensureDirSync(VEHICLE_DATA_DIR);

// Setup for database file
const DATABASE_FILE = path.join(__dirname, "../database.json");

function readDatabase() {
  if (fs.existsSync(DATABASE_FILE)) {
    return JSON.parse(fs.readFileSync(DATABASE_FILE, "utf8"));
  }
  return { customers: [], vehicles: [], serviceRequests: [] };
}

function writeDatabase(db) {
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(db, null, 2));
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const vehicleId = req.body.vehicleId;
    let uploadPath = path.join(VEHICLE_DATA_DIR, vehicleId);
    if (req.body.folder) {
      uploadPath = path.join(uploadPath, req.body.folder);
    }
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 📸 Upload Photos
app.post("/upload", upload.array("photos", 10), (req, res) => {
  res.json({ message: "Photos uploaded successfully!" });
});

// 🖼 Fetch Photos for a Vehicle with optional folder parameter
app.get("/photos/:vehicleId/:folder?", (req, res) => {
  const vehicleId = req.params.vehicleId;
  const folder = req.params.folder;
  let vehiclePath = path.join(VEHICLE_DATA_DIR, vehicleId);
  if (folder) {
    vehiclePath = path.join(vehiclePath, folder);
  }
  if (!fs.existsSync(vehiclePath)) return res.json({ photos: [] });

  const photos = fs.readdirSync(vehiclePath).map(file => 
    `/VehicleData/${vehicleId}${folder ? '/' + folder : ''}/${file}`
  );
  res.json({ photos });
});

// ❌ Delete a Photo
app.post("/delete_photo", (req, res) => {
  const { vehicleId, photoPath } = req.body;
  const prefix = `/VehicleData/${vehicleId}/`;
  const relativePath = photoPath.startsWith(prefix) ? photoPath.slice(prefix.length) : path.basename(photoPath);
  const filePath = path.join(VEHICLE_DATA_DIR, vehicleId, relativePath);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ message: "Photo deleted successfully!" });
  } else {
    res.status(404).json({ message: "Photo not found!" });
  }
});

// 📂 Create a Folder
app.post("/create_folder", (req, res) => {
  const { vehicleId, folderName } = req.body;
  const folderPath = path.join(VEHICLE_DATA_DIR, vehicleId, folderName);
  
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    res.json({ message: "Folder created successfully!" });
  } else {
    res.status(400).json({ message: "Folder already exists!" });
  }
});

// 🗂 Fetch Folders for a Vehicle
app.get("/folders/:vehicleId", (req, res) => {
  const vehicleId = req.params.vehicleId;
  const vehiclePath = path.join(VEHICLE_DATA_DIR, vehicleId);
  
  if (!fs.existsSync(vehiclePath)) return res.json({ folders: [] });
  
  const folders = fs.readdirSync(vehiclePath).filter(file =>
    fs.lstatSync(path.join(vehiclePath, file)).isDirectory()
  );
  res.json({ folders });
});

// ❌ Delete a Folder
app.post("/delete_folder", (req, res) => {
  const { vehicleId, folderName } = req.body;
  const folderPath = path.join(VEHICLE_DATA_DIR, vehicleId, folderName);
  
  if (fs.existsSync(folderPath)) {
    fs.removeSync(folderPath);
    res.json({ message: "Folder deleted successfully!" });
  } else {
    res.status(404).json({ message: "Folder not found!" });
  }
});

// 🏁 **Service Request API Routes** 🏁

// ✅ Fetch All Customers
app.get("/get_customers", (req, res) => {
    let db = readDatabase();
    res.json(db.customers);
});

// ✅ Fetch Vehicles for a Specific Customer
app.get("/get_vehicles", (req, res) => {
    let db = readDatabase();
    const customerId = req.query.customerId;
    res.json(db.vehicles.filter(v => v.customerId === customerId));
});

// ✅ Save a New Customer
app.post("/save_customer", (req, res) => {
    const customer = req.body;
    let db = readDatabase();
    db.customers.push(customer);
    writeDatabase(db);
    res.json({ message: "Customer saved successfully!" });
});

// ✅ Save a New Vehicle
app.post("/save_vehicle", (req, res) => {
    const vehicle = req.body;
    let db = readDatabase();
    db.vehicles.push(vehicle);
    writeDatabase(db);
    res.json({ message: "Vehicle saved successfully!" });
});

// ✅ Save a Service Request
app.post("/save_service_request", (req, res) => {
    let db = readDatabase();
    const newRequest = req.body;
    db.serviceRequests = db.serviceRequests || [];
    db.serviceRequests.push(newRequest);
    writeDatabase(db);
    res.json({ message: "Service request saved successfully!" });
});

// ✅ Fetch All Service Requests (Optional)
app.get("/get_service_requests", (req, res) => {
    let db = readDatabase();
    res.json(db.serviceRequests);
});

// ✅ Fetch Service Requests by Customer
app.get("/get_service_requests_by_customer", (req, res) => {
    let db = readDatabase();
    const customerId = req.query.customerId;
    res.json(db.serviceRequests.filter(sr => sr.customerId === customerId));
});

// ✅ Fetch Service Requests by Vehicle
app.get("/get_service_requests_by_vehicle", (req, res) => {
    let db = readDatabase();
    const vehicleId = req.query.vehicleId;
    res.json(db.serviceRequests.filter(sr => sr.vehicleId === vehicleId));
});

// ✅ Delete a Service Request (Optional)
app.post("/delete_service_request", (req, res) => {
    let db = readDatabase();
    const { requestId } = req.body;
    db.serviceRequests = db.serviceRequests.filter(sr => sr.id !== requestId);
    writeDatabase(db);
    res.json({ message: "Service request deleted successfully!" });
});

// API Root Endpoint
app.get("/", (req, res) => {
  res.send("🚀 API is running! Use the correct endpoints.");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
