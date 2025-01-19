const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const port = 3000;

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

// Caesar Cipher routes
app.post('/encrypt/caesar', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const outputFile = `uploads/encrypted_${req.file.filename}`;

    // Caesar Cipher encryption logic (shift by 3)
    // Implement your Caesar Cipher encryption here, output to the encrypted file

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) throw err;
        const encryptedData = data.replace(/[a-zA-Z]/g, char => {
            const base = char >= 'a' && char <= 'z' ? 'a' : 'A';
            return String.fromCharCode(((char.charCodeAt(0) - base.charCodeAt(0) + 3) % 26) + base.charCodeAt(0));
        });
        fs.writeFile(outputFile, encryptedData, 'utf8', (err) => {
            if (err) throw err;
            res.download(outputFile, (err) => {
                if (err) throw err;
                fs.unlinkSync(filePath); // Delete the uploaded file after download
                fs.unlinkSync(outputFile); // Delete the encrypted file after download
            });
        });
    });
});

app.post('/decrypt/caesar', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const outputFile = `uploads/decrypted_${req.file.filename}`;

    // Caesar Cipher decryption logic (shift by -3)
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) throw err;
        const decryptedData = data.replace(/[a-zA-Z]/g, char => {
            const base = char >= 'a' && char <= 'z' ? 'a' : 'A';
            return String.fromCharCode(((char.charCodeAt(0) - base.charCodeAt(0) - 3 + 26) % 26) + base.charCodeAt(0));
        });
        fs.writeFile(outputFile, decryptedData, 'utf8', (err) => {
            if (err) throw err;
            res.download(outputFile, (err) => {
                if (err) throw err;
                fs.unlinkSync(filePath); // Delete the uploaded file after download
                fs.unlinkSync(outputFile); // Delete the decrypted file after download
            });
        });
    });
});

// XOR Encryption routes
app.post('/encrypt/xor', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const key = req.body.key;
    const outputFile = `uploads/encrypted_${req.file.filename}`;

    // XOR Encryption logic using the provided key
    fs.readFile(filePath, (err, data) => {
        if (err) throw err;
        const encryptedData = data.map(byte => byte ^ key.charCodeAt(0));
        fs.writeFile(outputFile, encryptedData, (err) => {
            if (err) throw err;
            res.download(outputFile, (err) => {
                if (err) throw err;
                fs.unlinkSync(filePath);
                fs.unlinkSync(outputFile);
            });
        });
    });
});

app.post('/decrypt/xor', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const key = req.body.key;
    const outputFile = `uploads/decrypted_${req.file.filename}`;

    // XOR Decryption logic using the provided key (same as encryption)
    fs.readFile(filePath, (err, data) => {
        if (err) throw err;
        const decryptedData = data.map(byte => byte ^ key.charCodeAt(0));
        fs.writeFile(outputFile, decryptedData, (err) => {
            if (err) throw err;
            res.download(outputFile, (err) => {
                if (err) throw err;
                fs.unlinkSync(filePath);
                fs.unlinkSync(outputFile);
            });
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
    console.log(`Server is running at http://localhost:${port}`);
});
