const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the public directory

// MongoDB connection
mongoose.connect('mongodb+srv://adt:adtsh@store.inpfb.mongodb.net/store?retryWrites=true&w=majority&appName=store', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Schema definition
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    weight: String, // Allow text input for weight
    image: { data: Buffer, contentType: String },
});

const Product = mongoose.model('Product', productSchema);

// File upload configuration using multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add a new product
app.post('/api/products', upload.single('product_image'), async (req, res) => {
    try {
        const product = new Product({
            name: req.body.product_name,
            price: req.body.product_price,
            description: req.body.product_description,
            weight: req.body.product_weight,
            image: {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            },
        });
        await product.save();
        res.status(201).json({ message: 'Product added successfully!' });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Failed to add product' });
    }
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

// Get a single product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
});

// Serve product images
app.get('/api/products/:id/image', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || !product.image.data) {
            return res.status(404).json({ message: 'Image not found' });
        }
        res.set('Content-Type', product.image.contentType);
        res.send(product.image.data);
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).json({ message: 'Failed to fetch image' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
