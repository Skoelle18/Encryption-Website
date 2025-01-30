const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

const usersFile = 'users.json';
const secretKey = 'your_secret_key';

app.use(express.json());
app.use(express.static('public'));  

// Set up storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware to serve static files (like your HTML, CSS, JS)
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html')); // Serve login.html at root
});

// Function to read users from file
const readUsers = () => {
    if (!fs.existsSync(usersFile)) return [];
    return JSON.parse(fs.readFileSync(usersFile));
};

// Function to write users to file
const writeUsers = (users) => {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// Registration route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    if (users.some(user => user.username === username)) {
        return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    writeUsers(users);
    res.json({ message: 'Registration successful' });
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(user => user.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' });
    res.json({ success: true, token }); // Send success and token
});


// Middleware to verify token
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

// Protected route example
app.get('/protected', authenticate, (req, res) => {
    res.json({ message: `Hello, ${req.user.username}!` });
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Caesar Cipher routes
app.post('/encrypt/caesar', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const outputFile = `uploads/encrypted_${req.file.filename}`;
    const mode = "encrypt";

    // Call the Caesar encryption program with file path
    exec(`./caesar ${mode} ${filePath} ${outputFile}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Caesar Encryption failed');
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send('Caesar Encryption failed');
        }

        res.download(outputFile, (err) => {
            if (err) throw err;
            fs.unlinkSync(filePath); // Delete the uploaded file after download
            fs.unlinkSync(outputFile); // Delete the encrypted file after download
        });
    });
});

app.post('/decrypt/caesar', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const outputFile = `uploads/decrypted_${req.file.filename}`;
    const mode = "decrypt";

    // Call the Caesar encryption program with file path
    exec(`./caesar ${mode} ${filePath} ${outputFile}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Caesar decryption failed');
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send('Caesar decryption failed');
        }

        res.download(outputFile, (err) => {
            if (err) throw err;
            fs.unlinkSync(filePath); // Delete the uploaded file after download
            fs.unlinkSync(outputFile); // Delete the encrypted file after download
        });
    });
});

// XOR Encryption routes
app.post('/encrypt/xor', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const key = req.body.key;
    const outputFile = `uploads/encrypted_${req.file.filename}`;
    const mode = "encrypt";

    // Call the Caesar encryption program with file path
    exec(`./XOR ${mode} ${filePath} ${outputFile} ${key}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('XOR Encryption failed');
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send('XOR Encryption failed');
        }

        res.download(outputFile, (err) => {
            if (err) throw err;
            fs.unlinkSync(filePath); // Delete the uploaded file after download
            fs.unlinkSync(outputFile); // Delete the encrypted file after download
        });
    });
});

app.post('/decrypt/xor', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const key = req.body.key;
    const outputFile = `uploads/decrypted_${req.file.filename}`;
    const mode = "decrypt";

    // Call the Caesar encryption program with file path
    exec(`./XOR ${mode} ${filePath} ${outputFile} ${key}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('XOR Decryption failed');
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send('XOR Decryption failed');
        }

        res.download(outputFile, (err) => {
            if (err) throw err;
            fs.unlinkSync(filePath); // Delete the uploaded file after download
            fs.unlinkSync(outputFile); // Delete the encrypted file after download
        });
    });
});

// Route to generate RSA keys
app.get('/generate/rsa-keys', (req, res) => {
    exec('./keygen', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Key generation failed');
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send('Key generation failed');
        }

        // Parse output from keygen program
        const output = stdout.split('\n');
        const modulus = output[0].replace("Modulus (n): ", "").trim();
        const privateKey = output[1].replace("Private Key (d): ", "").trim();

        // Send public and private keys as a response
        res.json({ publicKey: modulus, privateKey: privateKey });
    });
});


// RSA Encryption routes
app.post('/encrypt/rsa', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const publicKey = req.body.publicKey;
    const outputFile = `uploads/encrypted_${req.file.filename}`;

    // Call the RSA encryption program with public key and file path
    exec(`./encryption ${filePath} ${outputFile} ${publicKey}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('RSA Encryption failed');
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send('RSA Encryption failed');
        }

        res.download(outputFile, (err) => {
            if (err) throw err;
            fs.unlinkSync(filePath); // Delete the uploaded file after download
            fs.unlinkSync(outputFile); // Delete the encrypted file after download
        });
    });
});

// RSA Decryption routes
app.post('/decrypt/rsa', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const publicKey = req.body.publicKey;
    const privateKey = req.body.privateKey;
    const outputFile = `uploads/decrypted_${req.file.filename}`;

    // Call the RSA decryption program with both public and private keys and file path
    exec(`./decryption ${filePath} ${outputFile} ${privateKey} ${publicKey}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('RSA Decryption failed');
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send('RSA Decryption failed');
        }

        res.download(outputFile, (err) => {
            if (err) throw err;
            fs.unlinkSync(filePath); // Delete the uploaded file after download
            fs.unlinkSync(outputFile); // Delete the decrypted file after download
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}/login.html`);
});
