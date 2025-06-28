require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, param, validationResult } = require("express-validator");

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet()); // Sécurise les en-têtes HTTP
app.use("/uploads", express.static("uploads"));
app.disable("x-powered-by"); // Cache le type de serveur

// Limite le nombre de requêtes pour éviter les attaques DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes
  message: "Trop de requêtes, veuillez réessayer plus tard."
});
app.use(limiter);

// Connexion sécurisée à la base de données avec un pool de connexions
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});

// Configuration sécurisée de multer
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seuls les fichiers JPG, PNG et WEBP sont autorisés !"), false);
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }); // Max 2MB

// Récupérer tous les produits par catégorie
app.get("/produits/:categorie", param("categorie").trim().escape(), (req, res) => {
  const { categorie } = req.params;
  db.query("SELECT * FROM produits WHERE categorie = ? ORDER BY RAND()", [categorie], (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur serveur" });
    res.json(result);
  });
});

// Ajouter un produit avec validation
app.post(
  "/produits",
  upload.single("image"),
  body("nom").notEmpty().trim().escape(),
  body("prix").isFloat().toFloat(),
  body("categorie").notEmpty().trim().escape(),
  body("type").notEmpty().trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.file) return res.status(400).json({ error: "Aucune image téléchargée" });

    const { nom, prix, categorie, type } = req.body;
    const imagePath = `/uploads/${req.file.filename}`;
    db.query("INSERT INTO produits (nom, prix, categorie, type, image) VALUES (?, ?, ?, ?, ?)", [nom, prix, categorie, type, imagePath], (err) => {
      if (err) return res.status(500).json({ error: "Erreur serveur" });
      res.json({ message: "Produit ajouté avec succès !" });
    });
  }
);

// Supprimer un produit avec validation
app.delete("/produits/:id", param("id").isInt(), (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM produits WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Erreur serveur" });
    res.json({ message: "Produit supprimé avec succès !" });
  });
});

// Route pour enregistrer un témoignage avec validation
app.post(
  "/api/testimonials/add",
  body("nom").notEmpty().trim().escape(),
  body("prenom").notEmpty().trim().escape(),
  body("email").isEmail().normalizeEmail(),
  body("testimonial").notEmpty().trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nom, prenom, email, testimonial } = req.body;
    db.query("INSERT INTO testimonials (nom, prenom, email, message) VALUES (?, ?, ?, ?)", [nom, prenom, email, testimonial], (err) => {
      if (err) return res.status(500).json({ error: "Erreur serveur" });
      res.status(201).json({ message: "Témoignage enregistré avec succès !" });
    });
  }
);

// **Recherche de produits en temps réel**
app.get("/api/search", (req, res) => {
    const searchTerm = req.query.q;
    
    if (!searchTerm) {
        return res.status(400).json({ error: "Le terme de recherche est requis." });
    }

    const query = "SELECT * FROM produits WHERE nom LIKE ?";
    const searchValue = `%${searchTerm}%`;

    db.query(query, [searchValue], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
// **Rechercher un produit par nom (recherche en temps réel)**
app.get("/search", (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.json([]);
    }

    db.query("SELECT * FROM produits WHERE nom LIKE ?", [`%${query}%`], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Serveur sécurisé démarré sur le port ${PORT}`));