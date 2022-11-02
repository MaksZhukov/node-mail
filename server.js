import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import multer from "multer";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const upload = multer({ dest: "uploads/" });

let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const app = express();
app.use(limiter);
app.use(bodyParser.json());
const port = 3000 || process.env.PORT;

app.post("/email", upload.single("file"), async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await transporter.sendMail({
      from: `<${email}>`,
      to: `<${process.env.SMTP_USER}>`,
      subject: `Заявка от ${name}`,
      text: message,
      attachments: req.file
        ? [{ filename: req.file.originalname, path: req.file.path }]
        : [],
    });
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.send("ok");
  } catch (err) {
    res.status(500);
  }
});

app.get('/', (req,res)=> {
    res.send('ok'); 
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
